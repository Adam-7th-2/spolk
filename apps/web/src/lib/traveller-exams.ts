import listening from "../content/traveller-listening.json";
import manifest from "../content/traveller-exams.json";
export {manifest as examManifest};
export function travellerExam(id:string){return manifest.exams.find(e=>e.id===id);}
export type ExamAsset={filename:string;type:string;staffOnly:boolean;download?:boolean};
export function examAsset(id:string,asset:string):ExamAsset|null{
 const exam=travellerExam(id);if(!exam)return null;
 if(asset==="extracted")return {filename:`${id}-extracted.json`,type:"application/json; charset=utf-8",staffOnly:false};
 if(asset==="word-text")return {filename:`${id}-word.txt`,type:"text/plain; charset=utf-8",staffOnly:true};
 if(asset==="extraction-report")return {filename:"extraction-report.json",type:"application/json; charset=utf-8",staffOnly:true};
 if(asset==="key-word-text")return {filename:"teacher-key-word.txt",type:"text/plain; charset=utf-8",staffOnly:true};
 if(/^pack-pdf-[1-3]$/.test(asset))return {filename:`${asset}.txt`,type:"text/plain; charset=utf-8",staffOnly:true};
 if(asset==="key")return {filename:exam.files.key,type:"application/pdf",staffOnly:true};
 if(asset==="key-text")return {filename:exam.files.keyText,type:"text/plain; charset=utf-8",staffOnly:true};
 if(asset==="key-document")return {filename:"teacher-key.doc",type:"application/msword",staffOnly:true,download:true};
 if(asset==="document")return {filename:exam.files.document,type:"application/msword",staffOnly:true,download:true};
 if(asset==="paper-text")return {filename:exam.files.paperText,type:"text/plain; charset=utf-8",staffOnly:false};
 if(asset==="audio")return {filename:exam.files.audio,type:"audio/mpeg",staffOnly:false};
 if(asset==="paper")return {filename:exam.files.paper,type:"application/pdf",staffOnly:false};
 const clip=listening.clips.find(c=>c.examId===id&&`listen-${c.questionId.split(".")[1]}`===asset);if(clip)return {filename:clip.filename,type:"audio/mpeg",staffOnly:false};
 const keyPage=/^key-page-([1-2])$/.exec(asset);
 if(keyPage&&Number(keyPage[1])<=exam.keyRegions.length)return {filename:`${id}-key-page-${keyPage[1]}.jpg`,type:"image/jpeg",staffOnly:true};
 const page=/^page-([1-4])$/.exec(asset);
 if(page&&Number(page[1])<=exam.sourcePages.length)return {filename:`${id}-page-${page[1]}.jpg`,type:"image/jpeg",staffOnly:false};
 return null;
}
export function canAccessExamAsset(asset:ExamAsset,staff:boolean,activeAttempt:boolean){return staff||(!asset.staffOnly&&activeAttempt);}
export function byteRange(header:string|null,size:number){if(!header)return null;const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return false;const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));const end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;return Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<=end&&start<size?{start,end}:false;}
