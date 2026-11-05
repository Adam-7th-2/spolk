import "server-only";
import { cache } from "react";
import { currentUser, database } from "./supabase";

export type Actor = { id: string; email: string; firstName: string; roles: string[]; timezone: string };

export const loadActor = cache(async (): Promise<Actor | null> => {
 const user = await currentUser();
 if (!user) return null;
 const db = await database();
 const [{ data: isAdmin }, { data: isTeacher }, { data: isGuardian }, { data: profile }] = await Promise.all([
  db.rpc("is_admin"),
  db.rpc("has_role", { wanted: "teacher" }),
  db.rpc("has_role", { wanted: "guardian" }),
  db.from("profiles").select("first_name,timezone").eq("id", user.id).maybeSingle(),
 ]);
 const roles = [isAdmin ? "admin" : null, isTeacher ? "teacher" : null, isGuardian ? "guardian" : null].filter((role): role is string => Boolean(role));
 return {
  id: user.id,
  email: user.email || "",
  firstName: profile?.first_name?.trim() || String(user.user_metadata?.first_name || "").trim(),
  roles,
  timezone: profile?.timezone || "UTC",
 };
});
