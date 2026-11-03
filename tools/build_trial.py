"""Build full trial + small iPhone probe ZIPs without runtime tokens or caches."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = ['.gitignore', '.gitattributes', 'START_HERE_VI.txt', 'README.md', 'README_VI.md', 'VALIDATION.txt', 'SOURCE_SNAPSHOT.json',
              'Locket-Custom.local.sgmodule', 'Locket-Diagnostics.local.sgmodule', 'Locket-Filter-Probe.local.sgmodule']


def sources():
    files = [ROOT/name for name in ROOT_FILES]
    files += [p for p in ROOT.glob('*.sgmodule') if p not in files]
    for directory in ['scripts', 'experimental', 'photobooth', 'tests', 'tools']:
        allowed = {'.py', '.js', '.cjs', '.json', '.txt', '.md', '.html', '.png', '.svg', '.webp', '.sgmodule'}
        files += [p for p in (ROOT/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts
                  and p.suffix in allowed and not any(part.startswith('.') for part in p.relative_to(ROOT).parts)]
    return sorted(set(files))


def archive(name, files):
    target = ROOT/name
    checksums = []
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as output:
        for path in sorted(files):
            relative = path.relative_to(ROOT).as_posix()
            data = path.read_bytes()
            output.writestr(relative, data)
            checksums.append(hashlib.sha256(data).hexdigest()+'  '+relative)
        output.writestr('CHECKSUMS.txt', '\n'.join(checksums)+'\n')
    with zipfile.ZipFile(target) as output:
        assert output.testzip() is None
        for name in output.namelist():
            assert '.photobooth-runtime' not in name and '__pycache__' not in name
        for line in output.read('CHECKSUMS.txt').decode().splitlines():
            digest, member = line.split('  ', 1)
            assert hashlib.sha256(output.read(member)).hexdigest() == digest
    print(f'{target.name}: {len(files)} files, {target.stat().st_size/1048576:.1f} MiB; checksums verified')
    return target


def main():
    assets = sorted((ROOT/'experimental/frames-ai').glob('*.png')) + [ROOT/'experimental/frames-ai/prompts.json', ROOT/'experimental/photobooth_presets.json', ROOT/'experimental/demo/frames-ai-preview.png']
    art_zip = archive('Photobooth-AI-Frames.zip', assets)
    files = sources()
    full = archive('Locket-Filter-Trial.zip', files)
    phone_files = [ROOT/name for name in [
        'START_HERE_VI.txt', 'Locket-Custom.local.sgmodule', 'Locket-Filter-Probe.local.sgmodule',
        'scripts/locket-custom.js', 'scripts/locket-filter-probe.js', 'experimental/TRY_NATIVE_VI.txt',
    ]]
    phone_files += [ROOT/name for name in ['Locket-Custom.sgmodule','Locket-Filter-Probe.sgmodule'] if (ROOT/name).is_file()]
    small = archive('Locket-iPhone-Probe.zip', phone_files)
    hashed = files + [full, small]
    if art_zip.exists():
        hashed.append(art_zip)
    (ROOT/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(ROOT).as_posix()+'\n' for p in sorted(hashed)), encoding='utf-8')


if __name__ == '__main__':
    main()
