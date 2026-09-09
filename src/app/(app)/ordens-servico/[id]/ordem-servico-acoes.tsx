"use client";

import { useState, useTransition } from "react";
import { ArrowRightCircle, Copy, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compartilharOrcamento, converterEmServico } from "../actions";

interface OrdemServicoAcoesProps {
  ordemServicoId: string;
  status: string;
  aprovado: boolean;
  clienteNome: string;
  clienteTelefone: string;
}

function montarLinkWhatsapp(telefone: string, clienteNome: string, link: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const mensagem = `Olá ${clienteNome}! Segue o orçamento da Tornearia Castro: ${link}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function OrdemServicoAcoes({
  ordemServicoId,
  status,
  aprovado,
  clienteNome,
  clienteTelefone,
}: OrdemServicoAcoesProps) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string>();

  function handleCompartilhar() {
    startTransition(async () => {
      const result = await compartilharOrcamento(ordemServicoId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setLink(result.link);
      toast.success("Link de orçamento gerado (válido por 30 dias).");
    });
  }

  function handleConverter() {
    startTransition(async () => {
      const result = await converterEmServico(ordemServicoId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ordem de serviço convertida para Em Execução.");
    });
  }

  async function copiarLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  }

  if (aprovado && status === "orcado") {
    return (
      <Button className="gap-2" disabled={pending} onClick={handleConverter}>
        <ArrowRightCircle className="size-4" />
        {pending ? "Convertendo..." : "Converter em Serviço"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" className="gap-2" disabled={pending} onClick={handleCompartilhar}>
        <Share2 className="size-4" />
        {pending ? "Gerando link..." : "Compartilhar orçamento"}
      </Button>
      {link && (
        <>
          <Button variant="ghost" size="icon" onClick={copiarLink} title="Copiar link">
            <Copy className="size-4" />
          </Button>
          <a
            href={montarLinkWhatsapp(clienteTelefone, clienteNome, link)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <MessageCircle className="size-4" />
            Enviar no WhatsApp
          </a>
        </>
      )}
    </div>
  );
}
