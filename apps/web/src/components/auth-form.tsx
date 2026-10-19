"use client";
import {useActionState,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createBrowserClient} from "@supabase/ssr";
import {authenticate,requestReset} from "@/app/auth/actions";
import {signinErrorMessage} from "@/lib/auth-errors";
import {SignupDetails} from "./signup-details";

export function AuthForm({reset=false,initialMessage="",offline=false}:{reset?:boolean;initialMessage?:string;offline?:boolean}){
 const[mode,setMode]=useState("login");
 const router=useRouter();
 const[loginMessage,setLoginMessage]=useState("");
 const[loginPending,setLoginPending]=useState(false);
 const[state,action,pending]=useActionState(reset?requestReset:authenticate,{message:initialMessage,error:Boolean(initialMessage)});
 async function browserLogin(form:HTMLFormElement){
  if(loginPending)return;
  setLoginMessage("");setLoginPending(true);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setLoginMessage("Account services are not configured yet.");setLoginPending(false);return;}
  const values=new FormData(form);
  try{
   const db=createBrowserClient(url,key,{global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)})}});
   const{error}=await db.auth.signInWithPassword({email:String(values.get("email")||"").trim(),password:String(values.get("password")||"")});
   if(error){setLoginMessage(signinErrorMessage(error));setLoginPending(false);return;}
   router.replace("/dashboard");router.refresh();
  }catch{
   setLoginMessage("The sign-in service could not be reached. Please check your connection and try again.");setLoginPending(false);
  }
 }
 return <div className="form-card">
  <div className="eyebrow">YOUR SPACE TO GROW</div>
  <h1>{reset?"Let’s get you back in.":mode==="login"?"Hello again.":"Your next chapter."}</h1>
  <p>{reset?"Request a secure password reset link.":"A little practice. A world of possibility."}</p>
  {offline&&<aside className="status"><strong>Offline learning workspace</strong><p>Student: student@spolk.local<br/>Teacher: teacher@spolk.local<br/>Admin: admin@spolk.local</p><p>Demo password: <code>SpolkLocal2026!</code></p><small>Accounts and course work are saved on this computer.</small></aside>}
  {!reset&&<div className="auth-tabs" role="tablist" aria-label="Account action">
   <button type="button" role="tab" disabled={pending||loginPending} aria-selected={mode==="login"} onClick={()=>{setMode("login");setLoginMessage("");}}>Log in</button>
   <button type="button" role="tab" disabled={pending||loginPending} aria-selected={mode==="register"} onClick={()=>{setMode("register");setLoginMessage("");}}>Create account</button>
  </div>}
  <form action={action} onSubmit={event=>{if(!reset&&mode==="login"&&!offline){event.preventDefault();void browserLogin(event.currentTarget);}}}>
   <input type="hidden" name="mode" value={mode}/>
   {!reset&&mode==="register"&&<SignupDetails/>}
   <label htmlFor="email">Email address</label>
   <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}/>
   {!reset&&<>
    <label htmlFor="password">{mode==="register"?"Password (at least 12 characters)":"Password"}</label>
    <input id="password" name="password" type="password" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={mode==="register"?12:1} maxLength={128}/>
   </>}
   {(loginMessage||state.message)&&<div role="status" className={`status ${loginMessage||state.error?"error":""}`}>{loginMessage||state.message}</div>}
   <button className="button" disabled={pending||loginPending}>{pending||loginPending?"One moment…":reset?"Send reset link":mode==="login"?"Log in →":"Create your account →"}</button>
  </form>
  <Link className="text-link" href={reset?"/login":"/reset-password"}>{reset?"Back to log in":"Forgot your password?"}</Link>
 </div>;
}
