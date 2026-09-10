import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getOrdemServico } from "@/lib/data/ordens-servico";
import { getCliente, listClientes } from "@/lib/data/clientes";
import { calcularValorTotal } from "@/lib/types";
import { formatarData, formatarMoeda } from "@/lib/format";
import { getSessao } from "@/lib/auth/session";
import { OrdemServicoAcoes } from "./ordem-servico-acoes";
import { ItensLancamentos } from "./itens-lancamentos";
import { StatusAcoes } from "./status-acoes";
import { EditarOsDialog } from "./editar-os-dialog";

export default async function OrdemServicoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [os, clientes, { isAdmin }] = await Promise.all([getOrdemServico(id), listClientes(), getSessao()]);

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
        {isAdmin && !os.aprovadoEm && <EditarOsDialog os={os} clientes={clientes} />}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Valores do serviço</CardTitle>
          {os.aprovadoEm && (
            <p className="text-sm text-muted-foreground">
              O cliente já aprovou este orçamento — os valores ficaram travados.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ItensLancamentos
            ordemServicoId={os.id}
            maoDeObra={os.maoDeObra}
            materiais={os.materiais}
            podeEditar={isAdmin && !os.aprovadoEm}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Andamento do serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusAcoes
              ordemServicoId={os.id}
              status={os.status}
              aprovadoPeloCliente={Boolean(os.aprovadoEm)}
            />
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
              clienteNome={cliente.nome}
              clienteTelefone={cliente.telefone}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
