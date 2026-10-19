import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {localMode} from "./local-mode";
export function isConfigured() { return localMode()||Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)); }
function createHostedClient(store:Awaited<ReturnType<typeof cookies>>){
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,{cookies:{getAll(){return store.getAll();},setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options));}catch{/* Server Components cannot set cookies; actions refresh sessions. */}}}});
}
export type AcademyDatabase=ReturnType<typeof createHostedClient>;
export async function database():Promise<AcademyDatabase>{
 if(localMode()){const {localClient}=await import("./local-client");return localClient();}
 if(!isConfigured())throw new Error("Account services are not configured in this environment.");
 return createHostedClient(await cookies());
}
export async function currentUser() { if(!isConfigured()) return null; const db=await database(); const {data:{user},error}=await db.auth.getUser(); if(user)return user; if(error){const {data:{session}}=await db.auth.getSession(); return session?.user??null;} return null; }
