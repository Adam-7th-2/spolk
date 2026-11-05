export const dynamic = "force-dynamic";
import { AppShell } from "@/components/app-shell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
 return <AppShell>{children}</AppShell>;
}
