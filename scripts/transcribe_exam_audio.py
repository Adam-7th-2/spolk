import sys,os,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.tools/audio-libs'))
os.environ['HF_HOME']=str(root/'.tools/huggingface');os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
import subprocess,numpy as np,imageio_ffmpeg
from faster_whisper import WhisperModel
m=WhisperModel('tiny.en',device='cpu',compute_type='int8',download_root=str(root/'.tools/whisper-models'))
manifest=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'))
for e in manifest['exams']:
 dest=root/f".tools/asr-{e['id']}.json"
 source=root/'apps/web/private/books/traveller/exams'/e['files']['audio'];source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
 if dest.exists():
  cached=json.loads(dest.read_text());
  if isinstance(cached,dict) and cached.get("sourceSha256")==source_hash:continue
 pcm=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(root/'apps/web/private/books/traveller/exams'/e['files']['audio']),'-f','s16le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True).stdout
 audio=np.frombuffer(pcm,np.int16).astype(np.float32)/32768
 segs,info=m.transcribe(audio,word_timestamps=True,beam_size=5,language='en',vad_filter=False)
 data=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'word':w.word} for w in s.words or []]} for s in segs]
 dest.write_text(json.dumps({"sourceSha256":source_hash,"model":"tiny.en","segments":data}),encoding='utf-8');print(e['id'],[(round(s['start'],1),round(s['end'],1),s['text']) for s in data],flush=True)
