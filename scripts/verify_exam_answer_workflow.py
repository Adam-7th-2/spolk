"""Verify private reference indexes, question clips and bounded answer-file extraction."""
from pathlib import Path
import json,sys,hashlib,subprocess,io,zipfile
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'.tools/audio-libs'));sys.path.insert(0,str(root/'.tools/pdf-libs'))
import av,pymupdf
assets=root/'apps/web/private/books/traveller/exams'
exams=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'))['exams']
clips=json.loads((root/'apps/web/src/content/traveller-listening.json').read_text(encoding='utf-8'))['clips']
for exam in exams:
 index=json.loads((assets/f"{exam['id']}-answer-index.json").read_text(encoding='utf-8'))
 assert index['examId']==exam['id']
 assert index['sourceHash']==hashlib.sha256((assets/exam['files']['keyText']).read_text(encoding='utf-8').encode()).hexdigest()
 assert len(index['fields'])>=30 and len({f['id'] for f in index['fields']})==len(index['fields'])
 assert index['fields'][-1]['section']=='write' and index['fields'][-1]['accepted']==[]
 expected={f['id'] for f in index['fields'] if f['section']=='listen'}
 assert expected=={c['questionId'] for c in clips if c['examId']==exam['id']}
 with av.open(str(assets/exam['files']['audio'])) as container:duration=container.duration/1000000
 for clip in [c for c in clips if c['examId']==exam['id']]:
  assert 0<=clip['start']<clip['end']<=duration
  data=(assets/clip['filename']).read_bytes();assert hashlib.sha256(data).hexdigest()==clip['sha256']
  with av.open(str(assets/clip['filename'])) as container:actual=container.duration/1000000
  assert abs(actual-(clip['end']-clip['start']))<.2,(clip['filename'],actual)
def extract(kind,data):return subprocess.run([sys.executable,str(root/'scripts/extract_student_answers.py'),kind],input=data,capture_output=True)
text='grammar.a.1: What\nlisten.1: T\nwrite: My original paragraph.'
assert json.loads(extract('txt',text.encode()).stdout)['text']==text
pdf=pymupdf.open();page=pdf.new_page();page.insert_text((40,50),text);result=json.loads(extract('pdf',pdf.tobytes()).stdout);assert 'grammar.a.1: What' in result['text'] and not result['manualReview']
scanned=pymupdf.open();scanned.new_page();assert json.loads(extract('pdf',scanned.tobytes()).stdout)['manualReview']
docx=io.BytesIO()
with zipfile.ZipFile(docx,'w') as z:z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>grammar.a.</w:t></w:r><w:r><w:t>1: What</w:t></w:r></w:p></w:body></w:document>')
assert json.loads(extract('docx',docx.getvalue()).stdout)['text']=='grammar.a.1: What'
assert extract('txt',b'x'*12001).returncode!=0
oversized=pymupdf.open()
for _ in range(21):oversized.new_page()
assert extract('pdf',oversized.tobytes()).returncode!=0
assert json.loads(extract('png',b'fixture').stdout)['manualReview']
print(f'PASS: 10 private reference indexes, {len(clips)} matching listening question clips and durations; TXT, text PDF, scanned PDF and split-run DOCX extraction; page/text limits and manual handwriting fallback.')
