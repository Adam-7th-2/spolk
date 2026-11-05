export const dynamic = "force-dynamic";
import { AppShell } from "@/components/app-shell";

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
 return <AppShell>{children}</AppShell>;
}
