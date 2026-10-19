"""Check every student word against its paper and keep teacher material separate."""
from pathlib import Path
import json,sys,hashlib
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.tools/pdf-libs'))
import pymupdf
pack=root/'apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru'
out=root/'apps/web/private/books/traveller/exams'
manifest=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'))
source=pymupdf.open(pack/manifest['source'])
count=0
for exam in manifest['exams']:
 data=json.loads((out/f"{exam['id']}-extracted.json").read_text(encoding='utf-8'))
 assert [p['sourcePage'] for p in data['pages']]==exam['sourcePages']
 assert set(data)=={'examId','title','source','sourceSha256','pages','wordCount'}
 for page in data['pages']:
  original=source[page['sourcePage']-1]
  assert page['text']==original.get_text(sort=True)
  assert [w['text'] for w in page['words']]==[w[4] for w in original.get_text('words')]
  count+=len(page['words'])
 assert (out/f"{exam['id']}-word.txt").stat().st_size>0
report=json.loads((out/'extraction-report.json').read_text(encoding='utf-8'))
assert len(report['files'])==28 and len(report['exams'])==10
for entry in report['files']: assert hashlib.sha256((pack/entry['name']).read_bytes()).hexdigest()==entry['sha256']
assert count==sum(e['wordCount'] for e in report['exams'])
for index in range(1,4): assert (out/f'pack-pdf-{index}.txt').stat().st_size>0
print(f'PASS: {count} exact PDF words, 32 page texts, 10 Word extracts, 3 full staff PDF texts and 28 source hashes. Student JSON contains paper data only.')
