"""OCR only the supplied student book; never index teacher keys or test packs.
Run with workspace-local .tools/ocr-libs dependencies. Output stays private.
"""
import hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tools/ocr-libs'))
from rapidocr_onnxruntime import RapidOCR
base=ROOT/'apps/web/private/books/traveller'
expected='4a8aaabad1c8f7a357d252fd1c6c834c5fcf877f9c56cd4f66dfde46a7fed20e'
if hashlib.sha256((base/'source.pdf').read_bytes()).hexdigest()!=expected:
    raise SystemExit('Student book fingerprint changed; review source before indexing.')
output=base/'page-text.json'
data=json.loads(output.read_text(encoding='utf-8')) if output.exists() else {'sourceSha256':expected,'method':'OCR; verify quotations against original page','pages':{}}
if data.get('sourceSha256')!=expected: raise SystemExit('Index source mismatch')
engine=RapidOCR(intra_op_num_threads=2,inter_op_num_threads=2)
for page in range(1,127):
    key=str(page)
    if key in data['pages']: continue
    image=base/'pages'/f'{page:03d}.jpg'
    result,_=engine(str(image))
    data['pages'][key]='\n'.join(line[1] for line in (result or []) if line[2]>=.75)
    temp=output.with_suffix('.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');temp.replace(output)
    print(f'Indexed student book page {page}/126',flush=True)
