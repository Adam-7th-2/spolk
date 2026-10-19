import Link from 'next/link';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
import {loadGradebook} from '@/lib/gradebook';
import {Grades} from '@/components/grades';
import {WorkspaceRefresh} from '@/components/workspace-refresh';
export const dynamic='force-dynamic';
export default async function Gradebook(){
 const user=await requireUser(),db=await database(),result=await loadGradebook(db,user.id);
 return <section className="section page-section workspace-page"><WorkspaceRefresh/><Link href="/dashboard" className="text-link">Back to my dashboard</Link><div className="eyebrow">YOUR LEARNING RECORD</div><h1>My grades & feedback</h1><p className="lead">Your submitted work, teacher feedback, and quiz results in one place.</p>{result.error&&<p className="status error" role="alert">Some grade records could not be loaded. Refresh before relying on these totals.</p>}<Grades rows={result.rows}/></section>;
}
