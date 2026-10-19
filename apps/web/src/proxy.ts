import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";
import {localMode} from "./lib/local-mode";
export async function proxy(request:NextRequest){let response=NextResponse.next({request});if(localMode())return response;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);if(!url||!key)return response;const db=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(items){items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});await db.auth.getUser();return response;}
export const config={matcher:["/dashboard/:path*","/teacher/:path*","/admin/:path*","/guardian/:path*","/learn/:path*","/classroom/:path*","/apply","/update-password"]};
