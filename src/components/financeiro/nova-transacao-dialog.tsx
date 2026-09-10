"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { LABEL_CATEGORIA_DESPESA, type Cliente } from "@/lib/types";
import { criarTransacao } from "@/app/(app)/financeiro/actions";

const CAMPO_SELECT =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function NovaTransacaoDialog({ clientes }: { clientes: Cliente[] }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
  const [erro, setErro] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await criarTransacao(formData);
      if (r.error) {
        setErro(r.error);
        toast.error(r.error);
        return;
      }
      toast.success(tipo === "receita" ? "Entrada lançada." : "Saída lançada.");
      setErro(undefined);
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
        <Plus className="size-4" />
        Nova movimentação
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
            <DialogDescription>Lance uma entrada (a receber) ou uma saída (a pagar).</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}
                className={CAMPO_SELECT}
              >
                <option value="receita">Entrada — dinheiro a receber</option>
                <option value="despesa">Saída — dinheiro a pagar</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao-transacao">Descrição</Label>
              <Input
                id="descricao-transacao"
                name="descricao"
                placeholder={tipo === "receita" ? "Ex: Usinagem de eixo - OS-2026-0004" : "Ex: Compra de aço 1045"}
              />
            </div>

            {tipo === "receita" && (
              <div className="grid gap-2">
                <Label htmlFor="cliente-transacao">Cliente (opcional)</Label>
                <select id="cliente-transacao" name="clienteId" className={CAMPO_SELECT} defaultValue="">
                  <option value="">Sem cliente vinculado</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipo === "despesa" && (
              <div className="grid gap-2">
                <Label htmlFor="categoria-transacao">Categoria</Label>
                <select id="categoria-transacao" name="categoria" className={CAMPO_SELECT} defaultValue="outros">
                  {Object.entries(LABEL_CATEGORIA_DESPESA).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="valor-transacao">Valor (R$)</Label>
                <Input id="valor-transacao" name="valor" inputMode="decimal" placeholder="1.200,00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vencimento-transacao">Vencimento</Label>
                <Input id="vencimento-transacao" name="dataVencimento" type="date" />
              </div>
            </div>
          </div>

          {erro && <p className="px-1 pb-2 text-sm text-status-danger-foreground">{erro}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Lançar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
