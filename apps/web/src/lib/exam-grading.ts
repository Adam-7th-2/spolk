export type AnswerField={id:string;section:string;group:string|null;number:string;expected:string;accepted:string[];kind:string;source:string};
export type AnswerIndex={examId:string;sourceHash:string;fields:AnswerField[];keyText:string;paperText:string};
const normal=(value:string)=>value.normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'").replace(/\bcan't\b/g,"cannot").replace(/\bwon't\b/g,"will not").replace(/n't\b/g," not").replace(/\bcan not\b/g,"cannot").replace(/'m\b/g," am").replace(/'re\b/g," are").replace(/'ve\b/g," have").replace(/\btrue\b/g,"t").replace(/\bfalse\b/g,"f").replace(/[^\p{L}\p{N}']/gu," ").replace(/\s+/g," ").trim();
const address=(value:string)=>value.trim().toLowerCase().replace(/[\s_]+/g,".").replace(/\.+/g,".");
export function parseAnswerSheet(text:string,fields:AnswerField[]){
 const imported=/\[ANSWER_FILE_TEXT\]\n([\s\S]*?)\n\[\/ANSWER_FILE_TEXT\]/.exec(text.replace(/\n\npage-[2-4]\n/g,""));if(imported)text=imported[1];
 const valid=new Set(fields.map(f=>f.id));const answers:Record<string,string>={};
 const first=text.indexOf("{");const last=text.lastIndexOf("}");
 if(first>=0&&last>first){try{const parsed=JSON.parse(text.slice(first,last+1));if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))for(const[key,value]of Object.entries(parsed)){const id=address(key);if(valid.has(id)&&typeof value==="string")answers[id]=value.trim();}}catch{/* A normal text sheet need not be JSON. */}}
 let section="",group="",previous="";
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();if(!line)continue;
  const direct=/^((?:vocabulary|communication|grammar|listen|read|write)(?:[. _-][a-z0-9-]+){0,3})\s*[:=]\s*(.*)$/i.exec(line);
  if(direct){const id=address(direct[1]);if(valid.has(id)){answers[id]=direct[2].trim();previous=id;}continue;}
  if(/^(VOCABULARY|COMMUNICATION|GRAMMAR|LISTEN(?:ING)?|READ(?:ING)?|WRITE|WRITING)\s*:?$/i.test(line)){section=line.toLowerCase().replace(/:?$/," ").trim().replace("listening","listen").replace("reading","read").replace("writing","write");group="";previous="";continue;}
  if(/^[A-D][.)]?$/i.test(line)){group=line[0].toLowerCase();previous="";continue;}
  const numbered=/^(\d+|[A-Za-z][A-Za-z -]{0,24})[.):=]\s*(.*)$/.exec(line);
  if(numbered&&section){const id=[section,group,numbered[1].toLowerCase().replace(/ /g,"-")].filter(Boolean).join(".");if(valid.has(id)){answers[id]=numbered[2];previous=id;}else previous="";continue;}
  if(section==="write"){answers.write=[answers.write,line].filter(Boolean).join(" ");continue;}
  if(previous&&!/^page-[1-4]$/.test(line)&&!line.startsWith("[Uploaded"))answers[previous]+=" "+line;
 }
 return answers;
}
export function retrieveExamReferences(index:AnswerIndex,examId:string,questionIds:string[]){
 if(index.examId!==examId)throw new Error("Reference/test mismatch");
 const ids=new Set(questionIds);return index.fields.filter(f=>ids.has(f.id));
}
export function reviewAnswerSheet(index:AnswerIndex,text:string){
 const answers=parseAnswerSheet(text,index.fields);const mapped=Object.keys(answers).length;
 const references=retrieveExamReferences(index,index.examId,index.fields.map(f=>f.id));
 const rows=references.map(field=>{
  const answer=answers[field.id]||"";let status:"correct"|"incorrect"|"missing"|"review";
  const matches=field.accepted.some(expected=>field.kind==="category"?normal(expected).split(" ").sort().join(" ")===normal(answer).split(" ").sort().join(" "):normal(expected)===normal(answer));
  if(!mapped&&text.trim())status="review";
  else if(!answer)status=field.section==="write"?"review":"missing";
  else if(/\(any\b/i.test(field.expected))status="review";
  else if(matches)status="correct";
  else if(field.kind==="review"||field.section==="write"||field.expected.includes(","))status="review";
  else status="incorrect";
  const explanation=status==="correct"?"Your response matches the published reference (case, spacing and punctuation are ignored).":status==="missing"?"No answer was identified at this question address. Check the numbering on your uploaded sheet.":status==="review"?"A teacher must check this response or its question mapping. No automatic mark has been deducted.":`Your response differs from the published answer for ${field.section}${field.group?` ${field.group.toUpperCase()}`:""}, ${field.number}. Compare the response with the original exercise and the reference shown here.`;
  return {questionId:field.id,answer,status,expected:status==="correct"||status==="incorrect"?field.expected:null,explanation,source:field.source};
 });
 const counts={correct:0,incorrect:0,missing:0,review:0};for(const row of rows)counts[row.status]++;
 return {examId:index.examId,method:"private-reference-retrieval" as const,mappedAnswers:mapped,counts,rows,finalGrade:false as const,notice:"This is a reference-based draft review, not a final mark. Open writing, accepted variants and uncertain mappings require teacher review. Counts are questions, not the original paper’s weighted marks."};
}
