import "server-only";
import {mkdir,readdir,readFile,writeFile,unlink} from "node:fs/promises";
import {resolve} from "node:path";
import {randomUUID} from "node:crypto";
import {libraryFolder,libraryExtension,validLibraryBytes,MAX_LIBRARY_FILE} from "./traveller-library";
import {cloudUploads} from './private-upload-config';
import {privateUploadStorage} from './private-upload-client';
export type LibraryFile={id:string;name:string;bytes:number;extension:string;createdAt:string};
export function storageFolder(level:string){if(!libraryFolder(level))throw new Error("Unknown folder");return resolve(process.cwd(),"private/library/traveller",level);}
export async function libraryFiles(level:string):Promise<LibraryFile[]>{
 const dir=storageFolder(level),remote=cloudUploads()?privateUploadStorage():null;
 if(!remote)await mkdir(dir,{recursive:true});
 const files=remote?await remote.names(`library/${level}`):await readdir(dir),rows:LibraryFile[]=[];
 for(const f of files.filter(f=>/^[0-9a-f-]{36}\.json$/.test(f))){const bytes=remote?await remote.read(`library/${level}/${f}`):await readFile(resolve(dir,f));rows.push(JSON.parse(bytes.toString('utf8')) as LibraryFile);}
 return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function saveLibraryFile(level:string,file:File){
 const extension=libraryExtension(file.name);if(!extension||file.size<1||file.size>MAX_LIBRARY_FILE)throw new Error("Use a PDF, supported audio file, or archive up to 50 MB.");
 const dir=storageFolder(level),bytes=new Uint8Array(await file.arrayBuffer());if(!validLibraryBytes(extension,bytes))throw new Error("File contents do not match the selected file type.");
 const id=randomUUID(),metadata:LibraryFile={id,name:file.name.replace(/[\x00-\x1f\x7f]/g,"").slice(0,200),bytes:file.size,extension,createdAt:new Date().toISOString()};
 if(cloudUploads()){
  const remote=privateUploadStorage(),key=`library/${level}/${id}`;await remote.put(key+'.bin',bytes);
  try{await remote.put(key+'.json',Buffer.from(JSON.stringify(metadata)),'application/json');}catch(error){await remote.remove(key+'.bin').catch(()=>{});throw error;}
 }else{
  await mkdir(dir,{recursive:true});await writeFile(resolve(dir,id+'.bin'),bytes,{flag:'wx'});
  try{await writeFile(resolve(dir,id+'.json'),JSON.stringify(metadata),{flag:'wx'});}catch(error){await unlink(resolve(dir,id+'.bin'));throw error;}
 }
 return metadata;
}
export async function storedLibraryFile(level:string,id:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))throw new Error('Invalid file identifier');const dir=storageFolder(level);
 const remote=cloudUploads()?privateUploadStorage():null,key=`library/${level}/${id}`;
 const meta=JSON.parse((remote?await remote.read(key+'.json'):await readFile(resolve(dir,id+'.json'))).toString('utf8')) as LibraryFile;
 const bytes=remote?await remote.read(key+'.bin'):await readFile(resolve(dir,id+'.bin'));return {meta,bytes};
}
