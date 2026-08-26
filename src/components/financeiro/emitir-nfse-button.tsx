"use client";

import { useState } from "react";
import { FileCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { nfseService } from "@/lib/services/nfse/mock-nfse-service";
import type { TransacaoFinanceira } from "@/lib/types";

export function EmitirNfseButton({ transacao }: { transacao: TransacaoFinanceira }) {
  const [emitindo, setEmitindo] = useState(false);
  const [numero, setNumero] = useState<string | null>(null);

  async function handleEmitir() {
    setEmitindo(true);
    try {
      const resultado = await nfseService.emitir({
        ordemServicoId: transacao.ordemServicoId ?? transacao.id,
        clienteDocumento: "",
        clienteNome: transacao.clienteNome ?? "Cliente",
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
