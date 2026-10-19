"""Generate a page-complete course manifest and private renderings from the supplied PDF.
Run: python scripts/build_traveller.py --pdf <path> (requires workspace .tools/pdf-libs).
Original pages stay private. Supplementary practice is NOT the publisher answer key.
"""
import argparse,hashlib,json,sys,uuid,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tools/pdf-libs'))
import pymupdf
parser=argparse.ArgumentParser();parser.add_argument('--pdf',required=True);args=parser.parse_args()
source=Path(args.pdf);doc=pymupdf.open(source)
if len(doc)!=126: raise SystemExit('This reviewed plan expects the supplied 126-page scan.')
private=ROOT/'apps/web/private/books/traveller';(private/'pages').mkdir(parents=True,exist_ok=True);(private/'lessons').mkdir(exist_ok=True)
shutil.copyfile(source,private/'source.pdf')
def uid(key):return str(uuid.uuid5(uuid.NAMESPACE_URL,'spolk:traveller-beginners:'+key))
# Each tuple is a new Spolk practice question: prompt, correct answer, distractors.
banks=[
[("Good morning, Alex. How ___ you?","are",["is","am"]),("I ___ fine, thank you.","am",["is","are"]),("Which greeting fits the evening?","Good evening.",["Good morning.","Good afternoon."]),
("I am from Spain. I am ___.","Spanish",["Spain","Spains"]),("She is from Italy. She is ___.","Italian",["Italy","Italies"]),("Choose an introduction.","This is my friend, Leo.",["These my friend Leo.","This my Leo is."]),
("Maria is my sister. ___ is a student.","She",["He","They"]),("Ben and Sara are my friends. ___ are students.","They",["She","He"]),("Tom is a teacher. ___ class is here.","His",["Her","Their"]),
("Which question asks for contact details?","What is your phone number?",["What colour is it?","Where is the bag?"]),("Choose the correct question.","How old are you?",["How old you is?","How you old are?"]),("Write the number after nineteen.","twenty",[]),
("I work in a hospital. I am ___ doctor.","a",["an","are"]),("Choose the correct phrase.","an actor",["a actor","actor an"]),("Which question asks about a job?","What do you do?",["How old are you?","What colour is it?"])],
[("What is this? ___ is a red bag.","It",["They","He"]),("Choose the correct phrase.","a blue umbrella",["an blue umbrella","blue a umbrella"]),("That pen ___ black.","is",["are","am"]),
("One watch, two ___.","watches",["watchs","watch"]),("___ are my books here.","These",["This","That"]),("One child, two ___.","children",["childs","childes"]),
("My mother's brother is my ___.","uncle",["sister","daughter"]),("She ___ got two brothers.","has",["have","is"]),("___ you got a sister?","Have",["Has","Are"]),
("Choose the correct phrase.","a nice jacket",["a jacket nice","nice a jacket"]),("These shoes ___ cheap.","are",["is","am"]),("What is the opposite of expensive?","cheap",["tall","old"]),
("He has got blue ___.","eyes",["eye","hair"]),("Choose a description of hair.","long and brown",["twenty years old","from Canada"]),("She is short. The opposite of short is ___.","tall",["young","cheap"])],
[("The news is ___ six o'clock.","at",["on","in"]),("Choose a television programme.","a documentary",["a kitchen","a wardrobe"]),("It is 7:30. It is half past ___.","seven",["six","eight"]),
("I ___ tennis on Mondays.","play",["plays","playing"]),("___ you like reading?","Do",["Does","Is"]),("I ___ watch television in the morning.","don't",["doesn't","isn't"]),
("Sara ___ up at seven.","gets",["get","getting"]),("He ___ work at five.","finishes",["finish","finishing"]),("We have lunch ___ the afternoon.","in",["on","at"]),
("___ he walk to work?","Does",["Do","Is"]),("She ___ take the bus.","doesn't",["don't","isn't"]),("How does he ___ to school?","get",["gets","getting"]),
("Choose the correct sentence.","I usually tidy my room.",["I tidy usually my room.","I my usually room tidy."]),("Which activity is housework?","doing the washing-up",["playing tennis","watching a film"]),("We visit friends ___ Sundays.","on",["in","at"])],
[("There ___ a kitchen downstairs.","is",["are","am"]),("There ___ two bedrooms.","are",["is","be"]),("Is there a garden? Yes, there ___.","is",["are","has"]),
("The lamp is next ___ the bed.","to",["at","on"]),("Choose a room item.","a wardrobe",["a sandwich","a hospital"]),("The book is ___ the table, not below it.","on",["under","between"]),
("I like this sofa. Give ___ to me, please.","it",["he","they"]),("These chairs are nice. I like ___.","them",["they","their"]),("Choose a household appliance.","a fridge",["a park","a street"]),
("Choose a negative instruction.","Don't turn left.",["Doesn't turn left.","Not turns left."]),("Go straight ___ .","on",["in","at"]),("Where can you catch a train?","at the station",["at a sofa","at a wardrobe"]),
("Write the ordinal number for 1.","first",[]),("Choose the correct question.","Where do you live?",["Where you live?","Where does you live?"]),("The opposite of modern is ___.","old-fashioned",["spacious","comfortable"])],
[("Which item is a fruit?","an apple",["rice","chicken"]),("Choose a countable food noun.","a banana",["water","milk"]),("I ___ strawberries. They are my favourite.","like",["likes","liking"]),
("There is ___ soup in the bowl.","some",["any","many"]),("Have you got ___ cheese?","any",["a","many"]),("Choose a polite order.","I'd like some chicken, please.",["I chicken like please would.","Some please chicken am."]),
("How ___ water do you drink?","much",["many","a"]),("How ___ apples do you need?","many",["much","an"]),("Choose the correct container.","a bottle of water",["a slice of water","a loaf of water"]),
("The price is 5. You pay 10. Your change is ___.","5",["10","15"]),("Choose an offer.","Would you like a drink?",["What colour is it?","Where is your bag?"]),("Which expression asks for a price?","How much is it?",["How many is it?","How old is it?"]),
("I like tea ___ I don't like coffee.","but",["or","because of"]),("I have toast ___ eggs for breakfast.","and",["but not","because of"]),("Which is an eating habit?","I have breakfast at seven.",["The bag is red.","The station is near."])],
[("She ___ swim very well.","can",["cans","is can"]),("Can he dance? No, he ___.","can't",["doesn't","isn't"]),("Choose the correct sentence.","I can use a computer.",["I can using a computer.","I cans use a computer."]),
("I ___ studying now.","am",["is","are"]),("She is ___ on the phone.","talking",["talk","talks"]),("They ___ watching TV now.","aren't",["isn't","doesn't"]),
("___ they planting trees?","Are",["Do","Is"]),("What is he ___ now?","doing",["do","does"]),("Which action helps the environment?","recycling bottles",["throwing rubbish in a lake","leaving taps running"]),
("Let's ___ a film.","watch",["watching","watches"]),("How about ___ a DVD?","watching",["watch","watches"]),("Choose a weather description.","It is cloudy.",["It is keyboard.","It is teacher."]),
("Which computer part do you type on?","a keyboard",["a screen","a mouse mat"]),("Write 100 in words.","one hundred",[]),("Choose an email closing.","Best wishes,",["Good morning?","How much?"])],
[("Yesterday I ___ my friends.","visited",["visit","visiting"]),("Choose the past tense of go.","went",["goed","goes"]),("Last night we ___ a film.","watched",["watch","watches"]),
("I ___ go to work yesterday.","didn't",["don't","doesn't"]),("___ you see Alex last week?","Did",["Do","Does"]),("After did, choose the correct verb: Did she ___?","fall",["fell","falls"]),
("The party ___ great.","was",["were","are"]),("Where ___ you yesterday?","were",["was","is"]),("Was it boring? No, it ___.","wasn't",["weren't","didn't"]),
("I usually play tennis, but yesterday I ___ football.","played",["play","playing"]),("Which sport uses a pool?","swimming",["golf","volleyball"]),("Choose a present habit.","I play tennis every Friday.",["I played tennis yesterday.","I visited Rome last year."]),
("She was born ___ 1998.","in",["on","at"]),("I stayed home ___ I was tired.","because",["but","or"]),("Choose a completed life event.","He got a degree in 2020.",["He is going to study tomorrow.","He studies every day."])],
[("I am going to ___ my friends.","visit",["visiting","visited"]),("She ___ going to travel tomorrow.","is",["are","am"]),("Which is a season?","spring",["Monday","January"]),
("___ you going to pack tonight?","Are",["Do","Did"]),("What are you going to ___?","take",["taking","took"]),("Choose a travel preparation.","book a flight",["wash a cloud","turn a month"]),
("I would like to ___ camping.","go",["going","went"]),("Choose a polite acceptance.","Yes, I'd love to.",["No, I isn't.","Yes, I did yesterday."]),("She wants to ___ water sports.","do",["doing","did"]),
("You should ___ a dentist.","visit",["visiting","visited"]),("You ___ eat lots of sweets with toothache.","shouldn't",["should","are"]),("Choose a health problem.","a headache",["a postcard","a forest"]),
("A postcard usually describes ___.","a place and your holiday",["only a password","only a phone number"]),("We ___ the museum yesterday.","visited",["visit","visiting"]),("Tomorrow we are going to ___ a boat trip.","take",["took","taking"])]]
module_names=['Nice to meet you','All about me','Everyday life','Places','Food','Get busy','Looking back','On holiday']
section_names=[['How are you?','Where are you from?',"Who's that?",'Contact details','What do you do?'],['What colour is it?','In my backpack','Family ties','My favourite clothes','Looking good'],['What time is it on?','Are you active?','Daily routine','Getting around','At home'],['Your house','Hotel rooms','Make yourself at home','In the city','House-hunting'],['Food preferences','Can I take your order?','At the supermarket','Fast food','Eating habits'],['Talents and abilities','On the phone','Get involved','Weather and arrangements','Computers and communication'],['What a day!','Unlucky days','How was it?','Sports and routines','My life story'],['Holiday plans','Getting ready','Holiday activities','Health and advice','What a holiday!']]
culture=['The British Isles: terminology','Names for family members','The Tembe Indians of the Amazon',"What's up there?",'Jacket potatoes','Life in the fast lane','The race to the South Pole','Travelling to New Zealand']
modules=[];lessons=[]
def add_module(key,title,pos,weeks):
 m={'id':uid('module:'+key),'title':title,'position':pos,'weeks':weeks};modules.append(m);return m

def add_lesson(m,key,title,pages,week,kind='study',questions=None,minutes=60):
 lesson_id=uid('lesson:'+key)
 q=[]
 for n,(prompt,correct,distractors) in enumerate(questions or []):
  options=[correct]+list(distractors)
  if distractors:
   shift=(n+week)%len(options);options=options[shift:]+options[:shift]
  q.append({'id':uid('question:'+key+':'+str(n)),'kind':'multiple_choice' if distractors else 'short_answer','prompt':prompt,'options':options if distractors else [],'correct_answer':correct,'points':1,'position':n})
 assignment=kind in ['study','review','culture','reference']
 body=f"Week {week} | {minutes} minutes | Original PDF pages {', '.join(map(str,pages))}.\nRead every displayed original page and complete all its numbered tasks in order. The page images and lesson PDF preserve the supplied scan. Add your responses with the PDF page and exercise number. Discuss speaking and pairwork tasks with your teacher.\n"
 if kind=='orientation':body+='Read the cover and both contents pages. Identify the book modules, learning goals, and reference sections. These scans include no publisher audio.\n'
 if kind=='opener':body+='Preview the module objectives and pictures. Discuss the introductory questions and set a personal learning goal.\n'
 if kind=='culture':body+='Read the original culture/cross-curricular page and complete its comprehension tasks. Historical claims are reproduced as printed, not asserted to be current.\n'
 if kind=='reference':body+='Use the original pairwork, song, or language-reference material as labelled on the page. Keep Student A and Student B roles separate where indicated.\n'
 body+='Listening: the publisher audio files were not supplied. Your teacher must provide authorized audio or mark that listening task pending; the app does not fabricate recordings or answer keys.\nSpolk practice below is additional material, separate from the original exercises. Original-page homework is teacher-reviewed; automatic quiz results are not the publisher answer key.'
 l={'id':lesson_id,'module_id':m['id'],'title':title,'position':len([x for x in lessons if x['module_id']==m['id']]),'week':week,'minutes':minutes,'kind':kind,'pages':pages,'body':body,'questions':q,'assessment_id':uid('assessment:'+key) if q else None,'assignment':{'id':uid('assignment:'+key),'title':'Original-page work: '+title,'instructions':f"Complete ALL numbered exercises on original PDF pages {', '.join(map(str,pages))}, in order. Label each response by PDF page and exercise number. For speaking/pairwork, add a short account of your teacher-led practice. Mark any listening task 'pending audio' until authorized audio is available. The teacher should grade reading/grammar/vocabulary and writing against the displayed pages and review speaking separately. Submit your work here. Do not invent answers to inaudible listening tasks."} if assignment else None}
 lessons.append(l)
intro=add_module('hello','Hello: getting started',0,[1])
add_lesson(intro,'orientation','Book cover and complete contents',[1,2,3],1,'orientation',minutes=20)
add_lesson(intro,'hello-words','International words, names and the alphabet',[4,5],1,questions=[('Choose a greeting.','Hello.',['Good night yesterday.','A computer.']),('Complete: My ___ is Alex.','name',['from','old']),('Which question asks for spelling?','How do you spell your name?',['Where is the taxi?','How much is it?'])])
add_lesson(intro,'hello-world','The English-speaking world and classroom language',[6],1,questions=[('Canada: choose the nationality.','Canadian',['Canada','Canadians country']),('Choose a classroom request.','Please repeat.',['The train leaves.','The bag is red.']),('Choose a request for help.','Can you help me, please?',['I am a city.','It is a burger.'])],minutes=45)
for n,name in enumerate(module_names):
 start=7+14*n;week=2+2*n;m=add_module(str(n+1),f'{n+1}. {name}',n+1,[week,week+1])
 add_lesson(m,f'{n+1}-opener',name+': module introduction',[start],week,'opener',minutes=20)
 for s,title in enumerate(section_names[n]):
  add_lesson(m,f'{n+1}-{s}',f'{n+1}{chr(97+s)} - {title}',[start+1+2*s,start+2+2*s],week if s<3 else week+1,questions=banks[n][s*3:s*3+3])
 add_lesson(m,f'{n+1}-review',name+': Round-up',[start+11,start+12],week+1,'review',questions=[banks[n][i] for i in [0,4,8,11,14]],minutes=75)
 add_lesson(m,f'{n+1}-culture',culture[n],[start+13],week+1,'culture',minutes=45)
ref=add_module('reference','Pairwork, songs and language reference',9,[18])
add_lesson(ref,'pairwork-a','Pairwork activities: source pages 119-120',[119,120],18,'reference')
add_lesson(ref,'pairwork-b','Pairwork activities: source pages 121-122',[121,122],18,'reference')
add_lesson(ref,'songs','Pairwork and song page: source pages 123-124',[123,124],18,'reference')
add_lesson(ref,'variants','British and American English: supplied duplicate pages',[125,126],18,'reference',minutes=30)
coverage=[p for l in lessons for p in l['pages']]
assert sorted(coverage)==list(range(1,len(doc)+1)) and len(set(coverage))==len(doc)
page_hashes=[]
for i,page in enumerate(doc):
 pix=page.get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False)
 data=pix.tobytes('jpeg',jpg_quality=90);(private/'pages'/f'{i+1:03}.jpg').write_bytes(data);page_hashes.append(hashlib.sha256(data).hexdigest())
for l in lessons:
 subset=pymupdf.open()
 for p in l['pages']:subset.insert_pdf(doc,from_page=p-1,to_page=p-1)
 subset.save(str(private/'lessons'/f"{l['id']}.pdf"),garbage=3,deflate=True)
manifest={'slug':'traveller-beginners','title':'Traveller Beginners - complete supplied student book','level':'A1','weeks':18,'source':{'title':'Traveller Beginners Student’s Book','author':'H. Q. Mitchell','pageCount':len(doc),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pageImageHashes':page_hashes,'notes':['All 126 supplied PDF pages are included in original file order.','Contents pages are scanned in their supplied order.','The contents refer to printed Grammar Reference pages 125-129, Learning Tips and Irregular Verbs page 130, and Word List page 132; those pages are absent from this PDF.','The last two supplied PDF pages both show printed page 131 (British/American English). Both are preserved.','Publisher audio and the teacher answer key were not supplied. OCR text is incomplete; original page images remain the authoritative source.']},'modules':modules,'lessons':lessons}
p=ROOT/'apps/web/src/content/traveller.json';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=['# Traveller course page coverage','',f"Source SHA-256: `{manifest['source']['sha256']}`",'',f"{len(doc)} PDF pages -> {len(modules)} modules -> {len(lessons)} lessons -> 18 weeks.",'',*['- '+s for s in manifest['source']['notes']],'','## Lesson plan','', '| Week | Module | Lesson | PDF pages | Minutes |','|---|---|---|---|---|']
for l in lessons:report.append(f"| {l['week']} | {next(m['title'] for m in modules if m['id']==l['module_id'])} | {l['title']} | {', '.join(map(str,l['pages']))} | {l['minutes']} |")
(ROOT/'docs/TRAVELLER_COVERAGE.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(doc),'modules':len(modules),'lessons':len(lessons),'quizzes':sum(bool(l['questions']) for l in lessons),'questions':sum(len(l['questions']) for l in lessons),'assignments':sum(bool(l['assignment']) for l in lessons),'duplicateFinalImage':page_hashes[-1]==page_hashes[-2]}))
