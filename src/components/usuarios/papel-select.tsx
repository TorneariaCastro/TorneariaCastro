"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { alterarPapel } from "@/app/(app)/usuarios/actions";
import type { Role } from "@/lib/auth/session";

export function PapelSelect({ userId, papelAtual }: { userId: string; papelAtual: Role }) {
  const [pending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    const role = value as Role;
    startTransition(async () => {
      const result = await alterarPapel(userId, role);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Papel alterado para ${role === "administrador" ? "Administrador" : "Consultor"}`);
    });
  }

  return (
    <Select value={papelAtual} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="h-8 w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="consultor">Consultor</SelectItem>
        <SelectItem value="administrador">Administrador</SelectItem>
      </SelectContent>
    </Select>
  );
}
