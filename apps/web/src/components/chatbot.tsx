"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {MessageCircle,X,Send} from 'lucide-react';
type Course={id:string;title:string};
type Message={role:'user'|'assistant';content:string;links?:{title:string;url:string}[];mode?:string};
export function Chatbot({courses}:{courses:Course[]}){
 const [open,setOpen]=useState(false),[question,setQuestion]=useState(''),[scope,setScope]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [messages,setMessages]=useState<Message[]>([{role:'assistant',content:'Hi! Ask me any question, or choose a course to include your learning material.',mode:'Spolk assistant'}]);
 const input=useRef<HTMLTextAreaElement>(null),log=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),version=useRef(0);
 useEffect(()=>{if(open)input.current?.focus();},[open]);
 useEffect(()=>{log.current?.scrollTo({top:log.current.scrollHeight});},[messages,busy,error]);
 async function send(e:React.FormEvent){
  e.preventDefault();const text=question.trim();if(!text||busy)return;const current=version.current;
  setBusy(true);setError('');setQuestion('');setMessages(m=>[...m,{role:'user' as const,content:text}].slice(-30));
  try{const response=await fetch('/api/chatbot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId:scope||undefined,question:text,history:messages.filter(m=>m.role==='user'||m.mode==='Gemini assistant').slice(-10).map(({role,content})=>({role,content:content.slice(0,3000)}))}),signal:AbortSignal.timeout(45000)});
   const data=await response.json();if(current!==version.current)return;if(!response.ok)throw new Error(data.error||'Chat is unavailable.');
   const content=[data.answer,...(data.excerpts||[]).map((item:{content:string;title:string})=>`${item.title}: ${item.content}`)].join('\n\n');
   setMessages(m=>[...m,{role:'assistant',content,mode:data.mode,links:data.links||data.sources?.map((s:{title:string;url:string})=>({title:s.title,url:s.url}))}].slice(-30) as Message[]);
  }catch(err){if(current===version.current){setError(err instanceof Error?err.message:'Chat could not connect.');setQuestion(text);}}
  finally{if(current===version.current)setBusy(false);}
 }
 function close(){setOpen(false);trigger.current?.focus();}
 return <div className="chatbot-widget">{open&&<section className="chatbot-panel" aria-label="Spolk chat assistant" onKeyDown={e=>{if(e.key==='Escape')close();}}><header><div><strong>Spolk assistant</strong><small>English · website help · your courses</small></div><button type="button" aria-label="Close chat" onClick={close}><X size={20}/></button></header><label className="chatbot-scope">Chat about<select value={scope} disabled={busy} onChange={e=>{version.current++;setScope(e.target.value);setMessages([{role:'assistant',content:e.target.value?'Ask any question. I can also use the available material from this course.':'Ask about any topic, English, or how to use Spolk.'}]);setError('');setQuestion('');}}><option value="">General questions & website help</option><optgroup label="My courses">{courses.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</optgroup></select></label><div ref={log} className="chatbot-log" role="log" aria-live="polite" aria-relevant="additions">{messages.map((m,i)=><article key={i} className={`chatbot-message ${m.role}`}><strong>{m.role==='user'?'You':m.mode||'Spolk'}</strong><p>{m.content}</p>{m.links?.filter(l=>l.url?.startsWith('/')&&!l.url.startsWith('//')&&!l.url.includes('\\')).map((l,j)=><Link key={j} href={l.url} onClick={close}>{l.title}</Link>)}</article>)}{busy&&<p role="status">Finding your answer…</p>}{error&&<p role="alert" className="status error">{error}</p>}</div><form onSubmit={send}><label htmlFor="chatbot-question">Your message</label><textarea ref={input} id="chatbot-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1000} minLength={scope?3:1} required rows={2} placeholder="Ask a question…"/><button className="button small" disabled={busy||!question.trim()}><Send size={15}/>{busy?'Replying…':'Send'}</button></form><p className="chatbot-disclaimer">Automated assistant. Check course sources with your teacher. Never share passwords.</p></section>}<button ref={trigger} className="chatbot-toggle" onClick={()=>open?close():setOpen(true)} aria-expanded={open} aria-label={open?'Close Spolk assistant':'Open Spolk assistant'}><MessageCircle size={22}/><span>{open?'Close chat':'Ask Spolk'}</span></button></div>;
}
