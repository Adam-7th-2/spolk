import Link from 'next/link';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
export default async function Messages(){
 await requireUser();const db=await database();
 const{data:questions,error}=await db.from('lesson_questions').select('id,subject,section,created_at').order('created_at',{ascending:false}).limit(100);
 if(error)throw new Error('Unable to load conversations.');
 return <section className="section page-section workspace-page"><Link className="text-link" href="/dashboard">← My workspace</Link><div className="eyebrow">LEARNING TOGETHER</div><h1>Teacher conversations</h1><p>Ask from any lesson section. Students see their own conversations; teachers see their assigned courses, and admins oversee support.</p><div className="workspace-list">{questions?.length?questions.map(q=><Link className="workspace-list-row" key={q.id} href={`/workspace/messages/${q.id}`}><strong>{q.subject}</strong><span>{q.section} · {new Date(q.created_at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC →</span></Link>):<p>No questions yet. Open a lesson and choose “Ask your teacher”.</p>}</div></section>;
}
