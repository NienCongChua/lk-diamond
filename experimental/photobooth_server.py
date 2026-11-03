"""Loopback-only HTTP service for the local Photobooth engine.

This is OUR protocol, not Locket's. No interception or outbound HTTP calls.
Run: python experimental/photobooth_server.py --port 8787
The token is generated locally in a runtime file, never an account credential.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import secrets
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from native_photobooth import BoothEngine, BoothError, FRAMES, LAYOUTS, MAX_BYTES

PROTOCOL = 'local-photobooth/1'
RUNTIME = Path(__file__).resolve().parents[1] / '.photobooth-runtime'
SID = r'[A-Za-z0-9_-]{32}'
KEY = re.compile(r'^[A-Za-z0-9_.-]{1,128}$')


class APIError(Exception):
    def __init__(self, status, code, message):
        self.status, self.code, self.message = status, code, message


class BoothServer(ThreadingHTTPServer):
    daemon_threads = False
    block_on_close = True
    allow_reuse_address = False

    def __init__(self, port=8787, token=None, engine=None):
        self.token = token or secrets.token_urlsafe(32)
        if not re.fullmatch(r'[A-Za-z0-9_-]{32,128}', self.token):
            raise ValueError('Local service token must be 32-128 URL-safe characters.')
        self.engine = engine or BoothEngine()
        self.creation_cache = {}
        self.creation_lock = threading.RLock()
        self.active_requests = threading.BoundedSemaphore(8)
        super().__init__(('127.0.0.1', port), Handler)

    def service_actions(self):
        self.engine.expire()
        with self.creation_lock:
            now = time.monotonic()
            self.creation_cache = {k:v for k,v in self.creation_cache.items() if now < v['until']}

    def create_session(self, key, options):
        normalized = {'layout': options.get('layout', 'grid4'), 'frame': options.get('frame', 'cat_cafe'), 'caption': options.get('caption', '')}
        fingerprint = hashlib.sha256(json.dumps(normalized, sort_keys=True).encode()).digest()
        with self.creation_lock:
            old = self.creation_cache.get(key)
            if old and time.monotonic() < old['until']:
                if old['fingerprint'] != fingerprint:
                    raise APIError(409, 'idempotency_conflict', 'Use a new key for a different session.')
                try:
                    info = self.engine.info(old['sid'])
                except BoothError:
                    raise APIError(410, 'session_gone', 'This creation key belongs to an expired or deleted session; use a new key.')
                return 200, old['sid'], info
            if len(self.creation_cache) >= 128:
                raise APIError(429, 'creation_limit', 'Too many recent session creations; retry later.')
            sid = self.engine.start(**normalized)
            self.creation_cache[key] = {'sid': sid, 'fingerprint': fingerprint, 'until': time.monotonic()+600}
            return 201, sid, self.engine.info(sid)

    def server_close(self):
        super().server_close()
        self.engine.clear()
        self.creation_cache.clear()

    def handle_error(self, request, client_address):
        # Do not dump HTTP headers, image bodies or account-like client input.
        pass


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.0'
    server_version = 'LocalPhotobooth/1'
    sys_version = ''

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *args):
        pass

    def send_error(self, code, message=None, explain=None):
        # Base parser errors also use a small response without reflecting input.
        self._json(code, {'error': {'code': 'http_error', 'message': 'Invalid HTTP request.'}})

    def _send(self, status, body=b'', content_type='application/json; charset=utf-8', extra=None):
        self.close_connection = True
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Connection', 'close')
        for key, value in (extra or {}).items():
            self.send_header(key, str(value))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def _json(self, status, data):
        self._send(status, json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))

    def _png(self, result):
        self._send(200, result['image'], 'image/png', {
            'X-Booth-Count': result['count'], 'X-Booth-Total': result['total'],
            'X-Booth-Complete': str(result['complete']).lower(),
        })

    def _authorize(self):
        hosts = self.headers.get_all('Host', [])
        expected = {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}
        if len(hosts) != 1 or hosts[0] not in expected:
            raise APIError(400, 'invalid_host', 'Use the local loopback service address.')
        if self.headers.get_all('Origin'):
            raise APIError(403, 'browser_origin_denied', 'This API is intended for a local client, not browser pages.')
        auth = self.headers.get_all('Authorization', [])
        expected_auth = 'Bearer '+self.server.token
        if len(auth) != 1 or not secrets.compare_digest(auth[0].encode('utf-8'), expected_auth.encode('utf-8')):
            raise APIError(401, 'unauthorized', 'A local service token is required.')
        if self.headers.get_all('Transfer-Encoding') or self.headers.get_all('Content-Encoding'):
            raise APIError(400, 'unsupported_encoding', 'Send uncompressed bytes with Content-Length.')
        if '?' in self.path or '#' in self.path or '%' in self.path:
            raise APIError(400, 'invalid_path', 'Use a documented path without query parameters.')

    def _body(self, limit):
        sizes = self.headers.get_all('Content-Length', [])
        if len(sizes) != 1 or not re.fullmatch(r'0|[1-9][0-9]{0,9}', sizes[0]):
            raise APIError(411, 'content_length_required', 'Send one valid Content-Length header.')
        length = int(sizes[0])
        if length > limit:
            raise APIError(413, 'body_too_large', f'Body exceeds {limit} bytes.')
        if length == 0:
            raise APIError(400, 'empty_body', 'A request body is required.')
        raw = self.rfile.read(length)
        if len(raw) != length:
            raise APIError(400, 'incomplete_body', 'Body ended early; retry the same request.')
        return raw

    def _object(self, fields):
        if self.headers.get_content_type() != 'application/json':
            raise APIError(415, 'json_required', 'Use application/json.')
        raw = self._body(4096)
        try:
            def pairs(items):
                result = {}
                for key, value in items:
                    if key in result:
                        raise ValueError('duplicate')
                    result[key] = value
                return result
            data = json.loads(raw, object_pairs_hook=pairs, parse_constant=lambda _: (_ for _ in ()).throw(ValueError('constant')))
        except (ValueError, UnicodeError, RecursionError):
            raise APIError(400, 'invalid_json', 'Provide a valid JSON object without duplicate keys.')
        if not isinstance(data, dict) or set(data)-set(fields) or any(not isinstance(v, str) for v in data.values()):
            raise APIError(400, 'invalid_options', 'Only documented string options are accepted.')
        return data

    def _key(self):
        values = self.headers.get_all('Idempotency-Key', [])
        if len(values) != 1 or not KEY.fullmatch(values[0]):
            raise APIError(400, 'idempotency_key_required', 'Use a stable 1-128 character key for each logical operation.')
        return values[0]

    def _route(self):
        method, path = self.command, self.path
        engine = self.server.engine
        if method == 'GET' and path == '/v1/health':
            return self._json(200, {'status': 'ok', 'protocol': PROTOCOL, 'locket_adapter': False})
        if method == 'GET' and path == '/v1/frames':
            return self._json(200, {'protocol': PROTOCOL, 'frames': [
                {'id': f['id'], 'name': f['name'], 'art_layout': f.get('art_layout'), 'overlay_path': f'/v1/frames/{f["id"]}/overlay.png'} for f in FRAMES.values()
            ], 'layouts': [{'id': x['id'], 'name': x['name'], 'captures': len(x['slots'])} for x in LAYOUTS.values()]})
        asset = re.fullmatch(r'/v1/frames/([a-z0-9_]+)/overlay\.png', path)
        if method == 'GET' and asset:
            frame = FRAMES.get(asset[1])
            if not frame or not frame.get('art_asset'):
                raise APIError(404, 'frame_not_found', 'Frame not found.')
            data = (Path(__file__).parent/frame['art_asset']).read_bytes()
            return self._send(200, data, 'image/png')
        if method == 'POST' and path == '/v1/sessions':
            key = self._key()
            status, sid, info = self.server.create_session(key, self._object(('layout', 'frame', 'caption')))
            return self._json(status, {'session_id': sid, **info, 'preview_path': f'/v1/sessions/{sid}/preview.png'})
        session = re.fullmatch(r'/v1/sessions/('+SID+r')', path)
        if session:
            sid = session[1]
            if method == 'GET':
                return self._json(200, {'session_id': sid, **engine.info(sid)})
            if method == 'DELETE':
                engine.delete(sid)
                return self._send(204)
            if method == 'PATCH':
                options = self._object(('frame', 'caption'))
                if not options:
                    raise APIError(400, 'empty_options', 'Select a frame or caption to change.')
                return self._png(engine.restyle(sid, **options))
        capture = re.fullmatch(r'/v1/sessions/('+SID+r')/captures/([1-4])', path)
        if method == 'POST' and capture:
            key = self._key()
            engine.info(capture[1])  # Reject missing sessions before buffering an image.
            if self.headers.get_content_type() not in ('image/png', 'image/jpeg', 'image/webp'):
                raise APIError(415, 'image_required', 'Send raw JPEG, PNG or WebP bytes.')
            return self._png(engine.capture(capture[1], key, int(capture[2]), self._body(MAX_BYTES)))
        preview = re.fullmatch(r'/v1/sessions/('+SID+r')/(preview|final)\.png', path)
        if method == 'GET' and preview:
            if preview[2] == 'final' and not engine.info(preview[1])['complete']:
                raise APIError(409, 'capture_incomplete', 'Capture all photos before requesting the final image.')
            return self._png(engine.preview(preview[1]))
        if method not in ('GET', 'POST', 'PATCH', 'DELETE'):
            raise APIError(405, 'method_not_allowed', 'Method not supported.')
        raise APIError(404, 'route_not_found', 'Route not found.')

    def _dispatch(self):
        acquired = False
        try:
            self._authorize()
            acquired = self.server.active_requests.acquire(blocking=False)
            if not acquired:
                raise APIError(503, 'busy', 'Retry the same operation shortly.')
            self._route()
        except APIError as exc:
            self._json(exc.status, {'error': {'code': exc.code, 'message': exc.message}})
        except BoothError as exc:
            status = {'capacity': 429, 'session_not_found': 404, 'capture_conflict': 409, 'capture_order': 409}.get(exc.code, 400)
            self._json(status, {'error': {'code': exc.code, 'message': str(exc)}})
        except (socket.timeout, TimeoutError):
            self._json(408, {'error': {'code': 'request_timeout', 'message': 'Retry the same operation.'}})
        except ValueError:
            self._json(400, {'error': {'code': 'invalid_input', 'message': 'Invalid image or session options.'}})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            self._json(500, {'error': {'code': 'processing_failed', 'message': 'Image processing failed; retry the same capture.'}})
        finally:
            if acquired:
                self.server.active_requests.release()

    do_GET = do_POST = do_PATCH = do_DELETE = do_OPTIONS = do_HEAD = do_PUT = _dispatch


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8787)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error('--port must be between 0 and 65535')
    with BoothServer(port=args.port) as server:
        # Per-port files avoid overwriting a second local instance's token.
        RUNTIME.mkdir(exist_ok=True)
        token_path = RUNTIME/f'token-{server.server_port}.txt'
        with token_path.open('w', encoding='utf-8') as file:
            file.write(server.token+'\n')
        if os.name != 'nt':
            token_path.chmod(0o600)
        print(f'Local Photobooth API: http://127.0.0.1:{server.server_port}', flush=True)
        print(f'Local token file: {token_path}', flush=True)
        print('No Locket adapter. Local use only. Ctrl+C stops and clears sessions.', flush=True)
        try:
            server.serve_forever(poll_interval=0.25)
        except KeyboardInterrupt:
            pass
        finally:
            # Remove only the file created by this instance, never another token.
            if token_path.exists() and token_path.read_text(encoding='utf-8').strip() == server.token:
                token_path.unlink()


if __name__ == '__main__':
    main()
