export const dynamic = "force-dynamic";
import { AppShell } from "@/components/app-shell";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
 return <AppShell chat={false}>{children}</AppShell>;
}
