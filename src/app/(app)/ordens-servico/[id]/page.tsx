import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { getOrdemServico } from "@/lib/data/ordens-servico";
import { getCliente } from "@/lib/data/clientes";
import { calcularValorTotal } from "@/lib/types";
import { formatarData, formatarMoeda } from "@/lib/format";
import { getSessao } from "@/lib/auth/session";
import { OrdemServicoAcoes } from "./ordem-servico-acoes";

export default async function OrdemServicoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [os, { isAdmin }] = await Promise.all([getOrdemServico(id), getSessao()]);

  if (!os) notFound();

  const cliente = await getCliente(os.clienteId);

  return (
    <div className="space-y-6">
      <Link
        href="/ordens-servico"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para ordens de serviço
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{os.numero}</h1>
            <StatusBadge status={os.status} />
          </div>
          <p className="text-sm text-muted-foreground">{os.clienteNome}</p>
        </div>
      </div>

      {os.aprovadoEm && (
        <p className="text-sm text-status-success-foreground">
          Cliente aprovou o orçamento em {formatarData(os.aprovadoEm)}.
        </p>
      )}
      {os.recusadoEm && (
        <p className="text-sm text-status-danger-foreground">
          Cliente recusou o orçamento em {formatarData(os.recusadoEm)}.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Descrição do serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{os.descricaoServico}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Valor total</p>
            <p className="text-xl font-semibold">{formatarMoeda(calcularValorTotal(os))}</p>
          </CardContent>
        </Card>
      </div>

      {os.maoDeObra.length > 0 && (
        <Card className="py-0">
          <CardHeader className="pt-5">
            <CardTitle className="text-base font-semibold">Mão de obra</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Valor/hora</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.maoDeObra.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-right">{item.horas}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(item.valorHora)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(item.horas * item.valorHora)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {os.materiais.length > 0 && (
        <Card className="py-0">
          <CardHeader className="pt-5">
            <CardTitle className="text-base font-semibold">Materiais</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Valor unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.materiais.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-right">
                      {item.quantidade} {item.unidade}
                    </TableCell>
                    <TableCell className="text-right">{formatarMoeda(item.valorUnitario)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(item.quantidade * item.valorUnitario)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isAdmin && cliente && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Compartilhamento e aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdemServicoAcoes
              ordemServicoId={os.id}
              status={os.status}
              aprovado={Boolean(os.aprovadoEm)}
              clienteNome={cliente.nome}
              clienteTelefone={cliente.telefone}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
