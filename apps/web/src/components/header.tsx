import Link from "next/link";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { currentUser, database } from "@/lib/supabase";
import { workspaceHome } from "@/lib/workspaces";
import {ProfileReminder} from "./profile-reminder";
import {WorkspaceLinks} from './workspace-links';

export async function Header() {
  const user = await currentUser();
  let roles: string[] = [];
  if (user) {
    const db = await database();
    const [{ data: isAdmin }, { data: isTeacher }, { data: isGuardian }] = await Promise.all([db.rpc("is_admin"), db.rpc("has_role", { wanted: "teacher" }), db.rpc("has_role", { wanted: "guardian" })]);
    roles = [isAdmin ? "admin" : null, isTeacher ? "teacher" : null, isGuardian ? "guardian" : null].filter((role): role is string => Boolean(role));
  }
  const home = workspaceHome(roles);
  const isStaff = home !== "/dashboard";
  return <><header className="header">
    <Link href="/" className="wordmark" aria-label="Spolk home">spolk<span>{"\u2733"}</span></Link>
    {user ? (isStaff
      ? <nav aria-label="Staff navigation"><Link href={home}>{roles.includes("teacher") && !roles.includes("admin") && !roles.includes("super_admin") ? "Teaching workspace" : "Academy admin"}</Link></nav>
      : <nav aria-label="Learner navigation"><Link href="/dashboard">My learning</Link><Link href="/courses">Explore courses</Link><Link href="/apply">Apply for a course</Link></nav>)
      : <nav aria-label="Main navigation"><Link href="/courses">Our programs</Link><Link href="/#approach">The Spolk way</Link><Link href="/#questions">Good to know</Link></nav>}
    <div className="header-actions">{user&&<WorkspaceLinks/>}{roles.includes('admin')&&<Link href="/admin/email-outbox" className="login-link">Email outbox</Link>}<span className="language"><Globe2 size={16}/> EN</span>
      {user ? <Link href={home} className="login-link">{isStaff ? "My workspace" : "My learning"}</Link> : <Link href="/login" className="login-link">Log in</Link>}
      {!user && <Link href="/apply" className="button small">Find your course <ArrowUpRight size={16}/></Link>}
    </div>
  </header>{user&&<ProfileReminder accountId={user.id}/>}</>;
}
export function Footer() { return <footer className="footer"><div><Link href="/" className="wordmark">spolk<span>{"\u2733"}</span></Link><p>A little practice. A world of possibility.</p></div><div><Link href="/courses">Explore programs</Link><Link href="/about">About the academy</Link><Link href="/privacy">Privacy & safety</Link><Link href="/contact">Get in touch</Link></div><p className="fine">{"\u00a9"} {new Date().getFullYear()} Spolk. Grow at your own pace.</p></footer>; }
