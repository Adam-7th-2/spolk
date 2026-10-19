"use server";
import {z} from "zod";
import {database,isConfigured} from "@/lib/supabase";
import {redirect} from "next/navigation";
import {signupErrorMessage,signinErrorMessage} from "@/lib/auth-errors";
import {localMode} from "@/lib/local-mode";
import {profileSchema} from "@/lib/profile";
export type AuthState={message:string;error:boolean};
export async function authenticate(_:AuthState,form:FormData):Promise<AuthState>{
 if(!isConfigured())return {message:"Account services are not configured yet. Your details have not been submitted.",error:true};
 const mode=form.get("mode");
 if(mode!=="login"&&mode!=="register")return {message:"Choose Log in or Create account.",error:true};
 const schema=z.object({email:z.string().trim().pipe(z.email()),password:z.string().min(mode==="register"?12:1).max(128)});
 const parsed=schema.safeParse({email:form.get("email"),password:form.get("password")});
 if(!parsed.success)return {message:mode==="register"?"Enter a valid email and a password of at least 12 characters.":"Enter your email and password.",error:true};
 const db=await database();
 if(mode==="register"){
  const profile=profileSchema.safeParse({...Object.fromEntries(form),email_notifications:form.get("email_notifications")==="on"});
  if(!profile.success)return {message:"Complete your name, location, time zone, and learning goal (at least 10 characters).",error:true};
  const {error}=await db.auth.signUp({...parsed.data,options:{data:profile.data,emailRedirectTo:`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/auth/callback`}});
  if(error) console.error("[auth.signup]",{code:error.code||"unknown",status:error.status});
  return {message:error?signupErrorMessage(error):localMode()?"Your local account is ready. Log in with your email and password. Apply for a course to request enrollment.":"Check your email for the verification link. Once verified, you can sign in.",error:Boolean(error)};
 }
 const{error}=await db.auth.signInWithPassword(parsed.data);
 if(error){console.error("[auth.signin]",{code:error.code||"unknown",status:error.status,name:error.name});return {message:signinErrorMessage(error),error:true};}
 redirect("/dashboard");
}
export async function requestReset(_:AuthState,form:FormData):Promise<AuthState>{
 if(localMode())return {message:"Offline mode cannot send email. Demo accounts use the password shown on the login page. You can also create a new local account.",error:true};
 if(!isConfigured())return {message:"Account services are not configured yet.",error:true};
 const email=z.string().trim().pipe(z.email()).safeParse(form.get("email"));if(!email.success)return {message:"Enter a valid email.",error:true};
 try{
  const db=await database();
  const {error}=await db.auth.resetPasswordForEmail(email.data,{redirectTo:`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/auth/callback?next=/update-password`});
  if(error){
   console.error("[auth.reset]",{code:error.code||"unknown",status:error.status});
   if(error.code==="over_email_send_rate_limit")return {message:"Spolk has reached its email sending limit. Wait a few minutes and try again.",error:true};
   if(error.code==="email_provider_disabled")return {message:"Password reset email is disabled in Supabase. Enable the Email provider, then try again.",error:true};
   return {message:"Spolk could not send the reset email. Check Supabase email settings and try again.",error:true};
  }
 }catch(error){console.error("[auth.reset.exception]",error);return {message:"Spolk could not reach the password email service. Try again shortly.",error:true};}
 // Keep the response identical whether or not an account exists.
 return {message:"If this email has a Spolk account, we sent a secure password reset link. Check your inbox and spam folder.",error:false};
}
export async function signOut(){if(isConfigured()){const db=await database();await db.auth.signOut();}redirect("/");}
