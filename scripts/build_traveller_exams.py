"""Split original test papers and match the publisher track list. No keys are sent to students."""
import sys,json,hashlib,uuid,shutil,re
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.tools/pdf-libs'))
import pymupdf
pack=root/'apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru'
out=root/'apps/web/private/books/traveller/exams';out.mkdir(parents=True,exist_ok=True)
source=pymupdf.open(pack/'Traveller Beginners_Tests.pdf')
book=json.loads((root/'apps/web/src/content/traveller.json').read_text(encoding='utf-8'))
def uid(key):return str(uuid.uuid5(uuid.NAMESPACE_URL,'spolk:traveller-exam:'+key))
ranges=[('module-1',1,3,5,7,2,45),('module-2',2,5,8,10,3,45),('module-3',3,7,11,13,4,45),('module-4',4,9,14,16,5,45),('midterm',4,9,17,20,6,60),('module-5',5,11,21,23,7,45),('module-6',6,13,24,26,8,45),('module-7',7,15,27,29,9,45),('module-8',8,17,30,32,10,45),('final',9,18,33,36,11,90)]
exams=[]
for key,module,week,start,end,track,minutes in ranges:
 title='Mid-term: Modules 1–4' if key=='midterm' else 'Final exam: Modules 1–8' if key=='final' else f'Module {module} exam'
 lesson=uid(key+':lesson');paper=pymupdf.open();texts=[]
 for page in range(start,end+1):
  paper.insert_pdf(source,from_page=page-1,to_page=page-1);texts.append(source[page-1].get_text());source[page-1].get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False).save(str(out/f'{key}-page-{page-start+1}.jpg'),jpg_quality=90)
 paper.save(str(out/f'{key}.pdf'),garbage=3,deflate=True)
 candidates=sorted(pack.glob(f'{track:02} *.mp3'));assert len(candidates)==1
 shutil.copyfile(candidates[0],out/f'{key}.mp3')
 total=re.findall(r'(\d+)\s*TOTAL SCORE','\n'.join(texts));assert total,key
 exams.append({'id':key,'title':title,'lessonId':lesson,'assignmentId':uid(key+':assignment'),'moduleId':book['modules'][module]['id'],'week':week,'minutes':minutes,'maxMarks':int(total[-1]),'sourcePages':list(range(start,end+1)),'track':track,'audioSource':candidates[0].name,'position':91 if key=='midterm' else 100 if key=='final' else 90,'files':{'paper':f'{key}.pdf','audio':f'{key}.mp3'},'sha256':hashlib.sha256((out/f'{key}.pdf').read_bytes()).hexdigest()})
shutil.copyfile(pack/'Traveller Beginners_Key to Test.pdf',out/'teacher-key.pdf')
shutil.copyfile(pack/'01 Pista 1.mp3',out/'titles.mp3')
manifest={'source':'Traveller Beginners_Tests.pdf','sourcePageCount':len(source),'courseSlug':'traveller-beginners','notes':['Track 1 is the titles track, as confirmed by the test booklet introduction.','Tracks 2–11 map to module tests, mid-term and final; they are exam listening audio, not the Student’s Book lesson recordings.','Original tests are teacher-graded using the private key; writing is not automatically scored.','45/60/90-minute limits are proposed academy settings, not durations printed by the publisher.'],'exams':exams}
(root/'apps/web/src/content/traveller-exams.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'exams':len(exams),'audioTracks':10,'paperPages':sum(len(e['sourcePages']) for e in exams),'teacherKeyPages':len(pymupdf.open(out/'teacher-key.pdf')),'marks':{e['id']:e['maxMarks'] for e in exams}}))

# Keep the additional per-test resources in sync when rebuilding the original papers.
import runpy
runpy.run_path(str(root/"scripts/build_traveller_test_resources.py"))
