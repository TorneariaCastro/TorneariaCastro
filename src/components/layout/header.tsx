"use client";

import { Menu, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/lib/supabase/actions";

function iniciais(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function Header({
  onOpenMobileMenu,
  userEmail,
  isAdmin,
}: {
  onOpenMobileMenu: () => void;
  userEmail: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu} aria-label="Abrir menu">
        <Menu className="size-5" />
      </Button>

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente, OS ou número..."
          className="bg-secondary/50 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "gap-2 pr-2 pl-1.5")}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {iniciais(userEmail)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{userEmail}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{userEmail}</DropdownMenuLabel>
              <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                {isAdmin ? "Administrador" : "Consultor"}
              </p>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logout()}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
