"""Read a bounded answer upload from stdin. No document code, macros or commands run."""
from pathlib import Path
import sys,json,zipfile,io,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
kind=sys.argv[1];data=sys.stdin.buffer.read(6*1024*1024+1)
if len(data)>6*1024*1024:raise ValueError('File too large')
text='';manual=False
if kind in ('txt','json'):
 text=data.decode('utf-8-sig')
elif kind=='pdf':
 sys.path.insert(0,str(root/'.tools/pdf-libs'));import pymupdf
 doc=pymupdf.open(stream=data,filetype='pdf')
 if len(doc)>20:raise ValueError('Maximum 20 pages')
 text='\n'.join(page.get_text() for page in doc);manual=not bool(text.strip())
elif kind=='docx':
 with zipfile.ZipFile(io.BytesIO(data)) as archive:
  entry=archive.getinfo('word/document.xml')
  if entry.file_size>2000000:raise ValueError('Document too large')
  xml=ET.fromstring(archive.read(entry));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
  text='\n'.join(''.join(t.text or '' for t in paragraph.findall('.//w:t',ns)) for paragraph in xml.findall('.//w:p',ns))
elif kind in ('png','jpg','jpeg','doc'):manual=True
else:raise ValueError('Unsupported format')
if len(text)>12000:raise ValueError('Maximum 12000 extracted characters')
print(json.dumps({'text':text,'manualReview':manual},ensure_ascii=True))
