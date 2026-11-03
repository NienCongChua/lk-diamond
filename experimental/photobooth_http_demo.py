"""Exercise a real local HTTP server with four synthetic captures; then stop it."""
import argparse
import hashlib
import json
from pathlib import Path
import threading
import time

from native_photobooth import synthetic_photo
from photobooth_client import BoothClient, ServiceError
from photobooth_server import BoothServer


def run_demo(out):
    out.mkdir(parents=True, exist_ok=True)
    server = BoothServer(port=0)
    thread = threading.Thread(target=server.serve_forever, kwargs={'poll_interval':.1})
    thread.start()
    report = {'transport':'real HTTP over loopback', 'images':'synthetic numbered fixtures',
              'locket_tested':False, 'locket_adapter':False, 'steps':[]}
    try:
        client = BoothClient(f'http://127.0.0.1:{server.server_port}', server.token)
        assert client.health()['locket_adapter'] is False
        report['frame_count'] = len(client.catalogue()['frames'])
        session = client.start(frame='cherry_pop', creation_id='demo-session')
        sid = session['session_id']
        assert client.start(frame='cherry_pop', creation_id='demo-session')['session_id'] == sid
        for i in range(1,5):
            started = time.perf_counter()
            result = client.capture(sid, i, f'demo-capture-{i}', synthetic_photo(i-1))
            assert result.count == i and result.complete == (i == 4)
            name = f'http-capture-{i}-of-4.png'
            (out/name).write_bytes(result.png)
            report['steps'].append({'capture':i,'complete':result.complete,'file':name,
                                    'elapsed_ms':round((time.perf_counter()-started)*1000),
                                    'sha256':hashlib.sha256(result.png).hexdigest()})
        retry = client.capture(sid, 4, 'demo-capture-4', synthetic_photo(3))
        assert retry.png == result.png and client.info(sid)['count'] == 4
        report['retry_did_not_add_photo'] = True
        restyled = client.restyle(sid, frame='cosmic')
        assert restyled.count == 4 and restyled.complete
        (out/'http-restyled-cosmic.png').write_bytes(restyled.png)
        assert client.preview(sid, final=True).png == restyled.png
        report['restyle_preserved_four_photos'] = True
        client.delete(sid)
        try:
            client.preview(sid)
            raise AssertionError('Deleted session still readable')
        except ServiceError as exc:
            assert exc.status == 404
        report['deleted_session_unavailable'] = True
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()
    report['server_stopped'] = True
    (out/'report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(f'PASS: 4 HTTP captures, retry, restyle, final image and deletion. Results: {out.resolve()}')
    print('Server stopped. No device, Locket API or personal photos were used.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=Path(__file__).parent/'http-demo')
    run_demo(parser.parse_args().out)
