// Provider API: https://resend.com/docs/api-reference/emails/send-email
export async function deliverNotification(mail,settings,request=fetch){
 const site=new URL(settings.siteUrl);
 if(site.protocol!=='https:')throw new Error('Email links need an HTTPS site URL.');
 if(!mail.href.startsWith('/')||mail.href.startsWith('//'))throw new Error('Invalid notification link.');
 const link=new URL(mail.href,site.origin);
 const response=await request('https://api.resend.com/emails',{
  method:'POST',headers:{Authorization:`Bearer ${settings.apiKey}`,'Content-Type':'application/json','Idempotency-Key':`spolk-notification-${mail.id}`},
  body:JSON.stringify({from:settings.from,to:[mail.recipient],subject:mail.subject,text:`${mail.body}\n\nOpen your workspace: ${link.href}\n\nEmail preferences: ${site.origin}/workspace/profile`}),
  signal:AbortSignal.timeout(10000),
 });
 if(!response.ok)throw new Error(`Email provider returned HTTP ${response.status}`);
 const result=await response.json();if(!result.id)throw new Error('Email provider did not confirm acceptance.');
 return result.id;
}
