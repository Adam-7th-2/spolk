import Link from 'next/link';
import {requireRole} from '@/lib/access';
import {localMode} from '@/lib/local-mode';
export default async function EmailOutbox(){
 const{db}=await requireRole(['admin','super_admin']);const{data,error}=await db.from('notification_emails').select('id,recipient,subject,body,href,created_at,sent_at,attempts,last_error').order('created_at',{ascending:false}).limit(100);if(error)throw new Error('Unable to load email outbox.');
 return <section className="section page-section workspace-page"><Link href="/admin" className="text-link">← Academy workspace</Link><div className="eyebrow">TRANSACTIONAL EMAIL</div><h1>Email outbox</h1><p>{localMode()?'Local preview only. Messages below have not been emailed.':'Queued messages are delivered by the configured email worker. Sent means accepted by the email provider.'}</p>{data?.length?data.map(mail=><article className="notification-row" key={mail.id}><small>{mail.sent_at?'Accepted by provider':mail.attempts>=5?'Delivery needs attention':'Queued'} · {mail.recipient}</small><h2>{mail.subject}</h2><p>{mail.body}</p><p>Attempts: {mail.attempts}</p>{mail.last_error&&<p className="status error">{mail.last_error}</p>}<Link className="text-link" href={mail.href}>Open related activity →</Link></article>):<p>No notification emails queued yet.</p>}</section>;
}
