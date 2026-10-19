import "server-only";
import {cookies} from "next/headers";
import type {AcademyDatabase} from "./supabase";
import {localStore} from "./local-store";
import {LocalQuery,localRpc} from "./local-query";
import {localMode} from "./local-mode";

export async function localClient(){
 if(!localMode())throw new Error("Offline accounts are disabled");
 const store=await localStore(),cookieStore=await cookies();
 const token=cookieStore.get("spolk-local-session")?.value;
 const account=await store.user(token);
 const user=account?{...account,aud:"authenticated",role:"authenticated",user_metadata:{},app_metadata:{},created_at:""}:null;
 const client={
  from:(table:string)=>new LocalQuery(store,user?.id||null,table),
  rpc:(name:string,args?:Record<string,unknown>)=>localRpc(store,user?.id||null,name,args),
  auth:{
   getUser:async()=>({data:{user},error:null}),
   getSession:async()=>({data:{session:user?{user}:null},error:null}),
   async signInWithPassword(input:{email:string;password:string}){
    const result=await store.login(input.email,input.password);
    if(!result)return {data:{user:null},error:{code:"invalid_credentials",status:400}};
    cookieStore.set("spolk-local-session",result.token,{httpOnly:true,sameSite:"lax",path:"/",maxAge:604800});
    return {data:{user:result.user},error:null};
   },
   async signUp(input:{email:string;password:string}){
    try{return {data:{user:await store.signup(input.email,input.password)},error:null};}
    catch{return {data:{user:null},error:{code:"user_already_exists",status:400}};}
   },
   async signOut(){if(token)await store.logout(token);cookieStore.delete("spolk-local-session");return {error:null};},
   async updateUser(input:{password?:string}){
    if(!user||!input.password||input.password.length<12||input.password.length>128)return {error:{code:"invalid_credentials",status:400}};
    await store.changePassword(user.id,input.password);cookieStore.delete("spolk-local-session");return {error:null};
   },
   resetPasswordForEmail:async()=>({error:{code:"local_email_unavailable",status:400}}),
  },
 };
 // The existing application uses the same untyped Supabase interface in hosted mode.
 return client as unknown as AcademyDatabase;
}
