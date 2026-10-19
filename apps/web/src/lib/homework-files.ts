import {mkdir,readFile,writeFile,unlink} from "node:fs/promises";
import {resolve} from "node:path";
import {randomUUID} from "node:crypto";
export const MAX_HOMEWORK_FILE=10*1024*1024;
export const HOMEWORK_ACCEPT=".pdf,.txt,.png,.jpg,.jpeg,.docx";
export type HomeworkFile={id:string;name:string;type:string;size:number};
export function homeworkType(name:string,bytes:Uint8Array):string|null{
 const ext=name.toLowerCase().split('.').at(-1);
 if(ext==='pdf'&&Buffer.from(bytes.subarray(0,5)).toString()==='%PDF-')return 'application/pdf';
 if(ext==='png'&&Buffer.from(bytes.subarray(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if((ext==='jpg'||ext==='jpeg')&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(ext==='docx'&&bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4)return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 if(ext==='txt')try{const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))return 'text/plain';}catch{}
 return null;
}
const folder=()=>resolve(process.cwd(),'private/homework-uploads');
const validId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
export async function storeHomeworkFile(file:File):Promise<HomeworkFile>{
 if(file.size<1||file.size>MAX_HOMEWORK_FILE)throw new Error('Each file must be between 1 byte and 10 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer()),type=homeworkType(file.name,bytes);
 if(!type)throw new Error('Choose a PDF, UTF-8 text, JPG, PNG, or DOCX file with matching contents.');
 const id=randomUUID(),name=file.name.replace(/[\x00-\x1f\x7f/\\]/g,'').slice(0,180)||'assignment';
 await mkdir(folder(),{recursive:true});await writeFile(resolve(folder(),id+'.bin'),bytes,{flag:'wx'});
 return {id,name,type,size:bytes.byteLength};
}
export async function removeHomeworkFile(id:string){if(validId(id))await unlink(resolve(folder(),id+'.bin')).catch(()=>{});}
export async function readHomeworkFile(id:string){if(!validId(id))throw new Error('Unknown file');return readFile(resolve(folder(),id+'.bin'));}
