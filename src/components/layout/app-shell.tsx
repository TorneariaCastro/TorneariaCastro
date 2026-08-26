"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({
  children,
  isAdmin,
  userEmail,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  userEmail: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isAdmin={isAdmin}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 ease-in-out",
          collapsed ? "md:ml-[76px]" : "md:ml-64",
        )}
      >
        <Header onOpenMobileMenu={() => setMobileOpen(true)} userEmail={userEmail} isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
