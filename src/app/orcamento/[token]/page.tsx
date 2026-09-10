import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcularValoresOrdemServico } from "@/lib/data/ordens-servico";
import { formatarData, formatarMoeda } from "@/lib/format";
import { AprovarRecusarButtons } from "./aprovar-recusar-buttons";

/**
 * O que o cliente pode ver: o que ele está comprando (linhas de serviço) e o
 * total. Mão de obra e materiais são formação de preço — não saem do servidor.
 */
interface OrcamentoPublico {
  numero: string;
  clienteNome: string;
  descricaoServico: string;
  servicos: { descricao: string; quantidade: number; valor_unitario: number }[];
  /**
   * Mão de obra e materiais somados numa linha só. O cliente precisa ver de
   * onde vem cada real do total — um total maior que a soma das linhas parece
   * erro de conta, não discrição. Vai só o valor agregado, nunca os itens.
   */
  outrosValores: { rotulo: string; valor: number } | null;
  valorTotal: number;
  aprovadoEm: string | null;
  recusadoEm: string | null;
  linkExpiraEm: string | null;
}

async function buscarOrcamentoPorToken(token: string): Promise<OrcamentoPublico | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select(
      "id, numero, descricao_servico, aprovado_em, recusado_em, link_expira_em, clientes(nome), itens_servico(descricao, quantidade, valor_unitario)",
    )
    .eq("token_compartilhamento", token)
    .maybeSingle();

  if (error || !data) return null;

  const clientesRow = data.clientes as { nome: string } | { nome: string }[] | null;
  const clienteNome = Array.isArray(clientesRow) ? (clientesRow[0]?.nome ?? "") : (clientesRow?.nome ?? "");

  const valores = await calcularValoresOrdemServico(supabase, data.id);

  return {
    numero: data.numero,
    clienteNome,
    descricaoServico: data.descricao_servico,
    servicos: data.itens_servico ?? [],
    outrosValores: montarOutrosValores(valores.maoDeObra, valores.materiais),
    valorTotal: valores.total,
    aprovadoEm: data.aprovado_em,
    recusadoEm: data.recusado_em,
    linkExpiraEm: data.link_expira_em,
  };
}

/**
 * O rótulo acompanha o que realmente foi lançado. Dizer "Materiais e execução"
 * numa ordem sem material nenhum seria afirmar algo falso ao cliente.
 */
function montarOutrosValores(
  maoDeObra: number,
  materiais: number,
): { rotulo: string; valor: number } | null {
  const valor = maoDeObra + materiais;
  if (valor <= 0) return null;

  if (maoDeObra > 0 && materiais > 0) return { rotulo: "Materiais e execução", valor };
  if (materiais > 0) return { rotulo: "Materiais", valor };
  return { rotulo: "Execução do serviço", valor };
}

export default async function OrcamentoPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const orcamento = await buscarOrcamentoPorToken(token);

  if (!orcamento) notFound();

  const linkValido = orcamento.linkExpiraEm ? new Date(orcamento.linkExpiraEm).getTime() > Date.now() : false;

  if (!linkValido && !orcamento.aprovadoEm && !orcamento.recusadoEm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Peça um novo orçamento à Tornearia Castro.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Orçamento {orcamento.numero} — Tornearia Castro</CardTitle>
          <p className="text-sm text-muted-foreground">Cliente: {orcamento.clienteNome}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm">{orcamento.descricaoServico}</p>

          {(orcamento.servicos.length > 0 || orcamento.outrosValores) && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamento.servicos.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(item.quantidade * item.valor_unitario)}
                    </TableCell>
                  </TableRow>
                ))}
                {orcamento.outrosValores && (
                  <TableRow>
                    <TableCell>{orcamento.outrosValores.rotulo}</TableCell>
                    <TableCell className="text-right" />
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(orcamento.outrosValores.valor)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium">Valor total</span>
            <span className="text-xl font-semibold tabular-nums">{formatarMoeda(orcamento.valorTotal)}</span>
          </div>

          {orcamento.aprovadoEm && (
            <p className="text-sm text-status-success-foreground">
              Orçamento aprovado em {formatarData(orcamento.aprovadoEm)}.
            </p>
          )}
          {orcamento.recusadoEm && (
            <p className="text-sm text-status-danger-foreground">
              Orçamento recusado em {formatarData(orcamento.recusadoEm)}.
            </p>
          )}
          {!orcamento.aprovadoEm && !orcamento.recusadoEm && <AprovarRecusarButtons token={token} />}
        </CardContent>
      </Card>
    </div>
  );
}
