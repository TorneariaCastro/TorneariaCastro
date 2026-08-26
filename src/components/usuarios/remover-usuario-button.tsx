"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { removerUsuario } from "@/app/(app)/usuarios/actions";

export function RemoverUsuarioButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await removerUsuario(userId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuário removido", { description: `${email} não tem mais acesso ao sistema.` });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-status-danger hover:text-status-danger-foreground">
        <Trash2 className="size-4" />
        <span className="sr-only">Remover usuário</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remover acesso?</DialogTitle>
          <DialogDescription>
            <strong>{email}</strong> não vai mais conseguir entrar no sistema. Essa ação não tem volta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
