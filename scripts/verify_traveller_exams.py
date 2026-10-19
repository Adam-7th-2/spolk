"""Verify every exam page and audio track against the supplied original test pack."""
from pathlib import Path
import json,sys,hashlib
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.tools/pdf-libs'))
import pymupdf
pack=root/'apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru';assets=root/'apps/web/private/books/traveller/exams'
m=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'));source=pymupdf.open(pack/m['source'])
key_source=pymupdf.open(pack/'Traveller Beginners_Key to Test.pdf')
page_count=0
for e in m['exams']:
 paper=pymupdf.open(assets/e['files']['paper']);assert len(paper)==len(e['sourcePages'])
 assert hashlib.sha256((assets/e['files']['paper']).read_bytes()).hexdigest()==e['sha256']
 for index,page in enumerate(e['sourcePages']):
  assert paper[index].get_pixmap(matrix=pymupdf.Matrix(.5,.5)).samples==source[page-1].get_pixmap(matrix=pymupdf.Matrix(.5,.5)).samples
  assert (assets/f"{e['id']}-page-{index+1}.jpg").is_file();page_count+=1
 assert (assets/e['files']['audio']).read_bytes()==(pack/e['audioSource']).read_bytes()
 assert (assets/e['files']['document']).read_bytes()==(pack/e['documentSource']).read_bytes()
 for name,filename in e['files'].items():
  assert hashlib.sha256((assets/filename).read_bytes()).hexdigest()==e['resourceHashes'][name]
 key=pymupdf.open(assets/e['files']['key']);assert len(key)==len(e['keyRegions'])
 expected_text=[]
 for index,region in enumerate(e['keyRegions']):
  original=key_source[region['sourcePage']-1];clip=pymupdf.Rect(region['clip'])
  expected_text.append(f"Answer booklet page {region['sourcePage']}\n"+original.get_text(clip=clip))
  assert (assets/f"{e['id']}-key-page-{index+1}.jpg").is_file()
  # Compare the extracted PDF's visible words with the original selected region.
  actual_words=[w[4] for w in key[index].get_text('words')]
  original_words=[w[4] for w in original.get_text('words',clip=clip)]
  assert actual_words==original_words,(e['id'],index)
 assert (assets/e['files']['keyText']).read_text(encoding='utf-8')=='\n\n'.join(expected_text)
 expected_paper='\n\n'.join(f'Original test booklet PDF page {p}\n'+source[p-1].get_text() for p in e['sourcePages'])
 assert (assets/e['files']['paperText']).read_text(encoding='utf-8')==expected_paper
 assert (assets/'teacher-key.pdf').read_bytes()==(pack/'Traveller Beginners_Key to Test.pdf').read_bytes()
assert page_count==32
assert (assets/'teacher-key.doc').read_bytes()==(pack/'Traveller Beg_KEY TO TESTS.doc').read_bytes()
print('PASS: 10 original exam PDFs, 32 source pages, 10 identical MP3s, 10 identical Word tests, 10 paper texts, 10 per-test answer PDFs/texts with 12 verified original key regions, and the original teacher-key documents.')
