import "server-only";
import {redirect} from "next/navigation";
import {currentUser,database} from "./supabase";
export async function requireUser(){const user=await currentUser();if(!user)redirect("/login");return user;}
export async function requireRole(roles:string[]){const user=await requireUser();const db=await database();const needsAdmin=roles.includes("admin")||roles.includes("super_admin");const [{data:isAdmin},...otherChecks]=await Promise.all([needsAdmin?db.rpc("is_admin"):Promise.resolve({data:false}),...roles.filter(role=>role!=="admin"&&role!=="super_admin").map(role=>db.rpc("has_role",{wanted:role}))]);if(!(Boolean(isAdmin)||otherChecks.some(result=>Boolean(result.data))))redirect("/dashboard");return {user,db};}
