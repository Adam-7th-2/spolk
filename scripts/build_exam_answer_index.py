"""Build a private question-addressed index from the supplied, extracted test keys."""
from pathlib import Path
import json,re,hashlib
root=Path(__file__).resolve().parents[1]
assets=root/'apps/web/private/books/traveller/exams'
manifest=json.loads((root/'apps/web/src/content/traveller-exams.json').read_text(encoding='utf-8'))
headers={'VOCABULARY':'vocabulary','COMMUNICATION':'communication','GRAMMAR':'grammar','LISTEN':'listen','READ':'read'}
for exam in manifest['exams']:
 text=(assets/exam['files']['keyText']).read_text(encoding='utf-8');fields=[];section=None;group=None;current=None
 answer_text=text[text.index('FINAL TEST'):] if exam['id']=='final' else text
 for raw in answer_text.splitlines():
  line=raw.strip()
  if 'LISTENING TRANSCRIPT' in line.upper() or line.lower()=='listening transcript':break
  if line in headers:section=headers[line];group=None;current=None;continue
  if not section or not line or line.startswith(('Answer booklet','TEST ','MID-TERM','FINAL TEST','Traveller','Copyright','Copyright ©')):continue
  if re.fullmatch(r'[A-D]\.',line):group=line[0].lower();current=None;continue
  item=re.match(r'^(\d+)\.\s*(.*)',line)
  named=re.match(r'^([A-Za-z][A-Za-z ]{0,25}):\s*(.+)',line)
  if item or named:
   number,answer=(item.group(1),item.group(2)) if item else (named.group(1).lower().replace(' ','-'),named.group(2))
   field_id='.'.join(x for x in [section,group,number] if x)
   current={'id':field_id,'section':section,'group':group,'number':number,'expected':answer,'source':f"{exam['id']}:key:{field_id}"}
   fields.append(current)
  elif current and not line.startswith(('Copyright','©')):
   current['expected']+=' '+line
 # Open-ended writing has no published exact answer and is never auto-scored.
 for field in fields:
  answer=field['expected'].strip();field['expected']=answer
  field['kind']='choice' if re.fullmatch(r'[a-jTF]',answer) else 'category' if not field['number'].isdigit() and field['section']=='vocabulary' else 'short'
  if '(' in answer or '...' in answer or len(answer.split())>6 or '/' in answer:field['kind']='review'
  field['accepted']=[answer]
  if exam['id']=='module-1' and field['id']=='read.2':
   field['kind']='short';field['accepted']=['Tyler / Ethan','Tyler and Ethan','Ethan and Tyler','Tyler, Ethan','Ethan, Tyler']
 fields.append({'id':'write','section':'write','group':None,'number':'','expected':'Open writing task: teacher review required.','accepted':[],'kind':'review','source':exam['id']+':paper:write'})
 assert fields and len({f['id'] for f in fields})==len(fields),exam['id']
 index={'examId':exam['id'],'sourceHash':hashlib.sha256(text.encode()).hexdigest(),'fields':fields,'keyText':text,'paperText':(assets/exam['files']['paperText']).read_text(encoding='utf-8')}
 (assets/f"{exam['id']}-answer-index.json").write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
 print(exam['id'],len(fields),'question addresses')
