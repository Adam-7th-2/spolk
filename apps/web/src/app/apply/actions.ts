"use server";
import {z} from "zod";
import {currentUser,database,isConfigured} from "@/lib/supabase";
import {isOpenCourse} from "@/lib/catalogue";
const schema=z.object({course:z.string().refine(isOpenCourse),goal:z.string().trim().min(10).max(2000),level:z.enum(["Not sure","A1","A2","B1","B2","C1","C2"]),language:z.enum(["en","ru","am"]),adult:z.literal("yes")});
export async function apply(_: {message:string;error:boolean},form:FormData){
 if(!isConfigured())return {message:"Applications are not open in this local environment. Nothing has been submitted.",error:true};
 const user=await currentUser();if(!user)return {message:"Please sign in before applying.",error:true};
 const data=schema.safeParse(Object.fromEntries(form));if(!data.success)return {message:"Complete all fields. Learners under 18 need a guardian-led application.",error:true};
 const db=await database();const{error}=await db.from("enrollment_applications").upsert({account_id:user.id,course_slug:data.data.course,goal:data.data.goal,level:data.data.level,explanation_language:data.data.language},{onConflict:"account_id,course_slug",ignoreDuplicates:true});
 return {message:error?"Your application could not be saved. Please try again.":"Your application is saved for academy review. You can see its status in your learning space.",error:Boolean(error)};
}
