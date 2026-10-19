"""Extract per-test teacher keys, text and original Word files; keep answers private."""
from pathlib import Path
import json,sys,shutil,hashlib
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'.tools/pdf-libs'))
import pymupdf
pack=root/'apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru'
out=root/'apps/web/private/books/traveller/exams'
manifest_path=root/'apps/web/src/content/traveller-exams.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
keys=pymupdf.open(pack/'Traveller Beginners_Key to Test.pdf')
papers=pymupdf.open(pack/'Traveller Beginners_Tests.pdf')
# Coordinates inspected against all eight original key pages. Some tests share a page;
# tests 2 and 7 continue with their listening transcript on the following page.
regions={
 'module-1':[(1,75,480)],
 'module-2':[(1,490,750),(2,45,350)],
 'module-3':[(2,365,755)],
 'module-4':[(3,75,750)],
 'midterm':[(4,75,750)],
 'module-5':[(5,75,750)],
 'module-6':[(6,60,520)],
 'module-7':[(6,530,750),(7,60,280)],
 'module-8':[(7,290,755)],
 'final':[(8,80,750)],
}
for exam in manifest['exams']:
 key=exam['id'];document='Final Test_Traveller Beg.doc' if key=='final' else 'mid-term Test_Traveller Beg.doc' if key=='midterm' else f'Test {key.split("-")[1]}_Traveller Beg.doc'
 doc_bytes=(pack/document).read_bytes();assert doc_bytes[:8]==bytes.fromhex('d0cf11e0a1b11ae1'),document
 shutil.copyfile(pack/document,out/f'{key}.doc')
 pdf=pymupdf.open();texts=[]
 for index,(page,top,bottom) in enumerate(regions[key]):
  original=keys[page-1];clip=pymupdf.Rect(35,top,565,bottom)
  dest=pdf.new_page(width=clip.width,height=clip.height)
  dest.show_pdf_page(dest.rect,keys,page-1,clip=clip)
  original.get_pixmap(matrix=pymupdf.Matrix(2,2),clip=clip,alpha=False).save(str(out/f'{key}-key-page-{index+1}.jpg'),jpg_quality=92)
  texts.append(f'Answer booklet page {page}\n'+original.get_text(clip=clip))
 pdf.save(str(out/f'{key}-key.pdf'),garbage=3,deflate=True)
 answer_text='\n\n'.join(texts)
 # Retain the original spelling, numbering and accepted variants; do not infer writing answers.
 assert 'LISTEN' in answer_text.upper() and 'GRAMMAR' in answer_text,key
 (out/f'{key}-key.txt').write_text(answer_text,encoding='utf-8')
 paper_text='\n\n'.join(f'Original test booklet PDF page {p}\n'+papers[p-1].get_text() for p in exam['sourcePages'])
 (out/f'{key}-paper.txt').write_text(paper_text,encoding='utf-8')
 exam['documentSource']=document
 exam['keyRegions']=[{'sourcePage':page,'clip':[35,top,565,bottom]} for page,top,bottom in regions[key]]
 exam['files'].update(document=f'{key}.doc',key=f'{key}-key.pdf',keyText=f'{key}-key.txt',paperText=f'{key}-paper.txt')
 exam['resourceHashes']={name:hashlib.sha256((out/filename).read_bytes()).hexdigest() for name,filename in exam['files'].items()}
shutil.copyfile(pack/'Traveller Beg_KEY TO TESTS.doc',out/'teacher-key.doc')
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Prepared 10 original Word tests, 10 per-test answer PDFs/texts, 12 answer image regions, 10 paper texts and the original teacher-key Word document.')

# Build the private grading index after refreshing extracted reference text.
import runpy
runpy.run_path(str(root/"scripts/build_exam_answer_index.py"))
