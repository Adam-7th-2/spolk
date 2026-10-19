"""Verify local textbook source bytes, page images, and every lesson PDF."""
from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'.tools/pdf-libs'))
import pymupdf
manifest=json.loads((root/'apps/web/src/content/traveller.json').read_text(encoding='utf-8'))
assets=root/'apps/web/private/books/traveller'
assert hashlib.sha256((assets/'source.pdf').read_bytes()).hexdigest()==manifest['source']['sha256']
source=pymupdf.open(assets/'source.pdf')
count=0
for lesson in manifest['lessons']:
 subset=pymupdf.open(assets/'lessons'/f"{lesson['id']}.pdf")
 assert len(subset)==len(lesson['pages'])
 for index,page in enumerate(lesson['pages']):
  image=assets/'pages'/f'{page:03}.jpg'
  assert hashlib.sha256(image.read_bytes()).hexdigest()==manifest['source']['pageImageHashes'][page-1]
  assert source[page-1].get_pixmap(matrix=pymupdf.Matrix(.5,.5),alpha=False).samples==subset[index].get_pixmap(matrix=pymupdf.Matrix(.5,.5),alpha=False).samples, f'Lesson PDF differs on source page {page}'
  count+=1
 subset.close()
assert count==126
print('PASS: source SHA-256 unchanged; all 126 image hashes verified; all 71 lesson PDFs render identically to their original source pages.')
