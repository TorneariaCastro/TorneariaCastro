import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { listNotasFiscais } from "@/lib/data/notas-fiscais";
import { formatarData, formatarMoeda } from "@/lib/format";

export default async function NotasFiscaisPage() {
  const notasFiscais = await listNotasFiscais();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">{notasFiscais.length} notas emitidas</p>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {notasFiscais.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
              <FileText className="size-8 text-muted-foreground/50" />
              Nenhuma NFS-e emitida ainda. Emita pela tela de Financeiro, numa transação já paga.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Ordem de Serviço</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Emissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">ISS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notasFiscais.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell className="font-medium">{nota.numero ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{nota.ordemServicoNumero}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{nota.clienteNome}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {nota.dataEmissao ? formatarData(nota.dataEmissao) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={nota.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatarMoeda(nota.valorServico)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatarMoeda(nota.valorIss)}</TableCell>
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
