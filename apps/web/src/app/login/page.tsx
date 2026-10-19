import { AuthForm } from "@/components/auth-form";
import {localMode} from "@/lib/local-mode";
export const metadata = { title: "Your learning space" };
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <section className="section page-section"><AuthForm offline={localMode()} initialMessage={query.error || ""} /></section>;
}
