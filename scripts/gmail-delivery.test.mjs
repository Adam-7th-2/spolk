import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliverGmailNotification} from './gmail-delivery.mjs';
const config={from:'Spolk <koslog.team@gmail.com>',siteUrl:'https://spolk.onrender.com',clientId:'test',clientSecret:'test',refreshToken:'test'};
const mail={id:'test-id',recipient:'learner@example.invalid',subject:'Your Spolk update',body:'Teacher replied.',href:'/dashboard'};
test('builds branded MIME and sends through HTTPS with no SMTP connection',async()=>{
 const calls=[];
 const result=await deliverGmailNotification(mail,config,async(url,options)=>{calls.push({url,...options});return Response.json(calls.length===1?{access_token:'fake-access'}:{id:'accepted'});});
 assert.equal(result,'accepted');assert.equal(calls[0].url,'https://oauth2.googleapis.com/token');assert.equal(calls[1].url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
 const mime=Buffer.from(JSON.parse(calls[1].body).raw,'base64url').toString();
 assert.ok(mime.includes('koslog.team@gmail.com'));assert.ok(mime.includes('multipart/alternative'));assert.ok(mime.includes('spolk-notification-test-id'));assert.ok(!mime.includes('fake-access'));
});
test('does not send mail when authorization fails',async()=>{
 let count=0;
 await assert.rejects(deliverGmailNotification(mail,config,async()=>{count++;return new Response('',{status:401});}),/authorization failed/);
 assert.equal(count,1);
});
