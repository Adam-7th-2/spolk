"""Question clips aligned from local timestamped ASR and the original test/transcript."""
import sys,json,subprocess,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.tools/audio-libs'))
import imageio_ffmpeg
assets=root/'apps/web/private/books/traveller/exams'
# The complete exchange is kept when needed to interpret a question. Overlap is intentional.
timings={
 'module-1':[('surname',13,22),('age',22,32.5),('job',32.6,38.5)],
 'module-2':[('1',9.3,22),('2',23.8,37.7),('3',39.3,57.5)],
 'module-3':[('1',12,23.5),('2',12,23.5),('3',23.5,30.1),('4',30.1,34.6)],
 'module-4':[('1',9,31),('2',31.5,47.8),('3',47.9,74.5)],
 'midterm':[('1',10,33.3),('2',34.5,51.8),('3',53,74)],
 'module-5':[('1',9,28.8),('2',29.3,54.8),('3',56.5,80)],
 'module-6':[('1',22,28.7),('2',28.8,32.1),('3',37.2,44.7),('4',44.7,52.8)],
 'module-7':[('1',18,27),('2',28,37),('3',37,47)],
 'module-8':[('1',13,18.1),('2',19.7,25.65),('3',25.6,34.5)],
 'final':[('1',8,33.5),('2',35.5,52.5),('3',54,77),('4',78,95)],
}
manifest=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'))
clips=[]
for exam in manifest['exams']:
 source=assets/exam['files']['audio'];evidence=json.loads((root/f".tools/asr-{exam['id']}.json").read_text());assert evidence['sourceSha256']==hashlib.sha256(source.read_bytes()).hexdigest(),'Audio changed: transcribe and review its boundaries again';asr=evidence['segments']
 assert asr and any('listen' in s['text'].lower() for s in asr),exam['id']
 paper=(assets/exam['files']['paperText']).read_text(encoding='utf-8');page=None
 for line in paper.splitlines():
  if line.startswith('Original test booklet PDF page'):page=int(line.split()[-1])
  if line.strip()=='LISTEN':break
 for number,start,end in timings[exam['id']]:
  filename=f"{exam['id']}-listen-{number}.mp3"
  subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-ss',str(start),'-i',str(source),'-t',str(end-start),'-map','0:a:0','-codec:a','libmp3lame','-b:a','128k',str(assets/filename)],check=True)
  clips.append({'examId':exam['id'],'questionId':f'listen.{number}','label':f'Listening {number}','page':page,'start':start,'end':end,'filename':filename,'sha256':hashlib.sha256((assets/filename).read_bytes()).hexdigest(),'method':'Local timestamped ASR aligned to original questions and printed transcript; contextual overlap retained.'})
out={'reviewDate':'2026-10-18','clips':clips}
(root/'apps/web/src/content/traveller-listening.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(clips),'question-specific MP3 clips from all 10 original recordings.')
