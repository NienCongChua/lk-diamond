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


def resolve_selection(layout=None, frame=None):
    if layout is not None and (not isinstance(layout, str) or layout not in LAYOUTS):
        raise ValueError('Unknown layout.')
    if frame is not None and (not isinstance(frame, str) or frame not in FRAMES):
        raise ValueError('Unknown frame.')
    if frame is None:
        frame = next((f['id'] for f in FRAMES.values() if f['art_layout'] == (layout or 'grid4')), None)
    if frame is None:
        raise ValueError('No artwork is available for this layout.')
    layout = layout or FRAMES[frame]['art_layout']
    if FRAMES[frame]['art_layout'] != layout:
        raise ValueError('Frame does not support this layout; choose a matching frame or start a new session.')
    return layout, frame


@lru_cache(maxsize=16)
def artwork(frame_id):
    asset = Path(__file__).parent / FRAMES[frame_id]['art_asset']
    with Image.open(asset) as image:
        return image.convert('RGBA')


def output_size(frame_id, output='native'):
    if output not in ('native', 'square'):
        raise ValueError('Output must be native or square.')
    if output == 'square':
        return (1600, 1600)
    w, h = artwork(frame_id).size
    scale = 1600 / max(w, h)
    return max(1, round(w*scale)), max(1, round(h*scale))


def compose(images: list[Image.Image], layout_id=None, frame_id=None, caption='', output='native') -> bytes:
    layout_id, frame_id = resolve_selection(layout_id, frame_id)
    theme = FRAMES[frame_id]
    slots = theme['art_slots']
    if len(images) > len(slots):
        raise ValueError('Too many photos for this frame.')
    size = output_size(frame_id, output)
    overlay = artwork(frame_id)
    w, h = overlay.size
    canvas = Image.new('RGBA', (w, h), theme['background'])
    d = ImageDraw.Draw(canvas)
    for i, (sx, sy, sw, sh) in enumerate(slots):
        x, y, pw, ph = round(sx*w), round(sy*h), round(sw*w), round(sh*h)
        if i < len(images):
            canvas.paste(ImageOps.fit(images[i], (pw, ph), method=Image.Resampling.LANCZOS), (x, y))
        else:
            d.rectangle((x, y, x+pw-1, y+ph-1), fill='#FAF7F2')
            d.text((x+pw/2, y+ph/2-12), f'{i+1:02}', anchor='mm', font=font(pw//10), fill=theme['accent'])
            if i == len(images):
                label = f'ĐÃ LƯU {len(images)}/{len(slots)}' if images else 'Sẵn sàng chụp'
                d.text((x+pw/2, y+ph/2+pw*.10), label, anchor='mm', font=font(max(12, pw//28)), fill='#594D4A')
    if caption:
        sx, sy, sw, sh = slots[-1]
        cx, cy = round((sx+sw/2)*w), round((sy+sh*.88)*h)
        label_font = font(max(12, round(sw*w/26)), True)
        while d.textlength(caption, font=label_font) > sw*w*.82 and label_font.size > 9:
            label_font = font(label_font.size-1, True)
        half = min(sw*w*.44, d.textlength(caption, font=label_font)/2+15)
        d.rounded_rectangle((cx-half, cy-19, cx+half, cy+19), radius=12, fill='#FFFBF3')
        d.text((cx, cy), caption, anchor='mm', font=label_font, fill='#493638')
    result = Image.alpha_composite(canvas, overlay).convert('RGB')
    # Keep artwork proportions. Square mode pads the complete strip without cropping.
    if output == 'square':
        fitted = ImageOps.contain(result, size, Image.Resampling.LANCZOS)
        result = Image.new('RGB', size, theme['background'])
        result.paste(fitted, ((size[0]-fitted.width)//2, (size[1]-fitted.height)//2))
    else:
        result = result.resize(size, Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    result.save(buffer, 'PNG')
    return buffer.getvalue()


@dataclass
class Session:
    layout: str
    frame: str
    caption: str
    output: str
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

    def start(self, layout=None, frame=None, caption='', output='native'):
        with self._lock:
            self.expire()
            layout, frame = resolve_selection(layout, frame)
            output_size(frame, output)
            if not isinstance(caption, str) or len(caption) > 60 or any(ord(c)<32 for c in caption):
                raise ValueError('Caption must be a single line of at most 60 characters.')
            if len(self._sessions) >= self.max_sessions:
                raise BoothError('capacity', 'Session capacity reached; delete a session or wait for expiry.')
            sid = secrets.token_urlsafe(24)
            self._sessions[sid] = Session(layout, frame, caption, output, self.clock())
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
            png = compose(session.images+[img], session.layout, session.frame, session.caption, session.output)
            session.images.append(img)
            session.captures[capture_id] = (index, digest)
            session.touched = self.clock()
            return self._result(session, index, png)

    def _result(self, session, count, png=None):
        total = len(LAYOUTS[session.layout]['slots'])
        return {'count': count, 'total': total, 'complete': count == total,
                'image': png if png is not None else compose(session.images[:count], session.layout, session.frame, session.caption, session.output)}

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
                    'output': session.output, 'size': list(output_size(session.frame, session.output)),
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
            png = compose(session.images, session.layout, selected_frame, selected_caption, session.output)
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
    sample = (Path(__file__).parent/'sample-photos/friends-ai.png').read_bytes()
    cols, cell_w, cell_h = 4, 400, 510
    rows = (len(FRAMES)+cols-1)//cols
    sheet = Image.new('RGB', (cols*cell_w, rows*cell_h+100), '#FCFAF7')
    d = ImageDraw.Draw(sheet)
    d.text((35, 30), '13 KHUNG · 6 BỐ CỤC', font=font(28, True), fill='#4A3B42')
    d.text((35, 68), 'Ảnh mẫu tạo bằng AI · ghép bằng bộ xử lý trên máy tính · chưa chụp trong Locket', font=font(20), fill='#796B72')
    for n, (frame, spec) in enumerate(FRAMES.items()):
        engine = BoothEngine()
        sid = engine.start(frame=frame)
        for i in range(1, len(spec['art_slots'])+1):
            result = engine.capture(sid, f'demo-shot-{i}', i, sample)
            if n == 0:
                (directory/f'capture-{i}-of-4.png').write_bytes(result['image'])
        (directory/f'{frame}.png').write_bytes(result['image'])
        with Image.open(io.BytesIO(result['image'])) as img:
            fitted = ImageOps.contain(img, (370, 420), Image.Resampling.LANCZOS)
            left, top = (n%cols)*cell_w, (n//cols)*cell_h+110
            sheet.paste(fitted, (left+(cell_w-fitted.width)//2, top+(420-fitted.height)//2))
            label = f'{len(spec["art_slots"])} ảnh · {img.width} × {img.height}'
        d.text((left+cell_w/2, top+447), spec['name'], anchor='mm', font=font(21, True), fill='#4A3B42')
        d.text((left+cell_w/2, top+478), label, anchor='mm', font=font(18), fill='#796B72')
        engine.delete(sid)
    sheet.save(directory/'contact-sheet.png')
    sheet.save(directory/'frames-ai-preview.png')
    print(f'Demo saved to {directory.resolve()}. AI sample photo; no live Locket test.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--demo', type=Path, required=True)
    demo(parser.parse_args().demo)
