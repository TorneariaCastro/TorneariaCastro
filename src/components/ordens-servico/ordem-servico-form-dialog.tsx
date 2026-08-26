"use client";

import { useState } from "react";
import { FilePlus2, Wrench } from "lucide-react";
import { toast } from "sonner";
import type { VariantProps } from "class-variance-authority";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientesMock } from "@/lib/mock-data/clientes";
import { cn } from "@/lib/utils";

interface OrdemServicoFormDialogProps {
  modo?: "os" | "orcamento";
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children?: React.ReactNode;
}

export function OrdemServicoFormDialog({ modo = "os", variant = "default", className, children }: OrdemServicoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState<string>("");
  const [salvando, setSalvando] = useState(false);

  const titulo = modo === "orcamento" ? "Criar orçamento" : "Nova ordem de serviço";
  const statusInicial = modo === "orcamento" ? "Orçado" : "Rascunho";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 500));
    setSalvando(false);
    setOpen(false);
    const cliente = clientesMock.find((c) => c.id === clienteId);
    toast.success(titulo, {
      description: cliente ? `${cliente.nome} — status inicial: ${statusInicial}.` : `Status inicial: ${statusInicial}.`,
    });
    setClienteId("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant }), "gap-2", className)}>
        {children ?? (
          <>
            {modo === "orcamento" ? <FilePlus2 className="size-4" /> : <Wrench className="size-4" />}
            {titulo}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>
              Preencha os dados iniciais. Mão de obra e materiais são detalhados na tela da OS.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={(v) => setClienteId(v ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesMock.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição do serviço</Label>
              <Textarea id="descricao" rows={4} placeholder="Ex: Usinagem de eixo, recuperação de rotor..." required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando || !clienteId}>
              {salvando ? "Salvando..." : `Criar (${statusInicial})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
