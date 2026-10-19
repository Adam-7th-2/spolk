import Link from 'next/link';
import {database} from '@/lib/supabase';
import {profileComplete} from '@/lib/profile';
export async function ProfileReminder({accountId}:{accountId:string}){
 const db=await database();const{data,error}=await db.from('profiles').select('*').eq('id',accountId).maybeSingle();
 if(error||profileComplete(data))return null;
 return <aside className="profile-reminder" role="note"><strong>Complete your learning profile</strong><p>Add your name, location, time zone, level and learning goal so your teacher can support you.</p><Link className="button small" href="/workspace/profile">Complete profile →</Link></aside>;
}
