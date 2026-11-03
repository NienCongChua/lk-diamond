"""Synthetic engine tests; do not exercise Locket or Shadowrocket."""
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'experimental'))
from native_photobooth import BoothEngine, FRAMES, LAYOUTS, MAX_BYTES, artwork, compose, normalize_image


def photo(color='red', size=(400, 500)):
    out = io.BytesIO()
    Image.new('RGB', size, color).save(out, 'PNG')
    return out.getvalue()


class NativeEngineTest(unittest.TestCase):
    def test_four_captures_fill_correct_slots(self):
        engine = BoothEngine()
        sid = engine.start()
        colors = ['red', 'green', 'blue', 'yellow']
        for i, color in enumerate(colors, 1):
            result = engine.capture(sid, str(i), i, photo(color))
            self.assertEqual((result['count'], result['complete']), (i, i == 4))
        with Image.open(io.BytesIO(result['image'])) as image:
            self.assertEqual(image.size, (1600, 1600))
            # AI frame window coordinates are measured from its actual alpha holes.
            for slot, color in zip(FRAMES['cat_cafe']['art_slots'], colors):
                x = round((slot[0]+slot[2]/2)*1600)
                y = round((slot[1]+slot[3]/2)*1600)
                actual = image.getpixel((x, y))
                expected = Image.new('RGB', (1, 1), color).getpixel((0, 0))
                self.assertLessEqual(max(abs(a-b) for a,b in zip(actual, expected)), 2)

    def test_retry_is_idempotent_even_after_later_capture(self):
        e = BoothEngine(); sid = e.start(); raw = photo()
        first = e.capture(sid, 'one', 1, raw)
        e.capture(sid, 'two', 2, photo('blue'))
        self.assertEqual(e.capture(sid, 'one', 1, raw), first)
        self.assertEqual(e.preview(sid)['count'], 2)

    def test_same_photo_can_be_two_intentional_captures(self):
        e = BoothEngine(); sid = e.start(); raw = photo()
        e.capture(sid, 'one', 1, raw)
        self.assertEqual(e.capture(sid, 'two', 2, raw)['count'], 2)

    def test_retry_conflict_and_out_of_order_rejected(self):
        e = BoothEngine(); sid = e.start()
        e.capture(sid, 'one', 1, photo())
        with self.assertRaises(ValueError): e.capture(sid, 'one', 1, photo('blue'))
        with self.assertRaises(ValueError): e.capture(sid, 'three', 3, photo())
        with self.assertRaises(ValueError): e.capture(sid, 'two', True, photo())
        self.assertEqual(e.preview(sid)['count'], 1)

    def test_session_isolation_deletion_and_expiry(self):
        clock = [0]
        e = BoothEngine(ttl=10, clock=lambda: clock[0])
        a, b = e.start(), e.start()
        e.capture(a, 'one', 1, photo())
        self.assertEqual(e.preview(b)['count'], 0)
        e.delete(a)
        with self.assertRaises(ValueError): e.preview(a)
        clock[0] = 10
        e.expire()
        self.assertEqual(e._sessions, {})

    def test_capacity_and_invalid_presets(self):
        e = BoothEngine(max_sessions=1)
        with self.assertRaises(ValueError): e.start(frame='invented')
        with self.assertRaises(ValueError): e.start(caption='x'*61)
        with self.assertRaises(ValueError): e.start(caption='a\nb')
        e.start()
        with self.assertRaises(ValueError): e.start()

    def test_invalid_image_does_not_advance_session(self):
        e = BoothEngine(); sid = e.start()
        for raw in (b'garbage', b'', b'x'*(MAX_BYTES+1)):
            with self.assertRaises(ValueError): e.capture(sid, 'one', 1, raw)
        self.assertEqual(e.preview(sid)['count'], 0)

    def test_failed_render_does_not_commit_capture(self):
        e = BoothEngine(); sid = e.start()
        with patch('native_photobooth.compose', side_effect=RuntimeError('synthetic failure')):
            with self.assertRaises(RuntimeError): e.capture(sid, 'one', 1, photo())
        self.assertEqual(e.capture(sid, 'one', 1, photo())['count'], 1)

    def test_completed_session_requires_explicit_new_session(self):
        e = BoothEngine(); sid = e.start(layout='polaroid')
        self.assertTrue(e.capture(sid, 'one', 1, photo())['complete'])
        with self.assertRaises(ValueError): e.capture(sid, 'new', 1, photo())
        with self.assertRaises(ValueError): e.capture(sid, 'two', 2, photo())

    def test_exif_orientation_and_alpha(self):
        raw = io.BytesIO(); src = Image.new('RGB', (80, 40), 'red')
        exif = Image.Exif(); exif[274] = 6; src.save(raw, 'JPEG', exif=exif)
        self.assertEqual(normalize_image(raw.getvalue()).size, (40, 80))
        raw = io.BytesIO(); Image.new('RGBA', (10, 10), (0,0,0,0)).save(raw, 'PNG')
        self.assertEqual(normalize_image(raw.getvalue()).getpixel((5,5)), (255,255,255))

    def test_animation_and_oversized_dimensions_rejected(self):
        raw = io.BytesIO()
        Image.new('RGB', (10, 10), 'red').save(raw, 'PNG', save_all=True, append_images=[Image.new('RGB', (10, 10), 'blue')])
        with self.assertRaises(ValueError): normalize_image(raw.getvalue())
        with self.assertRaises(ValueError): normalize_image(photo(size=(12001, 1)))

    def test_all_frames_offer_square_output_without_changing_layout(self):
        images = [Image.new('RGB', (100, 150), 'teal')]*4
        for frame, spec in FRAMES.items():
            with self.subTest(frame=frame):
                count = len(spec['art_slots'])
                with Image.open(io.BytesIO(compose(images[:count], frame_id=frame, output='square'))) as img:
                    self.assertEqual(img.size, (1600, 1600))

    def test_every_ai_frame_fills_all_its_slots_and_keeps_aspect_ratio(self):
        colors = ['red', 'green', 'blue', 'yellow']
        self.assertEqual({f['art_layout'] for f in FRAMES.values()}, set(LAYOUTS))
        for frame, spec in FRAMES.items():
            with self.subTest(frame=frame):
                engine = BoothEngine()
                sid = engine.start(frame=frame)
                count = len(spec['art_slots'])
                self.assertEqual(engine.info(sid)['total'], count)
                for i in range(count):
                    result = engine.capture(sid, str(i), i+1, photo(colors[i]))
                    self.assertEqual(result['complete'], i+1 == count)
                with Image.open(io.BytesIO(result['image'])) as img:
                    w, h = artwork(frame).size
                    self.assertAlmostEqual(img.width/img.height, w/h, delta=.001)
                    self.assertEqual(max(img.size), 1600)
                    for i, (x,y,sw,sh) in enumerate(spec['art_slots']):
                        actual = img.getpixel((round((x+sw/2)*img.width),round((y+sh/2)*img.height)))
                        expected = Image.new('RGB',(1,1),colors[i]).getpixel((0,0))
                        self.assertLessEqual(max(abs(a-b) for a,b in zip(actual,expected)),6)

    def test_incompatible_frame_is_rejected_without_losing_photos(self):
        e = BoothEngine()
        with self.assertRaises(ValueError):e.start(frame='film_strip4',layout='duo')
        with self.assertRaises(ValueError):e.start(output='stretch')
        sid=e.start(frame='cherry_strip3')
        before=e.capture(sid,'one',1,photo())
        with self.assertRaises(ValueError):e.restyle(sid,frame='cat_cafe')
        self.assertEqual(e.preview(sid),before)
        self.assertEqual(e.info(sid)['frame'],'cherry_strip3')

    def test_square_strip_is_padded_and_preserves_all_four_photos(self):
        colors=['red','green','blue','yellow']
        photos=[Image.new('RGB',(100,150),c) for c in colors]
        with Image.open(io.BytesIO(compose(photos,frame_id='film_strip4',output='square'))) as img:
            w,h=artwork('film_strip4').size
            fitted_w=round(w*1600/h)
            left=(1600-fitted_w)//2
            for i,(x,y,sw,sh) in enumerate(FRAMES['film_strip4']['art_slots']):
                pixel=img.getpixel((left+round((x+sw/2)*fitted_w),round((y+sh/2)*1600)))
                expected=photos[i].getpixel((0,0))
                self.assertLessEqual(max(abs(a-b) for a,b in zip(pixel,expected)),6)


if __name__ == '__main__':
    unittest.main()
