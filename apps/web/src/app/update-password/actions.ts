"use server";
import {z} from "zod";
import {requireUser} from "@/lib/access";
import {database} from "@/lib/supabase";
export async function updatePassword(_:unknown,f:FormData){await requireUser();const p=z.string().min(12).max(128).safeParse(f.get("password"));if(!p.success)return {message:"Use at least 12 characters.",error:true};const db=await database();const{error}=await db.auth.updateUser({password:p.data});return {message:error?"Password could not be updated. Request a new recovery link.":"Your password is updated. You can return to your learning space.",error:Boolean(error)};}
