import {currentUser,database} from '@/lib/supabase';
import {Chatbot} from './chatbot';
export async function ChatbotAccess(){
 const user=await currentUser();if(!user)return null;
 const db=await database();
 const[enrollments,instructing,admin]=await Promise.all([db.from('course_enrollments').select('course_id').eq('account_id',user.id).eq('status','active'),db.from('course_instructors').select('course_id').eq('account_id',user.id),db.rpc('is_admin')]);
 const ids=[...new Set([...(enrollments.data||[]),...(instructing.data||[])].map(c=>c.course_id))];
 const{data}=admin.data?await db.from('courses').select('id,title').order('title'):ids.length?await db.from('courses').select('id,title').in('id',ids).order('title'):{data:[]};
 return <Chatbot courses={data||[]}/>;
}
