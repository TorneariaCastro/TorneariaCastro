import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { OrdemServicoFormDialog } from "@/components/ordens-servico/ordem-servico-form-dialog";
import { listClientes } from "@/lib/data/clientes";
import { listOrdensServico } from "@/lib/data/ordens-servico";
import { PIPELINE_ORDEM_SERVICO, calcularValorTotal } from "@/lib/types";
import { formatarData, formatarMoeda } from "@/lib/format";
import { getSessao } from "@/lib/auth/session";

export default async function OrdensServicoPage() {
  const [ordensServico, clientes, { isAdmin }] = await Promise.all([
    listOrdensServico(),
    listClientes(),
    getSessao(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground">{ordensServico.length} ordens registradas</p>
        </div>
        {isAdmin && <OrdemServicoFormDialog modo="os" clientes={clientes} />}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PIPELINE_ORDEM_SERVICO.map((status) => {
          const quantidade = ordensServico.filter((os) => os.status === status).length;
          return (
            <Card key={status} className="py-4">
              <CardContent className="space-y-1 px-4">
                <StatusBadge status={status} />
                <p className="text-xl font-semibold tabular-nums">{quantidade}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {ordensServico.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Nenhuma ordem de serviço registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Abertura</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordensServico.map((os) => (
                  <TableRow key={os.id}>
                    <TableCell className="font-medium">{os.numero}</TableCell>
                    <TableCell className="text-muted-foreground">{os.clienteNome}</TableCell>
                    <TableCell className="hidden max-w-[280px] truncate text-muted-foreground lg:table-cell">
                      {os.descricaoServico}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatarData(os.dataAbertura)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={os.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatarMoeda(calcularValorTotal(os))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
