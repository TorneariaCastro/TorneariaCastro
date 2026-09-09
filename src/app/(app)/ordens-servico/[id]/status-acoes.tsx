"use client";

import { useState, useTransition } from "react";
import { ArrowRightCircle, Ban, CheckCircle2, PlayCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { converterEmServico, avancarStatus } from "../actions";
import type { StatusOrdemServico } from "@/lib/types";

interface Props {
  ordemServicoId: string;
  status: StatusOrdemServico;
  aprovadoPeloCliente: boolean;
}

export function StatusAcoes({ ordemServicoId, status, aprovadoPeloCliente }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  function executar(acao: () => Promise<{ error?: string }>, sucesso: string) {
    startTransition(async () => {
      const r = await acao();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(sucesso);
      setConfirmandoCancelamento(false);
    });
  }

  const encerrada = status === "faturado" || status === "cancelado";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "rascunho" && (
          <Button
            className="gap-2"
            disabled={pending}
            onClick={() => executar(() => avancarStatus(ordemServicoId, "orcado"), "Ordem marcada como Orçado.")}
          >
            <ArrowRightCircle className="size-4" />
            Marcar como Orçado
          </Button>
        )}

        {status === "orcado" && aprovadoPeloCliente && (
          <Button
            className="gap-2"
            disabled={pending}
            onClick={() => executar(() => converterEmServico(ordemServicoId), "Convertido em serviço. Status: Em Execução.")}
          >
            <ArrowRightCircle className="size-4" />
            Converter em Serviço
          </Button>
        )}

        {status === "orcado" && !aprovadoPeloCliente && (
          <Button
            variant="outline"
            className="gap-2"
            disabled={pending}
            onClick={() => executar(() => avancarStatus(ordemServicoId, "em_execucao"), "Serviço iniciado. Status: Em Execução.")}
          >
            <PlayCircle className="size-4" />
            Iniciar serviço
          </Button>
        )}

        {status === "em_execucao" && (
          <Button
            className="gap-2"
            disabled={pending}
            onClick={() => executar(() => avancarStatus(ordemServicoId, "pronto"), "Serviço concluído. Status: Pronto.")}
          >
            <CheckCircle2 className="size-4" />
            Marcar como Pronto
          </Button>
        )}

        {status === "pronto" && (
          <Button
            className="gap-2"
            disabled={pending}
            onClick={() => executar(() => avancarStatus(ordemServicoId, "faturado"), "Ordem marcada como Faturada.")}
          >
            <Receipt className="size-4" />
            Marcar como Faturado
          </Button>
        )}

        {!encerrada &&
          (confirmandoCancelamento ? (
            <>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={pending}
                onClick={() => executar(() => avancarStatus(ordemServicoId, "cancelado"), "Ordem cancelada.")}
              >
                <Ban className="size-4" />
                Confirmar cancelamento
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => setConfirmandoCancelamento(false)}>
                Voltar
              </Button>
            </>
          ) : (
            <Button variant="ghost" className="gap-2" disabled={pending} onClick={() => setConfirmandoCancelamento(true)}>
              <Ban className="size-4" />
              Cancelar OS
            </Button>
          ))}

        {encerrada && (
          <p className="text-sm text-muted-foreground">
            {status === "faturado" ? "Ordem faturada — ciclo concluído." : "Ordem cancelada."}
          </p>
        )}
      </div>

      {status === "orcado" && !aprovadoPeloCliente && (
        <p className="text-sm text-muted-foreground">
          Use &quot;Iniciar serviço&quot; se o cliente aprovou por telefone ou pessoalmente, sem usar o link.
        </p>
      )}
    </div>
  );
}
