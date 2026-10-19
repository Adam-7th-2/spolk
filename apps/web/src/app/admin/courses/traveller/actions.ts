"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {requireRole} from "@/lib/access";
import manifest from "@/content/traveller.json";
export async function installTraveller(_:unknown,form:FormData){
 const{db}=await requireRole(["admin","super_admin"]);
 const parsed=z.object({student_email:z.union([z.email(),z.literal("")]),start_date:z.iso.date()}).safeParse({student_email:form.get("student_email"),start_date:form.get("start_date")});
 if(!parsed.success)return {message:"Enter a valid student email (or leave it blank) and a start date.",error:true};
 const {error}=await db.rpc("install_traveller_course",{payload:manifest,student_email:parsed.data.student_email||null,start_date:parsed.data.start_date,weekly_release:form.get("weekly_release")==="on",sequential_lessons:true});
 if(error){const message=error.code==="PGRST202"?"Run supabase/TRAVELLER_SETUP.sql in the Supabase SQL Editor first.":error.message.includes("Student account not found")?"The student email does not have an account yet. Create it in Supabase Authentication first.":error.message.includes("separate student")?"Use a student account without teacher or admin roles.":"The course could not be installed. Check the database migration and account permissions.";return {message,error:true};}
 revalidatePath("/admin/courses/traveller");revalidatePath("/teacher");revalidatePath("/dashboard");
 return {message:"Traveller is installed. Your account is assigned as teacher, and the selected student is enrolled. Existing lessons, answers and grades were preserved.",error:false};
}
