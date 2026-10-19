import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareHostedAssets} from './hosted-assets.mjs';

if(process.env.NODE_ENV!=='production'||process.env.SPOLK_DATA_MODE==='local')throw new Error('Hosted startup requires production mode and hosted accounts.');
process.env.NEXT_PUBLIC_SITE_URL||=process.env.RENDER_EXTERNAL_URL;
if(process.env.RENDER==='true'&&process.env.PRIVATE_UPLOAD_STORAGE!=='supabase')throw new Error('Free Render hosting requires durable private cloud uploads.');
if(process.env.PRIVATE_UPLOAD_STORAGE==='supabase'&&!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Configure SUPABASE_SERVICE_ROLE_KEY in the host settings; do not commit it.');
for(const key of ['NEXT_PUBLIC_SITE_URL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']){
 if(!process.env[key])throw new Error(`Configure ${key} in the host environment.`);
}
const port=process.env.PORT||'3000';if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw new Error('PORT must be between 1 and 65535.');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
await prepareHostedAssets('/opt/spolk-course-assets','/data/private');
console.log('Private course storage ready. Starting the hosted academy.');
const child=spawn(process.execPath,[resolve(root,'node_modules/next/dist/bin/next'),'start','--hostname','0.0.0.0','--port',port],{cwd:resolve(root,'apps/web'),stdio:'inherit',env:process.env});
child.on('error',()=>{console.error('The hosted server could not start.');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
process.on('SIGTERM',()=>child.kill('SIGTERM'));
process.on('SIGINT',()=>child.kill('SIGINT'));
