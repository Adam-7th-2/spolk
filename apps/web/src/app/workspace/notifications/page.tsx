import {WorkspaceRefresh} from "@/components/workspace-refresh";
import Link from 'next/link';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
import {ActionForm} from '@/components/action-form';
import {markNotificationRead} from './actions';
export default async function Notifications(){
 const user=await requireUser(),db=await database();const{data,error}=await db.from('notifications').select('id,body,href,read_at,created_at').eq('account_id',user.id).order('created_at',{ascending:false}).limit(100);
 return <section className="section page-section workspace-page"><WorkspaceRefresh/><Link className="text-link" href="/dashboard">← My workspace</Link><div className="eyebrow">YOUR LEARNING UPDATES</div><h1>Notifications</h1><p>Teacher replies, grades, course announcements, and class schedule changes appear here.</p>{error&&<p role="alert">Notifications could not be loaded. Please refresh and try again.</p>}<div className="workspace-list">{error?null:data?.length?data.map(n=><article className={`notification-row ${n.read_at?'':'unread'}`} key={n.id}><small>{n.read_at?'Read':'New'} · {new Date(n.created_at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</small><p>{n.body}</p><Link className="text-link" href={n.href?.startsWith('/')&&!n.href.startsWith('//')?n.href:'/dashboard'}>Open update →</Link>{!n.read_at&&<ActionForm action={markNotificationRead} label="Mark as read"><input name="id" type="hidden" value={n.id}/></ActionForm>}</article>):<p>You’re all caught up.</p>}</div></section>;
}
