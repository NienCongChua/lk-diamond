#!/usr/bin/env python3
"""Build modules with explicit local script paths or a user-owned HTTPS base URL."""
import argparse
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REMOTE = r'^https:\/\/firebaseremoteconfig\.googleapis\.com\/v1\/projects\/locket-[A-Za-z0-9_-]+\/namespaces\/[^/?#]+:fetch(?:\?[^#]*)?$'
REVENUE = r'^https:\/\/api\.revenuecat\.com\/v1\/(?:receipts|subscribers\/[^/?#]+)\/?(?:\?[^#]*)?$'

def build(base='', directory=ROOT):
    prefix = base.rstrip('/') + '/scripts/' if base else ''
    main = prefix + 'locket-custom.js'
    diag = prefix + 'locket-diagnostics.js'
    probe = prefix + 'locket-filter-probe.js'
    suffix = '' if base else '.local'
    setup = 'Hosted scripts.' if base else 'Requires script setup.'
    directory.mkdir(parents=True, exist_ok=True)
    text = f'''#!name=Locket Custom v1.0
#!desc=Personal configurable rewrite. Native Photobooth layouts are not implemented. {setup}

[MITM]
hostname = %APPEND% api.revenuecat.com, firebaseremoteconfig.googleapis.com

[Script]
nien_locket_remote = type=http-response, pattern={REMOTE}, script-path={main}, requires-body=true, max-size=1048576, timeout=10
nien_locket_etag = type=http-request, pattern={REVENUE}, script-path={main}, timeout=10
nien_locket_subscription = type=http-response, pattern={REVENUE}, script-path={main}, requires-body=true, max-size=1048576, timeout=10
'''
    diagnostics = f'''#!name=Locket Schema Diagnostics v1.0
#!desc=Read-only key/type logging. Disable other Locket rewrites while inspecting.

[MITM]
hostname = %APPEND% firebaseremoteconfig.googleapis.com

[Script]
nien_locket_schema = type=http-response, pattern={REMOTE}, script-path={diag}, requires-body=true, max-size=1048576, timeout=10
'''
    filter_probe = f'''#!name=Locket Filter Probe v0.1
#!desc=Read-only native filter investigation. No Photobooth injection. Can coexist with Locket-Custom; avoid other scripts on api.locketcamera.com.

[MITM]
hostname = %APPEND% api.locketcamera.com

[Script]
locket_filter_probe_request = type=http-request, pattern=^https:\\/\\/api\\.locketcamera\\.com(?:\\/|$), script-path={probe}, timeout=5
locket_filter_probe_response = type=http-response, pattern=^https:\\/\\/api\\.locketcamera\\.com(?:\\/|$), script-path={probe}, requires-body=true, max-size=1048576, timeout=5
'''
    for name, content in [('Locket-Custom', text), ('Locket-Diagnostics', diagnostics), ('Locket-Filter-Probe', filter_probe)]:
        path=directory/(name+suffix+'.sgmodule'); path.write_text(content,encoding='utf-8',newline='\n');print(path)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--base-url',default='',help='HTTPS URL of your repository root at a fixed commit; omit for local scripts')
    p.add_argument('--out',type=Path,default=ROOT)
    args=p.parse_args()
    if args.base_url:
        u=urlsplit(args.base_url)
        if u.scheme!='https' or not u.hostname or u.username or u.password or u.query or u.fragment or any(x in args.base_url for x in ',\n\r '):
            p.error('--base-url must be a plain HTTPS directory URL without credentials, query, fragment, spaces or commas')
    build(args.base_url,args.out)
