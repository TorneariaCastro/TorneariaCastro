"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelarTransacao, marcarComoPago } from "@/app/(app)/financeiro/actions";
import type { StatusTransacao } from "@/lib/types";

const METODOS = [
  { valor: "pix", rotulo: "PIX" },
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "transferencia", rotulo: "Transferência" },
  { valor: "boleto", rotulo: "Boleto" },
  { valor: "cartao_credito", rotulo: "Cartão de crédito" },
  { valor: "cartao_debito", rotulo: "Cartão de débito" },
];

export function TransacaoAcoes({ transacaoId, status }: { transacaoId: string; status: StatusTransacao }) {
  const [pending, startTransition] = useTransition();
  const [escolhendoMetodo, setEscolhendoMetodo] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  if (status === "pago" || status === "cancelado") return null;

  function darBaixa(metodo: string) {
    startTransition(async () => {
      const r = await marcarComoPago(transacaoId, metodo);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Baixa registrada.");
      setEscolhendoMetodo(false);
    });
  }

  function cancelar() {
    startTransition(async () => {
      const r = await cancelarTransacao(transacaoId);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Movimentação cancelada.");
      setConfirmandoCancelamento(false);
    });
  }

  if (escolhendoMetodo) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {METODOS.map((m) => (
          <Button key={m.valor} variant="outline" size="xs" disabled={pending} onClick={() => darBaixa(m.valor)}>
            {m.rotulo}
          </Button>
        ))}
        <Button variant="ghost" size="xs" disabled={pending} onClick={() => setEscolhendoMetodo(false)}>
          Voltar
        </Button>
      </div>
    );
  }

  if (confirmandoCancelamento) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="destructive" size="xs" disabled={pending} onClick={cancelar}>
          Confirmar
        </Button>
        <Button variant="ghost" size="xs" disabled={pending} onClick={() => setConfirmandoCancelamento(false)}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="xs" className="gap-1.5" disabled={pending} onClick={() => setEscolhendoMetodo(true)}>
        <CheckCircle2 className="size-3.5" />
        Dar baixa
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        onClick={() => setConfirmandoCancelamento(true)}
        title="Cancelar movimentação"
      >
        <Ban className="size-3.5" />
      </Button>
    </div>
  );
}
