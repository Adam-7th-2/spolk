"use server";
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
export async function markNotificationRead(_:unknown,form:FormData){
 const user=await requireUser(),db=await database();const id=z.uuid().safeParse(form.get('id'));if(!id.success)return {error:true,message:'Unknown notification.'};
 const{error}=await db.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id.data).eq('account_id',user.id);
 revalidatePath('/workspace/notifications');return {error:Boolean(error),message:error?'Could not mark as read.':'Marked as read.'};
}
