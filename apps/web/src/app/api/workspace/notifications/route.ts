import {NextResponse} from 'next/server';
import {currentUser,database} from '@/lib/supabase';
export async function GET(){
 const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in first'},{status:401});
 const db=await database();const{data,error}=await db.from('notifications').select('id').eq('account_id',user.id).is('read_at',null).limit(100);
 return NextResponse.json(error?{error:'Notifications unavailable'}:{unread:data?.length||0},{status:error?503:200,headers:{'Cache-Control':'private, no-store'}});
}
