import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessao } from "@/lib/auth/session";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getSessao();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell isAdmin={isAdmin} userEmail={user.email ?? ""}>
      {children}
    </AppShell>
  );
}
