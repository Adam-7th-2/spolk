import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {createPrivateUploadStore} from './private-upload-storage';
export function privateUploadStorage(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Configure the private upload storage in the host settings.');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)})}});
 return createPrivateUploadStore(client.storage.from(process.env.PRIVATE_UPLOAD_BUCKET||'spolk-private-uploads'));
}
