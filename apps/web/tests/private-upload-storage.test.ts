import {it,expect,vi,afterEach} from 'vitest';
import {randomUUID} from 'node:crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createPrivateUploadStore} from '../src/lib/private-upload-storage';
const state=vi.hoisted(()=>{
 const files=new Map<string,Buffer>();const settings={failJSON:false};
 return {files,settings,remote:{
  async put(key:string,bytes:Uint8Array){if(settings.failJSON&&key.endsWith('.json'))throw new Error('Storage quota exceeded');if(files.has(key))throw new Error('Already exists');files.set(key,Buffer.from(bytes));},
  async read(key:string){const bytes=files.get(key);if(!bytes)throw new Error('Not found');return bytes;},
  async remove(key:string){files.delete(key);},
  async names(prefix:string){return [...files.keys()].filter(key=>key.startsWith(prefix+'/')).map(key=>key.slice(prefix.length+1));},
 }};
});
vi.mock('server-only',()=>({}));
vi.mock('../src/lib/private-upload-client',()=>({privateUploadStorage:()=>state.remote}));
import {cloudUploads} from '../src/lib/private-upload-config';
import {storeHomeworkFile,readHomeworkFile,removeHomeworkFile} from '../src/lib/homework-files';
import {saveLibraryFile,libraryFiles,storedLibraryFile} from '../src/lib/library-storage';
import {storeAnswerFile,uploadedAnswer,listAnswerUploads} from '../src/lib/exam-answer-store';
afterEach(()=>{vi.unstubAllEnvs();state.files.clear();state.settings.failJSON=false;});
function enableCloud(){vi.stubEnv('PRIVATE_UPLOAD_STORAGE','supabase');vi.stubEnv('SPOLK_DATA_MODE','hosted');}
it('uploads private objects without overwrite and rejects path traversal',async()=>{
 const upload=vi.fn(async()=>({data:{path:'homework/test.bin'},error:null}));
 const bucket={upload,download:async()=>({data:new Blob(['answer']),error:null}),remove:async()=>({error:null}),list:async()=>({data:[],error:null})};
 const store=createPrivateUploadStore(bucket as unknown as ReturnType<SupabaseClient['storage']['from']>);
 await store.put('homework/test.bin',Buffer.from('answer'));expect(upload.mock.calls[0]).toEqual(['homework/test.bin',Buffer.from('answer'),{contentType:'application/octet-stream',upsert:false,cacheControl:'0'}]);
 expect((await store.read('homework/test.bin')).toString()).toBe('answer');
 for(const key of ['../secret','/homework/file','homework/../file','homework/a\\b','public/answer','homework//file'])await expect(store.put(key,Buffer.from('x'))).rejects.toThrow('Invalid private');
});
it('paginates object metadata and reports storage failures instead of pretending a save succeeded',async()=>{
 const list=vi.fn(async(_prefix:string,{offset}:{offset:number})=>({data:offset===0?Array.from({length:1000},(_,i)=>({id:String(i+1),name:`file-${i}.json`})):[{id:'last',name:'last.json'},{id:null,name:'folder'}],error:null}));
 const store=createPrivateUploadStore({list,upload:async()=>({error:{message:'quota'}}),download:async()=>({data:null,error:{message:'missing'}}),remove:async()=>({error:{message:'offline'}})} as unknown as ReturnType<SupabaseClient['storage']['from']>);
 expect(await store.names('library/beginners')).toHaveLength(1001);expect(list).toHaveBeenCalledTimes(2);
 await expect(store.put('homework/test.bin',Buffer.from('x'))).rejects.toThrow('could not be saved');await expect(store.read('homework/test.bin')).rejects.toThrow('unavailable');await expect(store.remove('homework/test.bin')).rejects.toThrow('cleanup');
});
it('keeps offline mode isolated from hosted upload settings',()=>{enableCloud();expect(cloudUploads()).toBe(true);vi.stubEnv('SPOLK_DATA_MODE','local');expect(cloudUploads()).toBe(false);});
it('stores homework attachments remotely and can read them in a later request',async()=>{
 enableCloud();const file=await storeHomeworkFile(new File(['My completed assignment'],'answer.txt',{type:'text/plain'}));
 expect(state.files.has(`homework/${file.id}.bin`)).toBe(true);expect((await readHomeworkFile(file.id)).toString()).toBe('My completed assignment');await removeHomeworkFile(file.id);expect(state.files.size).toBe(0);
});
it('persists admin library files and removes an orphaned binary when metadata cannot be saved',async()=>{
 enableCloud();const file=await saveLibraryFile('beginners',new File(['%PDF-1.7 fixture'],'lesson.pdf',{type:'application/pdf'}));
 expect(await libraryFiles('beginners')).toEqual([file]);expect((await storedLibraryFile('beginners',file.id)).bytes.toString()).toBe('%PDF-1.7 fixture');
 state.files.clear();state.settings.failJSON=true;await expect(saveLibraryFile('beginners',new File(['%PDF-1.7 fixture'],'lesson.pdf'))).rejects.toThrow('quota');expect(state.files.size).toBe(0);
});
it('persists exam uploads by student and exam without leaking another account files',async()=>{
 enableCloud();const student=randomUUID(),other=randomUUID(),bytes=Buffer.from('grammar.a.1: My answer');
 const saved=await storeAnswerFile(student,'module-1',new Date().toISOString(),'answers.txt','txt',bytes,false);
 expect((await uploadedAnswer(student,'module-1',saved.id)).bytes).toEqual(bytes);expect(await listAnswerUploads(student,'module-1')).toEqual([saved]);expect(await listAnswerUploads(other,'module-1')).toEqual([]);await expect(uploadedAnswer(other,'module-1',saved.id)).rejects.toThrow();
});
