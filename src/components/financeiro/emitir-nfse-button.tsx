"use client";

import { useState } from "react";
import { FileCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { emitirNfse } from "@/app/(app)/notas-fiscais/actions";
import type { TransacaoFinanceira } from "@/lib/types";

export function EmitirNfseButton({
  transacao,
  numeroExistente,
}: {
  transacao: TransacaoFinanceira;
  numeroExistente?: string;
}) {
  const [emitindo, setEmitindo] = useState(false);
  const [numero, setNumero] = useState<string | null>(numeroExistente ?? null);

  async function handleEmitir() {
    if (!transacao.ordemServicoId) {
      toast.error("Essa transação não está ligada a uma ordem de serviço.");
      return;
    }

    setEmitindo(true);
    try {
      const resultado = await emitirNfse({
        ordemServicoId: transacao.ordemServicoId,
        clienteNome: transacao.clienteNome ?? "Cliente",
        clienteDocumento: "",
        valorServico: transacao.valor,
        discriminacaoServico: transacao.descricao,
        aliquotaIss: 0.05,
      });
      setNumero(resultado.numero);
      toast.success("NFSe emitida com sucesso", {
        description: `Nota nº ${resultado.numero} — ISS ${resultado.valorIss.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
      });
    } catch {
      toast.error("Falha ao emitir NFSe", { description: "Tente novamente em instantes." });
    } finally {
      setEmitindo(false);
    }
  }

  if (numero) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-success-foreground">
        <FileCheck2 className="size-3.5" />
        NFSe {numero}
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleEmitir} disabled={emitindo} className="gap-1.5">
      {emitindo ? <Loader2 className="size-3.5 animate-spin" /> : <FileCheck2 className="size-3.5" />}
      {emitindo ? "Emitindo..." : "Emitir NFSe"}
    </Button>
  );
}
