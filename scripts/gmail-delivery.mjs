import nodemailer from 'nodemailer';
import {notificationContent} from './email-delivery.mjs';

// HTTPS Gmail API works on Render Free, which blocks outbound SMTP ports.
export async function deliverGmailNotification(mail,settings,request=fetch){
 const content=notificationContent(mail,settings);
 const tokenResponse=await request('https://oauth2.googleapis.com/token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:settings.clientId,client_secret:settings.clientSecret,refresh_token:settings.refreshToken,grant_type:'refresh_token'}),
  signal:AbortSignal.timeout(10000),
 });
 if(!tokenResponse.ok)throw new Error('Gmail authorization failed. Reconnect the sender account.');
 const token=await tokenResponse.json();if(!token.access_token)throw new Error('Gmail authorization did not return access.');
 const composer=nodemailer.createTransport({streamTransport:true,buffer:true,newline:'unix'});
 const mime=await composer.sendMail({from:settings.from,to:mail.recipient,subject:mail.subject,...content,
  messageId:`<spolk-notification-${mail.id}@spolk.onrender.com>`,disableFileAccess:true,disableUrlAccess:true});
 const response=await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{
  method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},
  body:JSON.stringify({raw:mime.message.toString('base64url')}),signal:AbortSignal.timeout(10000),
 });
 if(!response.ok)throw new Error(`Gmail returned HTTP ${response.status}`);
 const accepted=await response.json();if(!accepted.id)throw new Error('Gmail did not confirm acceptance.');
 return accepted.id;
}
