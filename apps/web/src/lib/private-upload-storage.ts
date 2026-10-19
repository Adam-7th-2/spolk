import type {SupabaseClient} from '@supabase/supabase-js';
type Bucket=ReturnType<SupabaseClient['storage']['from']>;
function validKey(key:string){
 const parts=key.split('/');
 if(!['homework','answers','library'].includes(parts[0])||parts.length<2||parts.some(part=>!part||part==='.'||part==='..'||!/^[a-zA-Z0-9._-]+$/.test(part)))throw new Error('Invalid private storage path.');
 return key;
}
// The caller must authorize the student/submission or administrator before using this store.
export function createPrivateUploadStore(bucket:Bucket){
 return {
  async put(key:string,bytes:Uint8Array,type='application/octet-stream'){
   const{error}=await bucket.upload(validKey(key),Buffer.from(bytes),{contentType:type,upsert:false,cacheControl:'0'});
   if(error)throw new Error('Private upload could not be saved. Check storage access and available quota.');
  },
  async read(key:string){const{data,error}=await bucket.download(validKey(key));if(error||!data)throw new Error('Private file is unavailable.');return Buffer.from(await data.arrayBuffer());},
  async remove(key:string){const{error}=await bucket.remove([validKey(key)]);if(error)throw new Error('Private file cleanup failed.');},
  async names(prefix:string){
   validKey(prefix);const names:string[]=[];
   for(let offset=0;;offset+=1000){
    const{data,error}=await bucket.list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
    if(error)throw new Error('Private files could not be listed.');
    names.push(...(data||[]).filter(item=>item.id&&/^[a-zA-Z0-9._-]+$/.test(item.name)).map(item=>item.name));
    if(!data||data.length<1000)break;
   }
   return names;
  },
 };
}
