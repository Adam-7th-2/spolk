"use server";
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/access';
import {database} from '@/lib/supabase';
export async function askTeacher(_:unknown,form:FormData){
 await requireUser();const parsed=z.object({lesson_id:z.uuid(),section:z.enum(['watch','read','practice','homework','notes','complete','exam']),subject:z.string().trim().min(3).max(180),message:z.string().trim().min(1).max(5000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:true,message:'Enter a subject and your question.',href:''};
 const db=await database(),p=parsed.data;const{data,error}=await db.rpc('ask_lesson_question',{lid:p.lesson_id,section_id:p.section,topic:p.subject,message:p.message});
 revalidatePath('/workspace/messages');
 return {error:Boolean(error),message:error?'Your question could not be sent. Check lesson access and try again.':'Question sent to your teacher and academy admins.',href:error?'':`/workspace/messages/${data}`};
}
export async function replyToQuestion(_:unknown,form:FormData){
 await requireUser();const parsed=z.object({question_id:z.uuid(),message:z.string().trim().min(1).max(5000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:true,message:'Write a reply of up to 5,000 characters.'};
 const db=await database();const{error}=await db.rpc('reply_lesson_question',{qid:parsed.data.question_id,message:parsed.data.message});
 revalidatePath(`/workspace/messages/${parsed.data.question_id}`);revalidatePath('/workspace/messages');
 return {error:Boolean(error),message:error?'Reply could not be sent. Check your access and try again.':'Reply sent. The recipients have been notified.'};
}
