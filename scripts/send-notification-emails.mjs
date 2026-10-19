import {createClient} from '@supabase/supabase-js';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {deliverNotification} from './email-delivery.mjs';
import {deliverGmailNotification} from './gmail-delivery.mjs';
const envPath=resolve('apps/web/.env.local');if(existsSync(envPath))process.loadEnvFile(envPath);
process.env.NEXT_PUBLIC_SITE_URL||=process.env.RENDER_EXTERNAL_URL;
if(process.env.SPOLK_DATA_MODE==='local'||process.env.EMAIL_DELIVERY_ENABLED!=='1'||!process.argv.includes('--send')){
 console.log('Email delivery is disabled. Use the local admin email outbox for previews. Hosted delivery requires EMAIL_DELIVERY_ENABLED=1 and --send.');process.exit(0);
}
const gmail=process.env.NOTIFICATION_EMAIL_PROVIDER==='gmail';
const required=['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','NOTIFICATION_FROM_EMAIL','NEXT_PUBLIC_SITE_URL',...(gmail?['GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN']:['RESEND_API_KEY'])];
if(required.some(key=>!process.env[key]))throw new Error('Missing hosted email configuration. See docs/STUDENT_WORKSPACE.md.');
const settings={apiKey:process.env.RESEND_API_KEY,from:process.env.NOTIFICATION_FROM_EMAIL,siteUrl:process.env.NEXT_PUBLIC_SITE_URL,logoUrl:process.env.NOTIFICATION_LOGO_URL,clientId:process.env.GMAIL_CLIENT_ID,clientSecret:process.env.GMAIL_CLIENT_SECRET,refreshToken:process.env.GMAIL_REFRESH_TOKEN};
if(new URL(settings.siteUrl).protocol!=='https:')throw new Error('Use the public HTTPS site URL for notification links.');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const{data:messages,error}=await db.rpc('claim_notification_emails');if(error)throw new Error('Unable to claim queued mail. Check the workspace migration and service-role access.');
let accepted=0,failed=0;
for(const mail of messages||[]){
 let succeeded=false,problem=null;
 try{await (gmail?deliverGmailNotification:deliverNotification)(mail,settings);succeeded=true;accepted++;}catch(error){problem=error instanceof Error?error.message:'Email request failed';failed++;}
 const{error:updateError}=await db.rpc('finish_notification_email',{eid:mail.id,succeeded,problem});
 if(updateError)throw new Error('Unable to record mail delivery. The lease and provider idempotency key protect retries.');
}
console.log(`Email worker finished: ${accepted} accepted, ${failed} failed. No messages or credentials are logged.`);
