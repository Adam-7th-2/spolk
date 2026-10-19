import {ActionForm} from "@/components/action-form";
import {askTeacher} from "./actions";
import {WorkspaceRefresh} from "@/components/workspace-refresh";
import Link from 'next/link';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
export default async function Messages(){
 await requireUser();const db=await database();
 const{data:questions,error}=await db.from('lesson_questions').select('id,subject,section,created_at').order('created_at',{ascending:false}).limit(100);
 const{data:lessons}=await db.from('lessons').select('id,title').order('title').limit(100);
 return <section className="section page-section workspace-page"><WorkspaceRefresh/><Link className="text-link" href="/dashboard">← My workspace</Link><div className="eyebrow">LEARNING TOGETHER</div><h1>Teacher conversations</h1><p>Ask from any lesson section. Students see their own conversations; teachers see their assigned courses, and admins oversee support.</p>{lessons?.length?<details className="dashboard-card"><summary>Ask your teacher a question</summary><ActionForm action={askTeacher} label="Send question"><label>Lesson<select name="lesson_id" required>{lessons.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label><input type="hidden" name="section" value="notes"/><label>Subject<input name="subject" required minLength={3} maxLength={180}/></label><label>Your question<textarea name="message" required maxLength={5000}/></label></ActionForm></details>:<p><Link href="/dashboard">Open your courses</Link> to find an available lesson and contact your teacher.</p>}{error&&<p role="alert">Conversations could not be loaded. Please refresh and try again.</p>}<div className="workspace-list">{error?null:questions?.length?questions.map(q=><Link className="workspace-list-row" key={q.id} href={`/workspace/messages/${q.id}`}><strong>{q.subject}</strong><span>{q.section} · {new Date(q.created_at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC →</span></Link>):<p>No questions yet. Open a lesson and choose “Ask your teacher”.</p>}</div></section>;
}
