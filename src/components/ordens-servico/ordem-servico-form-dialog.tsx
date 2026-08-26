"use client";

import { useRef, useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";
import type { Cliente } from "@/lib/types";
import { criarOrdemServico } from "@/app/(app)/ordens-servico/actions";

interface OrdemServicoFormDialogProps {
  clientes: Cliente[];
  modo?: "os" | "orcamento";
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children?: React.ReactNode;
}

export function OrdemServicoFormDialog({
  clientes,
  modo = "os",
  variant = "default",
  className,
  children,
}: OrdemServicoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState<string>("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const titulo = modo === "orcamento" ? "Criar orçamento" : "Nova ordem de serviço";
  const statusInicial = modo === "orcamento" ? "orcado" : "rascunho";
  const statusInicialLabel = modo === "orcamento" ? "Orçado" : "Rascunho";

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await criarOrdemServico(undefined, formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(titulo, { description: `Status inicial: ${statusInicialLabel}.` });
      setError(undefined);
      setOpen(false);
      formRef.current?.reset();
      setClienteId("");
    });
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
        <form ref={formRef} action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>
              Preencha os dados iniciais. Mão de obra e materiais são detalhados na tela da OS.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="status" value={statusInicial} />
          <input type="hidden" name="clienteId" value={clienteId} />

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={(v) => setClienteId(v ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição do serviço</Label>
              <Textarea id="descricao" name="descricao" rows={4} placeholder="Ex: Usinagem de eixo, recuperação de rotor..." required />
            </div>
          </div>

          {error && <p className="px-1 pb-2 text-sm text-status-danger-foreground">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !clienteId}>
              {pending ? "Salvando..." : `Criar (${statusInicialLabel})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
