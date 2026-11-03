"""Actual loopback HTTP integration tests; no external services are contacted."""
import hashlib
import http.client
import io
import json
import sys
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'experimental'))
from native_photobooth import BoothEngine, MAX_BYTES
from photobooth_client import BoothClient, ServiceError
from photobooth_server import BoothServer


def photo(color='red'):
    buffer = io.BytesIO()
    Image.new('RGB', (200, 250), color).save(buffer, 'PNG')
    return buffer.getvalue()


class HTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = BoothServer(port=0, token='synthetic_token_for_local_testing_1234')
        cls.thread = threading.Thread(target=cls.server.serve_forever, kwargs={'poll_interval':.05})
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.client = BoothClient(cls.base, cls.server.token, attempts=1)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.thread.join(timeout=5); cls.server.server_close()

    def setUp(self):
        self.server.engine = BoothEngine()
        self.server.creation_cache.clear()

    def request(self, method, path, body=None, headers=None, token=True):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=15)
        fields = {'Authorization':'Bearer '+self.server.token} if token else {}
        fields.update(headers or {})
        try:
            connection.request(method,path,body,fields)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_health_and_catalogue_are_explicitly_local(self):
        self.assertFalse(self.client.health()['locket_adapter'])
        data = self.client.catalogue()
        self.assertEqual(data['protocol'],'local-photobooth/1')
        self.assertEqual(len(data['frames']),8)
        self.assertEqual(len(data['layouts']),6)

    def test_token_host_and_origin_checks(self):
        self.assertEqual(self.request('GET','/v1/frames',token=False)[0],401)
        self.assertEqual(self.request('GET','/v1/frames',headers={'Authorization':'Bearer wrong'})[0],401)
        self.assertEqual(self.request('GET','/v1/frames',headers={'Host':'attacker.invalid'})[0],400)
        self.assertEqual(self.request('GET','/v1/frames',headers={'Origin':'https://example.invalid'})[0],403)

    def test_create_retry_and_conflicting_key(self):
        one = self.client.start(creation_id='same-create')
        two = self.client.start(creation_id='same-create')
        self.assertEqual(one['session_id'],two['session_id'])
        with self.assertRaises(ServiceError) as error:self.client.start(frame='cosmic',creation_id='same-create')
        self.assertEqual(error.exception.status,409)

    def test_concurrent_create_retry_returns_one_session(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _:self.client.start(creation_id='concurrent')['session_id'],range(4)))
        self.assertEqual(len(set(results)),1)
        self.assertEqual(len(self.server.engine._sessions),1)

    def test_invalid_session_options_and_json_rejected(self):
        headers={'Content-Type':'application/json','Idempotency-Key':'invalid'}
        for raw in [b'[]',b'{bad',b'{"frame":[]}',b'{"unknown":"x"}',b'{"caption":null}',b'{"frame":"cosmic","frame":"cat_cafe"}']:
            with self.subTest(raw=raw):self.assertEqual(self.request('POST','/v1/sessions',raw,headers)[0],400)
        self.assertEqual(len(self.server.engine._sessions),0)

    def test_capacity_releases_on_delete(self):
        self.server.engine = BoothEngine(max_sessions=1)
        sid = self.client.start()['session_id']
        with self.assertRaises(ServiceError) as err:self.client.start()
        self.assertEqual(err.exception.status,429)
        self.client.delete(sid)
        self.assertEqual(self.client.start()['count'],0)

    def test_two_captures_and_final_gate(self):
        sid = self.client.start(layout='duo')['session_id']
        first = self.client.capture(sid,1,'one',photo())
        self.assertEqual((first.count,first.complete),(1,False))
        with self.assertRaises(ServiceError) as err:self.client.preview(sid,final=True)
        self.assertEqual(err.exception.code,'capture_incomplete')
        second = self.client.capture(sid,2,'two',photo('blue'))
        self.assertTrue(second.complete)
        with Image.open(io.BytesIO(second.png)) as image:self.assertEqual(image.size,(1600,1600))
        self.assertEqual(self.client.preview(sid,final=True).png,second.png)

    def test_capture_retry_and_conflict(self):
        sid = self.client.start()['session_id']
        first = self.client.capture(sid,1,'one',photo())
        self.assertEqual(self.client.capture(sid,1,'one',photo()).png,first.png)
        with self.assertRaises(ServiceError) as err:self.client.capture(sid,1,'one',photo('blue'))
        self.assertEqual(err.exception.code,'capture_conflict')
        self.assertEqual(self.client.info(sid)['count'],1)

    def test_concurrent_identical_capture_commits_once(self):
        sid = self.client.start()['session_id'];raw = photo()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _:self.client.capture(sid,1,'same',raw),range(2)))
        self.assertEqual(results[0].png,results[1].png)
        self.assertEqual(self.client.info(sid)['count'],1)

    def test_lost_response_retry_does_not_duplicate_capture(self):
        sid = self.client.start()['session_id']
        client = BoothClient(self.base,self.server.token,attempts=2)
        original = client._roundtrip
        calls=[]
        def lost_once(method,path,body,headers):
            result=original(method,path,body,headers)
            calls.append((headers.get('Idempotency-Key'),hashlib.sha256(body).hexdigest()))
            if len(calls)==1:raise ConnectionResetError('synthetic lost response after commit')
            return result
        with patch.object(client,'_roundtrip',side_effect=lost_once):
            result=client.capture(sid,1,'stable-shot-id',photo())
        self.assertEqual(result.count,1)
        self.assertEqual(calls[0],calls[1])
        self.assertEqual(self.client.info(sid)['count'],1)

    def test_out_of_order_and_invalid_image_leave_session_unchanged(self):
        sid = self.client.start()['session_id']
        with self.assertRaises(ServiceError) as err:self.client.capture(sid,2,'two',photo())
        self.assertEqual(err.exception.status,409)
        with self.assertRaises(ServiceError) as err:self.client.capture(sid,1,'one',b'not an image')
        self.assertEqual(err.exception.status,400)
        self.assertEqual(self.client.info(sid)['count'],0)

    def test_payload_limit_checked_before_read(self):
        sid = self.client.start()['session_id']
        headers={'Content-Type':'image/png','Idempotency-Key':'huge','Content-Length':str(MAX_BYTES+1)}
        self.assertEqual(self.request('POST',f'/v1/sessions/{sid}/captures/1',b'',headers)[0],413)
        self.assertEqual(self.client.info(sid)['count'],0)

    def test_restyle_preserves_photo_and_transaction_on_failure(self):
        sid = self.client.start()['session_id']
        self.client.capture(sid,1,'one',photo())
        result = self.client.restyle(sid,frame='cosmic',caption='Kỷ niệm')
        self.assertEqual(result.count,1)
        self.assertEqual(self.client.info(sid)['frame'],'cosmic')
        with patch('native_photobooth.compose',side_effect=RuntimeError('synthetic renderer failure')):
            with self.assertRaises(ServiceError) as err:self.client.restyle(sid,frame='vietnam')
            self.assertEqual(err.exception.status,500)
        self.assertEqual(self.client.info(sid)['frame'],'cosmic')

    def test_idle_expiration_without_requests(self):
        now=[0]
        self.server.engine=BoothEngine(ttl=1,clock=lambda:now[0])
        sid=self.client.start(creation_id='expires')['session_id']
        now[0]=2
        self.server.service_actions()
        self.assertEqual(self.server.engine._sessions,{})
        with self.assertRaises(ServiceError) as err:self.client.info(sid)
        self.assertEqual(err.exception.status,404)

    def test_delete_is_idempotent_and_creation_retry_does_not_resurrect(self):
        sid=self.client.start(creation_id='delete-test')['session_id']
        self.client.delete(sid);self.client.delete(sid)
        with self.assertRaises(ServiceError) as err:self.client.start(creation_id='delete-test')
        self.assertEqual(err.exception.status,410)

    def test_frame_asset_is_original_and_not_file_server(self):
        status,headers,data=self.request('GET','/v1/frames/cherry_pop/overlay.png')
        source=Path(__file__).resolve().parents[1]/'experimental/frames-ai/cherry_pop-v2.png'
        self.assertEqual(status,200);self.assertEqual(data,source.read_bytes())
        self.assertEqual(headers['Cache-Control'],'no-store')
        self.assertEqual(self.request('GET','/v1/frames/../../README_VI.md')[0],404)

    def test_unsupported_encoding_and_query_rejected(self):
        self.assertEqual(self.request('POST','/v1/sessions',b'{}',{'Transfer-Encoding':'chunked'})[0],400)
        self.assertEqual(self.request('GET','/v1/health?token=secret')[0],400)
        self.assertEqual(self.request('OPTIONS','/v1/health')[0],405)

    def test_client_refuses_remote_url(self):
        for url in ['https://api.locketcamera.com','http://example.com','http://user:pass@127.0.0.1:8787','http://127.0.0.1:8787/?token=secret']:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):BoothClient(url,'synthetic')


if __name__ == '__main__':
    unittest.main()
