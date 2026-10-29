import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { loadActor } from "@/lib/actor";
import { ChatbotAccess } from "./chatbot-access";
import { ProfileReminder } from "./profile-reminder";
import { MobileNavigation } from "./mobile-navigation";
import { WorkspaceLinks } from "./workspace-links";

const learnerLinks = [
 { href: "/dashboard", label: "Learn" },
 { href: "/dashboard/grades", label: "Grades" },
 { href: "/workspace/messages", label: "Messages" },
 { href: "/dashboard/schedule", label: "Schedule" },
 { href: "/workspace/profile", label: "Profile" },
];

export async function AppShell({ children, chat = true }: { children: React.ReactNode; chat?: boolean }) {
 const actor = await loadActor();
 const staff = actor?.roles.some(role => role === "admin" || role === "teacher" || role === "guardian");
 const people = actor?.roles.includes("admin") ? "/admin" : actor?.roles.includes("guardian") ? "/guardian" : "/teacher";
 const staffLinks = [{ href: "/teacher#grading", label: "Grade" }, { href: "/teacher/calendar", label: "Calendar" }, { href: people, label: "People" }];
 const links = staff ? [...learnerLinks, ...staffLinks] : learnerLinks;
 return <>
  <header className="header">
   <Link href="/" className="wordmark" aria-label="Spolk home">spolk<span>{"\u2733"}</span></Link>
   <nav aria-label="Learning navigation">
    {links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
   </nav>
   <MobileNavigation links={links} />
   <div className="header-actions">
    {actor && <WorkspaceLinks firstName={actor.firstName} />}
    <form action={signOut}><button className="button small secondary">Log out</button></form>
   </div>
  </header>
  {actor && <ProfileReminder accountId={actor.id} />}
  {children}
  {chat && <ChatbotAccess />}
 </>;
}
