import { ClipboardList, FileText, LayoutDashboard, UserCog, Users, Wallet } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/notas-fiscais", label: "Notas Fiscais", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/usuarios", label: "Usuários", icon: UserCog, adminOnly: true },
];
