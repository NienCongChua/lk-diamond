"""Client for local-photobooth/1. Does not call or emulate the Locket API."""
from __future__ import annotations

import http.client
import json
import secrets
import time
from dataclasses import dataclass
from urllib.parse import urlsplit


class ServiceError(Exception):
    def __init__(self, status, code):
        super().__init__(f'Local Photobooth service: {status} {code}')
        self.status, self.code = status, code


@dataclass(frozen=True)
class PhotoResult:
    png: bytes
    count: int
    total: int
    complete: bool


class BoothClient:
    def __init__(self, base_url, token, timeout=30, attempts=3):
        url = urlsplit(base_url)
        if (url.scheme != 'http' or url.hostname not in ('127.0.0.1', 'localhost')
                or url.username or url.password or url.path not in ('', '/') or url.query or url.fragment):
            raise ValueError('Use the local loopback service URL.')
        if not 1 <= attempts <= 5 or timeout <= 0:
            raise ValueError('Invalid retry options.')
        self.host, self.port = url.hostname, url.port or 80
        self.token, self.timeout, self.attempts = token, timeout, attempts

    def _roundtrip(self, method, path, body, headers):
        connection = http.client.HTTPConnection(self.host, self.port, timeout=self.timeout)
        try:
            connection.request(method, path, body=body, headers={**headers, 'Authorization': 'Bearer '+self.token})
            response = connection.getresponse()
            data = response.read(32*1024*1024+1)
            if len(data) > 32*1024*1024:
                raise ServiceError(502, 'response_too_large')
            return response.status, {k.lower():v for k,v in response.getheaders()}, data
        finally:
            connection.close()

    def _request(self, method, path, body=None, headers=None):
        # The exact body and idempotency key are reused across transport retries.
        for attempt in range(self.attempts):
            try:
                status, response_headers, data = self._roundtrip(method, path, body, headers or {})
            except (OSError, http.client.HTTPException):
                if attempt+1 == self.attempts:
                    raise
            else:
                if 200 <= status < 300:
                    return response_headers, data
                if status not in (408, 502, 503, 504) or attempt+1 == self.attempts:
                    try:
                        code = json.loads(data)['error']['code']
                    except (ValueError, TypeError, KeyError):
                        code = 'unexpected_response'
                    raise ServiceError(status, code)
            time.sleep(.15*(2**attempt))

    def _json(self, method, path, data=None, key=None):
        headers = {'Content-Type': 'application/json'}
        if key is not None:
            headers['Idempotency-Key'] = key
        _, raw = self._request(method, path, json.dumps(data, ensure_ascii=False).encode('utf-8') if data is not None else None, headers)
        return json.loads(raw)

    @staticmethod
    def _photo(response):
        headers, data = response
        if headers.get('content-type') != 'image/png' or not data.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ServiceError(502, 'expected_png')
        return PhotoResult(data, int(headers['x-booth-count']), int(headers['x-booth-total']), headers['x-booth-complete']=='true')

    def health(self):
        return self._json('GET', '/v1/health')

    def catalogue(self):
        return self._json('GET', '/v1/frames')

    def start(self, frame='cat_cafe', layout='grid4', caption='', creation_id=None):
        return self._json('POST', '/v1/sessions', {'frame':frame, 'layout':layout, 'caption':caption}, creation_id or secrets.token_urlsafe(18))

    def capture(self, sid, index, capture_id, image, content_type='image/png'):
        return self._photo(self._request('POST', f'/v1/sessions/{sid}/captures/{index}', image,
                          {'Content-Type':content_type, 'Idempotency-Key':capture_id}))

    def info(self, sid):
        return self._json('GET', f'/v1/sessions/{sid}')

    def preview(self, sid, final=False):
        return self._photo(self._request('GET', f'/v1/sessions/{sid}/{"final" if final else "preview"}.png'))

    def restyle(self, sid, frame=None, caption=None):
        data = {key:value for key,value in [('frame',frame),('caption',caption)] if value is not None}
        return self._photo(self._request('PATCH', f'/v1/sessions/{sid}', json.dumps(data, ensure_ascii=False).encode('utf-8'), {'Content-Type':'application/json'}))

    def delete(self, sid):
        self._request('DELETE', f'/v1/sessions/{sid}')
