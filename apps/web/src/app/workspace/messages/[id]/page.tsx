import {WorkspaceRefresh} from "@/components/workspace-refresh";
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {z} from 'zod';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
import {ActionForm} from '@/components/action-form';
import {replyToQuestion} from '../actions';
export default async function Conversation({params}:{params:Promise<{id:string}>}){
 const user=await requireUser(),{id}=await params;if(!z.uuid().safeParse(id).success)notFound();
 const db=await database();const{data:q}=await db.from('lesson_questions').select('id,subject,lesson_id,student_id,section').eq('id',id).maybeSingle();if(!q)notFound();
 const{data:messages,error}=await db.from('lesson_question_messages').select('id,author_id,body,created_at').eq('question_id',id).order('created_at');if(error)throw new Error('Unable to load conversation.');
 return <section className="section page-section workspace-page"><WorkspaceRefresh/><Link className="text-link" href="/workspace/messages">← Conversations</Link><div className="eyebrow">{q.section.toUpperCase()} · LESSON QUESTION</div><h1>{q.subject}</h1><p><Link className="text-link" href={`/learn/${q.lesson_id}`}>Open related lesson →</Link></p><div className="message-thread">{messages?.map(m=><article key={m.id} className={`message-bubble ${m.author_id===user.id?'own':''}`}><strong>{m.author_id===user.id?'You':m.author_id===q.student_id?'Student':'Teacher / academy team'}</strong><small>{new Date(m.created_at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</small><p>{m.body}</p></article>)}</div><article className="form-card"><h2>Reply</h2><ActionForm action={replyToQuestion} label="Send reply"><input name="question_id" type="hidden" value={q.id}/><label>Your reply<textarea name="message" required maxLength={5000}/></label></ActionForm></article></section>;
}
