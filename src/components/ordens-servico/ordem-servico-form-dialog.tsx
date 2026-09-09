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
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const titulo = modo === "orcamento" ? "Criar orçamento" : "Nova ordem de serviço";
  const statusInicial = modo === "orcamento" ? "orcado" : "rascunho";
  const statusInicialLabel = modo === "orcamento" ? "Orçado" : "Rascunho";

  function handleSubmit(formData: FormData) {
    // Validação explícita: dentro do dialog, o balão de validação nativo do
    // navegador não aparece, e o envio era bloqueado sem nenhum aviso na tela.
    const descricao = String(formData.get("descricao") ?? "").trim();
    if (!clienteId) {
      setError("Selecione um cliente.");
      toast.error("Selecione um cliente.");
      return;
    }
    if (!descricao) {
      setError("Descreva o serviço para continuar.");
      toast.error("Descreva o serviço para continuar.");
      return;
    }

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
      setClienteId(null);
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
        <form ref={formRef} action={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>
              Preencha os dados iniciais. Mão de obra e materiais são detalhados na tela da OS.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="status" value={statusInicial} />
          <input type="hidden" name="clienteId" value={clienteId ?? ""} />

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cliente-select">Cliente</Label>
              {/* Lista nativa do navegador de propósito: a versão estilizada não
                  funcionava no navegador do usuário e travava todo o cadastro. */}
              <select
                id="cliente-select"
                value={clienteId ?? ""}
                onChange={(e) => setClienteId(e.target.value || null)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
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
