"""In-memory capture/composition engine. No Locket wire protocol is assumed.

Run: python experimental/native_photobooth.py --demo experimental/demo
An eventual native adapter must map VERIFIED filter requests into start/capture.
This module does not open a camera, contact a service, or install a Locket filter.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import secrets
import time
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from threading import RLock

from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
LAYOUTS = {x['id']: x for x in json.loads((ROOT / 'photobooth/layouts.json').read_text(encoding='utf-8'))['layouts']}
FRAMES = {x['id']: x for x in json.loads((Path(__file__).with_name('photobooth_presets.json')).read_text(encoding='utf-8'))['frames']}
MAX_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 24_000_000


class BoothError(ValueError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def font(size: int, bold: bool = False):
    candidates = [
        'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    for name in candidates:
        if Path(name).is_file():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default(size=size)


def normalize_image(raw: bytes) -> Image.Image:
    if not isinstance(raw, bytes) or not raw or len(raw) > MAX_BYTES:
        raise ValueError('Image must contain 1 byte to 8 MiB.')
    try:
        with Image.open(io.BytesIO(raw)) as src:
            if src.format not in ('JPEG', 'PNG', 'WEBP'):
                raise ValueError('Use a JPEG, PNG or WebP still image.')
            if src.width * src.height > MAX_PIXELS or max(src.size) > 12000:
                raise ValueError('Image dimensions exceed the decoder limit.')
            if getattr(src, 'n_frames', 1) != 1:
                raise ValueError('Animated images are not supported.')
            src = ImageOps.exif_transpose(src)
            src.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            rgba = src.convert('RGBA')
            out = Image.new('RGB', rgba.size, 'white')
            out.paste(rgba, mask=rgba.getchannel('A'))
            return out
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError('Unreadable image.') from exc


def star_points(cx, cy, outer, inner, points=5):
    return [(cx + (outer if i % 2 == 0 else inner) * math.cos(i * math.pi / points - math.pi / 2),
             cy + (outer if i % 2 == 0 else inner) * math.sin(i * math.pi / points - math.pi / 2))
            for i in range(points * 2)]


def sticker(kind: str, size: int) -> Image.Image:
    """Original vector-style decorations rendered at 3x for antialiasing."""
    tile = Image.new('RGBA', (300, 300))
    d = ImageDraw.Draw(tile)
    ink, white = '#533C42', '#FFFBF3'
    if kind == 'cat':
        d.polygon([(55, 125), (42, 35), (120, 80), (180, 80), (258, 35), (245, 125)], fill='#D9AA7A', outline=ink, width=6)
        d.ellipse((45, 65, 255, 255), fill='#F9D4A5', outline=ink, width=6)
        d.polygon([(65, 78), (62, 58), (97, 81)], fill='#ED8E99')
        d.polygon([(203, 81), (238, 58), (235, 78)], fill='#ED8E99')
        for x in (105, 195):
            d.ellipse((x-9, 140, x+9, 162), fill=ink)
            d.ellipse((x-25, 170, x+18, 190), fill='#EE9DA0')
        d.polygon([(137, 169), (163, 169), (150, 182)], fill=ink)
        d.arc((123, 172, 150, 202), 0, 165, fill=ink, width=5)
        d.arc((150, 172, 177, 202), 15, 180, fill=ink, width=5)
        for y in (162, 184):
            d.line((30, y, 76, y+8), fill=ink, width=4)
            d.line((224, y+8, 270, y), fill=ink, width=4)
    elif kind == 'dino':
        d.polygon([(55, 158), (15, 204), (83, 205)], fill='#76B689', outline=ink, width=5)
        for x, y in [(80, 130), (100, 99), (127, 75)]:
            d.polygon([(x, y), (x-8, y-35), (x+27, y-10)], fill='#E6B25C', outline=ink, width=4)
        d.ellipse((62, 95, 215, 240), fill='#8ECB99', outline=ink, width=6)
        d.rounded_rectangle((124, 52, 270, 154), radius=44, fill='#8ECB99', outline=ink, width=6)
        d.ellipse((107, 150, 183, 222), fill='#D9EAB0')
        d.rounded_rectangle((90, 215, 127, 264), radius=12, fill='#8ECB99', outline=ink, width=5)
        d.rounded_rectangle((170, 215, 207, 264), radius=12, fill='#8ECB99', outline=ink, width=5)
        d.ellipse((213, 87, 229, 106), fill=ink)
        d.ellipse((224, 114, 250, 129), fill='#EBA1A3')
        d.arc((237, 103, 273, 139), 40, 140, fill=ink, width=4)
    elif kind == 'heart':
        d.polygon([(35, 120), (150, 266), (265, 120), (150, 101)], fill='#EE91AB')
        d.ellipse((25, 35, 160, 178), fill='#EE91AB')
        d.ellipse((140, 35, 275, 178), fill='#EE91AB')
        d.arc((47, 53, 130, 147), 195, 290, fill=white, width=12)
    elif kind == 'bow':
        d.polygon([(137, 141), (90, 263), (62, 230), (30, 237), (103, 124)], fill='#D981B4', outline=ink, width=5)
        d.polygon([(163, 141), (210, 263), (238, 230), (270, 237), (197, 124)], fill='#D981B4', outline=ink, width=5)
        d.polygon([(145, 126), (55, 40), (24, 75), (27, 167), (73, 185)], fill='#EAA5CF', outline=ink, width=6)
        d.polygon([(155, 126), (245, 40), (276, 75), (273, 167), (227, 185)], fill='#EAA5CF', outline=ink, width=6)
        d.rounded_rectangle((125, 102, 175, 159), radius=15, fill='#F6C6E3', outline=ink, width=5)
    elif kind == 'cherry':
        d.line((95, 190, 150, 45, 212, 175), fill='#648A59', width=12)
        d.ellipse((149, 35, 235, 72), fill='#8AAD6E', outline='#648A59', width=4)
        for x, y in ((78, 192), (212, 192)):
            d.ellipse((x-52, y-52, x+52, y+52), fill='#DC6A7C', outline=ink, width=5)
            d.arc((x-35, y-35, x+25, y+30), 190, 270, fill='#FFE6D9', width=9)
    elif kind == 'flower':
        for a in range(0, 360, 60):
            x, y = 150 + 70*math.cos(math.radians(a)), 150 + 70*math.sin(math.radians(a))
            d.ellipse((x-52, y-52, x+52, y+52), fill=white, outline='#D5AE9D', width=4)
        d.ellipse((98, 98, 202, 202), fill='#F8CF68', outline='#D5AE9D', width=4)
        d.ellipse((126, 136, 136, 149), fill=ink)
        d.ellipse((164, 136, 174, 149), fill=ink)
        d.arc((131, 144, 169, 178), 10, 170, fill=ink, width=4)
    elif kind == 'planet':
        d.ellipse((64, 56, 236, 232), fill='#B5A0DB', outline=white, width=5)
        d.arc((10, 100, 290, 206), 0, 180, fill='#F9C985', width=24)
        d.arc((10, 100, 290, 206), 180, 360, fill='#F9C985', width=9)
        d.ellipse((110, 83, 142, 115), fill='#DBC8ED')
    elif kind == 'moon':
        d.ellipse((45, 30, 258, 260), fill='#F7DA8B')
        # Transparent cutout keeps the crescent reusable on any frame.
        d.ellipse((110, 8, 286, 214), fill=(0, 0, 0, 0))
        d.polygon(star_points(204, 222, 38, 17), fill=white)
    elif kind == 'flag':
        d.rounded_rectangle((20, 60, 280, 240), radius=20, fill='#CD5350', outline=white, width=8)
        d.polygon(star_points(150, 150, 66, 26), fill='#FFDC67')
    elif kind == 'star':
        d.polygon(star_points(150, 148, 126, 57), fill='#F7CF76', outline=white, width=8)
        d.ellipse((114, 133, 127, 149), fill=ink)
        d.ellipse((173, 133, 186, 149), fill=ink)
        d.arc((128, 147, 172, 183), 15, 165, fill=ink, width=5)
    else:
        raise ValueError('Unknown sticker.')
    return tile.resize((size, size), Image.Resampling.LANCZOS)


@lru_cache(maxsize=8)
def artwork(frame_id):
    asset = Path(__file__).parent / FRAMES[frame_id]['art_asset']
    with Image.open(asset) as image:
        return image.convert('RGBA')


def compose_artwork(images, frame_id, caption):
    """Composite photos UNDER the original imagegen alpha; never rewrite the asset."""
    theme = FRAMES[frame_id]
    overlay = artwork(frame_id)
    w, h = overlay.size
    canvas = Image.new('RGBA', (w, h), theme['background'])
    d = ImageDraw.Draw(canvas)
    for i, (sx, sy, sw, sh) in enumerate(theme['art_slots']):
        x, y, pw, ph = round(sx*w), round(sy*h), round(sw*w), round(sh*h)
        if i < len(images):
            canvas.paste(ImageOps.fit(images[i], (pw, ph), method=Image.Resampling.LANCZOS), (x, y))
        else:
            d.rectangle((x, y, x+pw-1, y+ph-1), fill='#FAF7F2')
            d.text((x+pw/2, y+ph/2-12), f'{i+1:02}', anchor='mm', font=font(pw//10), fill=theme['accent'])
            if i == len(images):
                label = f'ĐÃ LƯU {len(images)}/4' if images else 'Sẵn sàng chụp'
                d.text((x+pw/2, y+ph/2+pw*.10), label, anchor='mm', font=font(max(12, pw//28)), fill=theme['ink'])
                if images:
                    d.text((x+pw/2, y+ph/2+pw*.17), 'Bấm X để chụp tiếp', anchor='mm', font=font(max(11, pw//32)), fill=theme['ink'])
    if caption:
        # Optional caption sits inside the final photo, not across the generated art.
        sx, sy, sw, sh = theme['art_slots'][-1]
        cx, cy = round((sx+sw/2)*w), round((sy+sh*.88)*h)
        label_font = font(max(12, round(sw*w/26)), True)
        while d.textlength(caption, font=label_font) > sw*w*.82 and label_font.size > 9:
            label_font = font(label_font.size-1, True)
        half = min(sw*w*.44, d.textlength(caption, font=label_font)/2+15)
        d.rounded_rectangle((cx-half, cy-19, cx+half, cy+19), radius=12, fill='#FFFBF3')
        d.text((cx, cy), caption, anchor='mm', font=label_font, fill=theme['ink'])
    result = Image.alpha_composite(canvas, overlay).convert('RGB')
    result = result.resize((1600, 1600), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    result.save(out, 'PNG')
    return out.getvalue()


def compose(images: list[Image.Image], layout_id='grid4', frame_id='cat_cafe', caption='') -> bytes:
    layout, theme = LAYOUTS[layout_id], FRAMES[frame_id]
    if theme.get('art_asset') and theme.get('art_layout') == layout_id:
        return compose_artwork(images, frame_id, caption)
    w, h = layout['w'], layout['h']
    canvas = Image.new('RGB', (w, h), theme['background'])
    d = ImageDraw.Draw(canvas)
    step = max(35, w//24)
    style, accent = theme['pattern'], theme['accent']
    for y in range(0, h, step):
        for x in range(0, w, step):
            if style == 'dots':
                d.ellipse((x, y, x+5, y+5), fill=accent)
            elif style == 'checks' and (x//step+y//step) % 2 == 0:
                d.rectangle((x, y, x+step-1, y+step-1), fill=accent)
            elif style == 'stars' and (x//step+y//step) % 5 == 0:
                d.polygon(star_points(x, y, 6, 2), fill=accent)
        if style in ('grid', 'stripes'):
            d.line((0, y, w, y), fill=accent, width=1)
    if style == 'grid':
        for x in range(0, w, step):
            d.line((x, 0, x, h), fill=accent, width=1)
    if style == 'film':
        for y in range(20, h-20, 65):
            for x in (12, w-39):
                d.rounded_rectangle((x, y, x+27, y+35), radius=5, fill='#F8DFC0')
    for i, (sx, sy, sw, sh) in enumerate(layout['slots']):
        x, y, pw, ph = round(sx*w), round(sy*h), round(sw*w), round(sh*h)
        d.rounded_rectangle((x-9, y-9, x+pw+9, y+ph+9), radius=12, fill='#FFFBF3')
        if i < len(images):
            canvas.paste(ImageOps.fit(images[i], (pw, ph), method=Image.Resampling.LANCZOS), (x, y))
        else:
            d.rectangle((x, y, x+pw-1, y+ph-1), fill='#F8F4ED')
            d.text((x+pw/2, y+ph/2-10), str(i+1).zfill(2), anchor='mm', font=font(max(24, pw//7), True), fill=accent)
            d.text((x+pw/2, y+ph/2+pw/9), 'chờ lần chụp tiếp', anchor='mm', font=font(max(14, pw//28)), fill=theme['ink'])
    # Decorations stay predominantly in the border/footer, leaving face areas clear.
    size = round(w*.13)
    for kind, px, py, angle in [(theme['stickers'][0], .025, .005, -14),
                                (theme['stickers'][1], .855, .006, 15),
                                (theme['stickers'][2], .025, .89, -12),
                                (theme['stickers'][0], .85, .88, 12)]:
        tile = sticker(kind, size).rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
        canvas.paste(tile, (min(round(w*px), w-tile.width-8), min(round(h*py), h-tile.height-8)), tile)
    footer_y = round(h*.935)
    label = caption.strip() or theme['name']
    # A solid label prevents patterns from reducing text contrast.
    d.rounded_rectangle((w*.20, footer_y-h*.019, w*.80, footer_y+h*.025), radius=14, fill=theme['background'])
    label_font = font(max(16, w//33), True)
    while d.textlength(label, font=label_font) > w*.57 and label_font.size > 12:
        label_font = font(label_font.size-1, True)
    d.text((w/2, footer_y), label, anchor='mm', font=label_font, fill=theme['ink'])
    count, total = len(images), len(layout['slots'])
    status = f'ĐÃ LƯU {count}/{total} · Bấm X để chụp tiếp' if count < total else f'{total} ẢNH · little moments'
    d.rectangle((w*.16, h*.967, w*.84, h*.993), fill=theme['background'])
    status_font = font(max(12, w//58))
    while d.textlength(status, font=status_font) > w*.66 and status_font.size > 10:
        status_font = font(status_font.size-1)
    d.text((w/2, h*.98), status, anchor='mm', font=status_font, fill=theme['ink'])
    # Return a square image: the whole strip is retained rather than cropped away.
    result = Image.new('RGB', (1600, 1600), theme['background'])
    fitted = ImageOps.contain(canvas, result.size, Image.Resampling.LANCZOS)
    result.paste(fitted, ((1600-fitted.width)//2, (1600-fitted.height)//2))
    out = io.BytesIO()
    result.save(out, 'PNG')
    return out.getvalue()


@dataclass
class Session:
    layout: str
    frame: str
    caption: str
    touched: float
    images: list = field(default_factory=list)
    captures: dict = field(default_factory=dict)


class BoothEngine:
    """Explicit sessions + ordered/idempotent captures. Call expire() in a server timer.

    No accounts, URLs or credentials are accepted. Photos live in process memory.
    A native adapter still needs the actual Locket filter wire protocol.
    """
    def __init__(self, ttl=600, max_sessions=4, clock=time.monotonic):
        if ttl <= 0 or max_sessions < 1:
            raise ValueError('Invalid session limits.')
        self.ttl, self.max_sessions, self.clock = ttl, max_sessions, clock
        self._sessions = {}
        self._lock = RLock()

    def expire(self):
        with self._lock:
            now = self.clock()
            for key in list(self._sessions):
                if now-self._sessions[key].touched >= self.ttl:
                    del self._sessions[key]

    def start(self, layout='grid4', frame='cat_cafe', caption=''):
        with self._lock:
            self.expire()
            if not isinstance(layout, str) or not isinstance(frame, str) or layout not in LAYOUTS or frame not in FRAMES:
                raise ValueError('Unknown layout or frame.')
            if not isinstance(caption, str) or len(caption) > 60 or any(ord(c)<32 for c in caption):
                raise ValueError('Caption must be a single line of at most 60 characters.')
            if len(self._sessions) >= self.max_sessions:
                raise BoothError('capacity', 'Session capacity reached; delete a session or wait for expiry.')
            sid = secrets.token_urlsafe(24)
            self._sessions[sid] = Session(layout, frame, caption, self.clock())
            return sid

    def _session(self, sid):
        self.expire()
        if sid not in self._sessions:
            raise BoothError('session_not_found', 'Session missing or expired; start a new session.')
        return self._sessions[sid]

    def capture(self, sid, capture_id, index, raw):
        with self._lock:
            session = self._session(sid)
            if not isinstance(capture_id, str) or not 1 <= len(capture_id) <= 128:
                raise ValueError('A stable capture ID is required for retries.')
            if type(index) is not int or not 1 <= index <= len(LAYOUTS[session.layout]['slots']):
                raise ValueError('Invalid capture index.')
            if not isinstance(raw, bytes) or not raw or len(raw) > MAX_BYTES:
                raise ValueError('Invalid image byte length.')
            digest = hashlib.sha256(raw).hexdigest()
            if capture_id in session.captures:
                if session.captures[capture_id] != (index, digest):
                    raise BoothError('capture_conflict', 'Capture ID was reused for different content/index.')
                return self._result(session, index)
            if index != len(session.images)+1:
                raise BoothError('capture_order', 'Out-of-order capture or completed session; start a new session.')
            img = normalize_image(raw)
            # Render before committing so a failed render can be retried safely.
            png = compose(session.images+[img], session.layout, session.frame, session.caption)
            session.images.append(img)
            session.captures[capture_id] = (index, digest)
            session.touched = self.clock()
            return self._result(session, index, png)

    def _result(self, session, count, png=None):
        total = len(LAYOUTS[session.layout]['slots'])
        return {'count': count, 'total': total, 'complete': count == total,
                'image': png if png is not None else compose(session.images[:count], session.layout, session.frame, session.caption)}

    def preview(self, sid):
        with self._lock:
            session = self._session(sid)
            return self._result(session, len(session.images))

    def delete(self, sid):
        with self._lock:
            self._sessions.pop(sid, None)

    def info(self, sid):
        with self._lock:
            session = self._session(sid)
            count, total = len(session.images), len(LAYOUTS[session.layout]['slots'])
            return {'layout': session.layout, 'frame': session.frame, 'caption': session.caption,
                    'count': count, 'total': total, 'complete': count == total}

    def restyle(self, sid, frame=None, caption=None):
        """Change decoration without discarding photos. Commit only after rendering."""
        with self._lock:
            session = self._session(sid)
            selected_frame = session.frame if frame is None else frame
            selected_caption = session.caption if caption is None else caption
            if not isinstance(selected_frame, str) or selected_frame not in FRAMES:
                raise ValueError('Unknown frame.')
            if not isinstance(selected_caption, str) or len(selected_caption) > 60 or any(ord(c)<32 for c in selected_caption):
                raise ValueError('Caption must be a single line of at most 60 characters.')
            png = compose(session.images, session.layout, selected_frame, selected_caption)
            session.frame, session.caption, session.touched = selected_frame, selected_caption, self.clock()
            return self._result(session, len(session.images), png)

    def clear(self):
        with self._lock:
            self._sessions.clear()


def synthetic_photo(index):
    image = Image.new('RGB', (900, 1000), ['#ECDAC3', '#C6DAD5', '#D9D0EB', '#EFCDD4'][index])
    d = ImageDraw.Draw(image)
    d.ellipse((140, 210, 760, 830), fill=['#AD8D72', '#70978D', '#9A8AB9', '#BF8A99'][index])
    d.text((450, 470), f'{index+1:02}', anchor='mm', font=font(170, True), fill='white')
    d.text((450, 640), 'SYNTHETIC TEST PHOTO', anchor='mm', font=font(29), fill='white')
    out = io.BytesIO()
    image.save(out, 'PNG')
    return out.getvalue()


def demo(directory):
    directory.mkdir(parents=True, exist_ok=True)
    photos = [synthetic_photo(i) for i in range(4)]
    sheet = Image.new('RGB', (1600, 900), '#FCFAF7')
    art_sheet = Image.new('RGB', (1600, 900), '#FCFAF7')
    d = ImageDraw.Draw(sheet)
    ad = ImageDraw.Draw(art_sheet)
    for n, frame in enumerate(FRAMES):
        engine = BoothEngine()
        sid = engine.start(frame=frame)
        for i, photo in enumerate(photos, 1):
            result = engine.capture(sid, f'demo-shot-{i}', i, photo)
            if n == 0:
                (directory/f'capture-{i}-of-4.png').write_bytes(result['image'])
        (directory/f'{frame}.png').write_bytes(result['image'])
        with Image.open(io.BytesIO(result['image'])) as img:
            sheet.paste(img.resize((380, 380), Image.Resampling.LANCZOS), ((n%4)*400+10, (n//4)*450))
        d.text(((n%4)*400+200, (n//4)*450+405), FRAMES[frame]['name'], anchor='mm', font=font(24, True), fill='#4A3B42')
        overlay = artwork(frame)
        art_preview = Image.alpha_composite(Image.new('RGBA', overlay.size, '#FAF7F2'), overlay).convert('RGB')
        art_sheet.paste(art_preview.resize((380, 380), Image.Resampling.LANCZOS), ((n%4)*400+10, (n//4)*450))
        ad.text(((n%4)*400+200, (n//4)*450+405), FRAMES[frame]['name'], anchor='mm', font=font(24, True), fill='#4A3B42')
        engine.delete(sid)
    sheet.save(directory/'contact-sheet.png')
    art_sheet.save(directory/'frames-ai-preview.png')
    print(f'Demo saved to {directory.resolve()}. Synthetic images only; no live Locket test.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--demo', type=Path, required=True)
    demo(parser.parse_args().demo)
