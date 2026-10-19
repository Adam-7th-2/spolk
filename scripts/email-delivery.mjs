// Provider API: https://resend.com/docs/api-reference/emails/send-email
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function notificationContent(mail,settings){
 const site=new URL(settings.siteUrl);
 if(site.protocol!=='https:')throw new Error('Email links need an HTTPS site URL.');
 if(!mail.href.startsWith('/')||mail.href.startsWith('//'))throw new Error('Invalid notification link.');
 const link=new URL(mail.href,site.origin);
 if(link.origin!==site.origin)throw new Error('Invalid notification link.');
 let logo='';
 if(settings.logoUrl){const url=new URL(settings.logoUrl);if(url.protocol!=='https:')throw new Error('Email logo needs HTTPS.');logo=`<img src="${escapeHTML(url.href)}" alt="Spolk" width="144" style="display:block;max-width:144px;height:auto;margin-bottom:16px"/>`;}
 return {
 text:`Spolk\n\n${mail.body}\n\nOpen your workspace: ${link.href}\n\nEmail preferences: ${site.origin}/workspace/profile`,
 html:`<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;background:#f5f4ee;font-family:Arial,sans-serif;color:#18382d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="560" style="width:100%;max-width:560px;background:#fff;border-radius:16px" cellspacing="0" cellpadding="0"><tr><td style="padding:32px">${logo}<a href="${escapeHTML(site.origin)}" style="font-size:30px;font-weight:bold;color:#18382d;text-decoration:none">Spolk</a><p style="color:#526357">Find your voice in English</p><h1 style="font-size:24px">${escapeHTML(mail.subject)}</h1><p style="line-height:1.7;white-space:pre-line">${escapeHTML(mail.body)}</p><p style="margin:28px 0"><a href="${escapeHTML(link.href)}" style="display:inline-block;background:#18382d;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none">Open your workspace</a></p><hr style="border:0;border-top:1px solid #e4e8df"/><p style="font-size:12px;color:#526357">You received this update because email notifications are enabled in your Spolk profile. <a href="${escapeHTML(site.origin)}/workspace/profile">Manage email preferences</a></p></td></tr></table></td></tr></table></body></html>`
 };
}
export async function deliverNotification(mail,settings,request=fetch){
 const content=notificationContent(mail,settings);
 const response=await request('https://api.resend.com/emails',{
  method:'POST',headers:{Authorization:`Bearer ${settings.apiKey}`,'Content-Type':'application/json','Idempotency-Key':`spolk-notification-${mail.id}`},
  body:JSON.stringify({from:settings.from,to:[mail.recipient],subject:mail.subject,...content}),
  signal:AbortSignal.timeout(10000),
 });
 if(!response.ok)throw new Error(`Email provider returned HTTP ${response.status}`);
 const result=await response.json();if(!result.id)throw new Error('Email provider did not confirm acceptance.');
 return result.id;
}
