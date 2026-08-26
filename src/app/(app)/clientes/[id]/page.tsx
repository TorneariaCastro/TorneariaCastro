import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, MapPin, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { getCliente } from "@/lib/data/clientes";
import { listOrdensServicoPorCliente } from "@/lib/data/ordens-servico";
import { listTransacoesPorCliente } from "@/lib/data/transacoes";
import { calcularValorTotal } from "@/lib/types";
import { formatarDocumento, formatarMoeda } from "@/lib/format";

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await getCliente(id);

  if (!cliente) notFound();

  const [ordensDoCliente, transacoesDoCliente] = await Promise.all([
    listOrdensServicoPorCliente(id),
    listTransacoesPorCliente(id),
  ]);

  const totalFaturado = transacoesDoCliente
    .filter((t) => t.status === "pago")
    .reduce((total, t) => total + t.valor, 0);
  const faturasPendentes = transacoesDoCliente.filter((t) => t.status === "pendente" || t.status === "atrasado");

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para clientes
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {cliente.tipoPessoa === "juridica" ? <Building2 className="size-5" /> : <User className="size-5" />}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
            <p className="text-sm text-muted-foreground">{formatarDocumento(cliente.documento)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Faturado (LTV)</p>
            <p className="text-xl font-semibold">{formatarMoeda(totalFaturado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Faturas Pendentes</p>
            <p className="text-xl font-semibold">{faturasPendentes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Ordens de Serviço</p>
            <p className="text-xl font-semibold">{ordensDoCliente.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dados de contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span className="truncate text-foreground">{cliente.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="size-4 shrink-0" />
              <span className="text-foreground">{cliente.telefone}</span>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span className="text-foreground">
                {cliente.endereco.logradouro}, {cliente.endereco.numero}
                {cliente.endereco.complemento ? ` — ${cliente.endereco.complemento}` : ""}
                <br />
                {cliente.endereco.bairro}, {cliente.endereco.cidade}/{cliente.endereco.uf}
                <br />
                CEP {cliente.endereco.cep}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 lg:col-span-2">
          <CardHeader className="pt-5">
            <CardTitle className="text-base font-semibold">Histórico de Ordens de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {ordensDoCliente.length === 0 ? (
              <p className="px-6 pb-5 text-sm text-muted-foreground">Nenhuma ordem de serviço registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensDoCliente.map((os) => (
                    <TableRow key={os.id}>
                      <TableCell className="font-medium">{os.numero}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {os.descricaoServico}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={os.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarMoeda(calcularValorTotal(os))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
