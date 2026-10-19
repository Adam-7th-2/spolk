"""Lossless text/word coordinates from supplied test PDFs; no answer content in student JSON."""
from pathlib import Path
import hashlib,json,re,sys
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'.tools/pdf-libs'))
import pymupdf
pack=root/'apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru'
out=root/'apps/web/private/books/traveller/exams'
manifest=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'))
source=pymupdf.open(pack/manifest['source'])
report={'source':manifest['source'],'sourceSha256':hashlib.sha256((pack/manifest['source']).read_bytes()).hexdigest(),'notes':['Text extraction preserves words, not the meaning of images or the visual order of every table. The original paper is authoritative.','Original Word text is staff-only because editable test documents may contain additional material.','Teacher keys and transcripts are never included in student extraction files.'],'files':[],'exams':[]}
for path in sorted(pack.iterdir()):
 if path.is_file(): report['files'].append({'name':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'kind':path.suffix.lower().lstrip('.')})
for index,path in enumerate(sorted(pack.glob('*.pdf')),1):
 pdf=pymupdf.open(path)
 text='\n\n'.join(f'Original PDF page {i+1}\n'+page.get_text(sort=True) for i,page in enumerate(pdf))
 (out/f'pack-pdf-{index}.txt').write_text(text,encoding='utf-8')
 entry=next(f for f in report['files'] if f['name']==path.name)
 entry.update(pageCount=len(pdf),textUrl=f'/api/traveller-exam-assets/module-1/pack-pdf-{index}')
for entry in report['files']:
 exam=next((e for e in manifest['exams'] if e['documentSource']==entry['name']),None)
 if exam: entry['textUrl']=f"/api/traveller-exam-assets/{exam['id']}/word-text"
 if entry['name']=='Traveller Beg_KEY TO TESTS.doc': entry['textUrl']='/api/traveller-exam-assets/module-1/key-word-text'
for exam in manifest['exams']:
 pages=[]
 for number in exam['sourcePages']:
  page=source[number-1]
  words=[{'text':w[4],'box':[round(v,2) for v in w[:4]],'block':w[5],'line':w[6],'position':w[7]} for w in page.get_text('words')]
  pages.append({'sourcePage':number,'width':page.rect.width,'height':page.rect.height,'text':page.get_text(sort=True),'words':words})
 student={'examId':exam['id'],'title':exam['title'],'source':manifest['source'],'sourceSha256':report['sourceSha256'],'pages':pages,'wordCount':sum(len(p['words']) for p in pages)}
 (out/f"{exam['id']}-extracted.json").write_text(json.dumps(student,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 word_path=out/f"{exam['id']}-word.txt"
 report['exams'].append({'id':exam['id'],'title':exam['title'],'week':exam['week'],'pages':exam['sourcePages'],'wordCount':student['wordCount'],'wordDocument':exam['documentSource'],'wordTextAvailable':word_path.exists(),'wordTextWords':len(re.findall(r'\S+',word_path.read_text(encoding='utf-8'))) if word_path.exists() else 0,'audioTrack':exam['track'],'audio':exam['audioSource'],'keyPages':[r['sourcePage'] for r in exam['keyRegions']]})
(out/'extraction-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
assert sum(len(e['pages']) for e in report['exams'])==32
assert all(e['wordCount']>0 for e in report['exams'])
print(f"Extracted {sum(e['wordCount'] for e in report['exams'])} PDF words across 32 pages, 10 tests; inventoried {len(report['files'])} original files. All data stays private.")
