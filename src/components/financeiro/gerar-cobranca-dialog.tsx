"use client";

import { useState } from "react";
import { Barcode, Copy, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paymentGateway } from "@/lib/services/payment/mock-payment-gateway";
import type { BoletoResult, LinkPagamentoResult } from "@/lib/services/payment/types";
import type { TransacaoFinanceira } from "@/lib/types";
import { formatarMoeda } from "@/lib/format";

function copiar(texto: string, mensagem: string) {
  navigator.clipboard?.writeText(texto);
  toast.success(mensagem);
}

export function GerarCobrancaDialog({ transacao }: { transacao: TransacaoFinanceira }) {
  const [open, setOpen] = useState(false);
  const [gerandoBoleto, setGerandoBoleto] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);
  const [boleto, setBoleto] = useState<BoletoResult | null>(null);
  const [link, setLink] = useState<LinkPagamentoResult | null>(null);

  async function handleGerarBoleto() {
    setGerandoBoleto(true);
    try {
      const resultado = await paymentGateway.gerarBoleto({
        transacaoId: transacao.id,
        valor: transacao.valor,
        vencimento: transacao.dataVencimento,
        pagador: { nome: transacao.clienteNome ?? "Cliente", documento: "" },
        descricao: transacao.descricao,
      });
      setBoleto(resultado);
    } finally {
      setGerandoBoleto(false);
    }
  }

  async function handleGerarLink() {
    setGerandoLink(true);
    try {
      const resultado = await paymentGateway.gerarLinkPagamento({
        transacaoId: transacao.id,
        valor: transacao.valor,
        descricao: transacao.descricao,
        metodosAceitos: ["cartao_credito", "cartao_debito", "pix"],
      });
      setLink(resultado);
    } finally {
      setGerandoLink(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setBoleto(null);
          setLink(null);
        }
      }}
    >
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Gerar Cobrança
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar cobrança</DialogTitle>
          <DialogDescription>
            {transacao.descricao} — {formatarMoeda(transacao.valor)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="boleto">
          <TabsList className="w-full">
            <TabsTrigger value="boleto" className="flex-1 gap-1.5">
              <Barcode className="size-4" />
              Boleto
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 gap-1.5">
              <Link2 className="size-4" />
              Link de Pagamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boleto" className="space-y-3 pt-2">
            {!boleto ? (
              <Button onClick={handleGerarBoleto} disabled={gerandoBoleto} className="w-full gap-2">
                {gerandoBoleto && <Loader2 className="size-4 animate-spin" />}
                {gerandoBoleto ? "Gerando boleto..." : "Gerar boleto"}
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Linha digitável</p>
                  <div className="flex items-center gap-2">
                    <p className="truncate font-mono text-sm">{boleto.linhaDigitavel}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copiar(boleto.linhaDigitavel, "Linha digitável copiada")}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => window.open(boleto.urlPdf, "_blank")}>
                  Abrir PDF do boleto
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-3 pt-2">
            {!link ? (
              <Button onClick={handleGerarLink} disabled={gerandoLink} className="w-full gap-2">
                {gerandoLink && <Loader2 className="size-4 animate-spin" />}
                {gerandoLink ? "Gerando link..." : "Gerar link de pagamento"}
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Link (cartão de crédito, débito e Pix)</p>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm">{link.url}</p>
                    <Button variant="ghost" size="icon-sm" onClick={() => copiar(link.url, "Link copiado")}>
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
