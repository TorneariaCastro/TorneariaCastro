import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { GerarCobrancaDialog } from "@/components/financeiro/gerar-cobranca-dialog";
import { EmitirNfseButton } from "@/components/financeiro/emitir-nfse-button";
import { transacoesMock } from "@/lib/mock-data/transacoes";
import { LABEL_CATEGORIA_DESPESA } from "@/lib/types";
import { formatarData, formatarMoeda } from "@/lib/format";

export default function FinanceiroPage() {
  const receitas = transacoesMock.filter((t) => t.tipo === "receita");
  const despesas = transacoesMock.filter((t) => t.tipo === "despesa");

  const totalReceber = receitas
    .filter((t) => t.status !== "pago" && t.status !== "cancelado")
    .reduce((total, t) => total + t.valor, 0);
  const totalPagar = despesas
    .filter((t) => t.status !== "pago" && t.status !== "cancelado")
    .reduce((total, t) => total + t.valor, 0);
  const saldoProjetado = totalReceber - totalPagar;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Contas a receber, contas a pagar e fluxo de caixa</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">A Receber</p>
              <p className="text-xl font-semibold">{formatarMoeda(totalReceber)}</p>
            </div>
            <ArrowUpCircle className="size-8 text-status-success-foreground" strokeWidth={1.5} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">A Pagar</p>
              <p className="text-xl font-semibold">{formatarMoeda(totalPagar)}</p>
            </div>
            <ArrowDownCircle className="size-8 text-status-danger-foreground" strokeWidth={1.5} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo Projetado</p>
              <p
                className={cn(
                  "text-xl font-semibold",
                  saldoProjetado < 0 && "text-status-danger-foreground",
                )}
              >
                {formatarMoeda(saldoProjetado)}
              </p>
            </div>
            <Wallet className="size-8 text-primary" strokeWidth={1.5} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receber">
        <TabsList>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receber">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receitas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className="font-medium">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">{t.clienteNome}</p>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatarData(t.dataVencimento)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatarMoeda(t.valor)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {t.status === "pago" ? (
                            <EmitirNfseButton transacao={t} />
                          ) : (
                            <GerarCobrancaDialog transacao={t} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.descricao}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {t.categoria ? LABEL_CATEGORIA_DESPESA[t.categoria] : "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatarData(t.dataVencimento)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatarMoeda(t.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
