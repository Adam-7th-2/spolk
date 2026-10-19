import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliverNotification,notificationContent} from './email-delivery.mjs';
const mail={id:'test-id',recipient:'student@example.invalid',subject:'Spolk update',body:'Teacher replied.',href:'/workspace/messages/test'};
const config={apiKey:'fake-test-key',from:'Spolk <school@example.invalid>',siteUrl:'https://school.example.invalid'};
test('uses a stable idempotency key, plain text and trusted workspace links',async()=>{
 let sent;
 await deliverNotification(mail,config,async(url,options)=>{sent={url,...options};return new Response(JSON.stringify({id:'accepted'}));});
 assert.equal(sent.url,'https://api.resend.com/emails');assert.equal(sent.headers['Idempotency-Key'],'spolk-notification-test-id');
 const body=JSON.parse(sent.body);assert.deepEqual(body.to,[mail.recipient]);assert.ok(body.text.includes('https://school.example.invalid/workspace/messages/test'));assert.ok(body.html.includes('Spolk'));assert.ok(body.html.includes('Manage email preferences'));
});
test('rejects unsafe links, provider failures and missing acceptance',async()=>{
 await assert.rejects(deliverNotification({...mail,href:'//evil.example'},config),/Invalid/);
 await assert.rejects(deliverNotification(mail,{...config,siteUrl:'http://school.example.invalid'}),/HTTPS/);
 await assert.rejects(deliverNotification(mail,config,async()=>new Response('',{status:503})),/503/);
 await assert.rejects(deliverNotification(mail,config,async()=>new Response('{}')),/confirm/);
});
test('escapes message HTML and includes only the configured HTTPS logo',()=>{
 const result=notificationContent({...mail,body:'<script>alert("test")</script>',subject:'<b>Grade</b>'},{...config,logoUrl:'https://school.example.invalid/brand/logo.png'});
 assert.ok(result.html.includes('&lt;script&gt;'));assert.ok(!result.html.includes('<script>'));assert.ok(result.html.includes('src="https://school.example.invalid/brand/logo.png"'));
 assert.throws(()=>notificationContent(mail,{...config,logoUrl:'http://unsafe.example/logo.png'}),/HTTPS/);
 assert.throws(()=>notificationContent({...mail,href:'/\\evil.example'},config),/Invalid/);
});
