"use client";
import {useActionState} from 'react';
import Link from 'next/link';
import {MessageCircle} from 'lucide-react';
import {askTeacher} from '@/app/workspace/messages/actions';
export function AskTeacher({lessonId,section,title}:{lessonId:string;section:string;title:string}){
 const[state,action,pending]=useActionState(askTeacher,{error:false,message:'',href:''});
 return <details className="ask-teacher"><summary><MessageCircle size={20} aria-hidden="true"/>Ask your teacher about {title.toLowerCase()}<span>+</span></summary><p>Your teacher and academy admins can see this conversation. Include the page, exercise or audio track that you need help with.</p><form action={action}><input name="lesson_id" type="hidden" value={lessonId}/><input name="section" type="hidden" value={section}/><label>Question subject<input name="subject" required minLength={3} maxLength={180}/></label><label>Your question<textarea name="message" required maxLength={5000}/></label>{state.message&&<p className={`status ${state.error?'error':''}`} role="status">{state.message}</p>}{state.href?<Link className="button" href={state.href}>Open conversation</Link>:<button className="button" disabled={pending}>{pending?'Sending…':'Send question'}</button>}</form></details>;
}
