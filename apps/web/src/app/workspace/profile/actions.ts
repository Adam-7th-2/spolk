"use server";
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
import {profileSchema} from '@/lib/profile';
export async function updateProfile(_:unknown,form:FormData){
 const user=await requireUser();const parsed=profileSchema.safeParse({...Object.fromEntries(form),email_notifications:form.get('email_notifications')==='on'});
 if(!parsed.success)return {error:true,message:'Complete all required fields. Use a valid time zone and a learning goal of at least 10 characters.'};
 const db=await database(),p=parsed.data;const{error}=await db.from('profiles').update({...p,display_name:`${p.first_name} ${p.last_name}`.slice(0,100)}).eq('id',user.id);
 revalidatePath('/workspace/profile');revalidatePath('/dashboard');revalidatePath('/teacher');revalidatePath('/admin');
 return {error:Boolean(error),message:error?'Your profile could not be saved. Please try again.':'Your profile is up to date.'};
}
