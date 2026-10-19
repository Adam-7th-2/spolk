import Link from 'next/link';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
import {ProfileForm} from '@/components/profile-form';
import {localMode} from '@/lib/local-mode';
export default async function Profile(){
 const user=await requireUser(),db=await database();const{data,error}=await db.from('profiles').select('first_name,last_name,country,city,timezone,english_level,learning_goal,explanation_language,interface_language,email_notifications').eq('id',user.id).maybeSingle();if(error||!data)throw new Error('Unable to load your profile.');
 return <section className="section page-section workspace-page"><Link className="text-link" href="/dashboard">← My workspace</Link><div className="eyebrow">YOUR LEARNING PROFILE</div><h1>{data.first_name?.trim()?`Hi, ${data.first_name.trim()}.`:"Your profile"}</h1><p>Complete your name, location, time zone, English level, learning goal, and language preferences. These help your teacher plan your learning.</p><p>Account email: <strong>{user.email}</strong></p>{localMode()&&<p className="status">Local mode: notification emails are saved in the admin email outbox for preview. No external emails are sent.</p>}<article className="form-card"><ProfileForm profile={data}/></article></section>;
}
