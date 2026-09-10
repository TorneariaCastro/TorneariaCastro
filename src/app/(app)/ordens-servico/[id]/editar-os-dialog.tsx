"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Cliente, OrdemServico } from "@/lib/types";
import { editarOrdemServico } from "../actions";

export function EditarOsDialog({ os, clientes }: { os: OrdemServico; clientes: Cliente[] }) {
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await editarOrdemServico(os.id, formData);
      if (r.error) {
        setErro(r.error);
        toast.error(r.error);
        return;
      }
      toast.success("Ordem de serviço atualizada.");
      setErro(undefined);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
        <Pencil className="size-4" />
        Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Editar {os.numero}</DialogTitle>
            <DialogDescription>Corrija os dados da ordem de serviço.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editar-cliente">Cliente</Label>
              <select
                id="editar-cliente"
                name="clienteId"
                defaultValue={os.clienteId}
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editar-descricao">Descrição do serviço</Label>
              <Textarea id="editar-descricao" name="descricao" rows={3} defaultValue={os.descricaoServico} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editar-previsao">Previsão de entrega (opcional)</Label>
              <Input
                id="editar-previsao"
                name="previsaoEntrega"
                type="date"
                defaultValue={os.previsaoEntrega ? os.previsaoEntrega.slice(0, 10) : ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editar-observacoes">Observações (opcional)</Label>
              <Textarea id="editar-observacoes" name="observacoes" rows={2} defaultValue={os.observacoes ?? ""} />
            </div>
          </div>

          {erro && <p className="px-1 pb-2 text-sm text-status-danger-foreground">{erro}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
