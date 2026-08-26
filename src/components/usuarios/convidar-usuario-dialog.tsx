"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convidarUsuario } from "@/app/(app)/usuarios/actions";

export function ConvidarUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await convidarUsuario(undefined, formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Convite enviado", {
        description: "A pessoa vai receber um e-mail para definir a senha e entrar no sistema.",
      });
      setError(undefined);
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <UserPlus className="size-4" />
        Convidar usuário
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form ref={formRef} action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Convidar novo usuário</DialogTitle>
            <DialogDescription>
              A pessoa recebe um e-mail para definir a própria senha. Todo usuário convidado tem acesso total ao
              sistema (administrador).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="pessoa@exemplo.com" required />
          </div>

          {error && <p className="pb-2 text-sm text-status-danger-foreground">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
