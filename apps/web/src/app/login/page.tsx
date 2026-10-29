import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { localMode } from "@/lib/local-mode";
import { currentUser } from "@/lib/supabase";
import { loadActor } from "@/lib/actor";
import { workspaceHome } from "@/lib/workspaces";
export const metadata = { title: "Your learning space" };
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await currentUser();
  if (user && !query.error) {
    const actor = await loadActor();
    redirect(workspaceHome(actor?.roles || []));
  }
  return <section className="section page-section"><AuthForm offline={localMode()} initialMessage={query.error || ""} /></section>;
}
