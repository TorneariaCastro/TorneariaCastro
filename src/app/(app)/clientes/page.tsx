import Link from "next/link";
import { Building2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { listClientes } from "@/lib/data/clientes";
import { formatarDocumento } from "@/lib/format";

export default async function ClientesPage() {
  const clientes = await listClientes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
        </div>
        <ClienteFormDialog />
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {clientes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Contato</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {cliente.tipoPessoa === "juridica" ? (
                            <Building2 className="size-4" />
                          ) : (
                            <User className="size-4" />
                          )}
                        </span>
                        <span className="font-medium">{cliente.nome}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatarDocumento(cliente.documento)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{cliente.telefone}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {cliente.endereco.cidade}/{cliente.endereco.uf}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? "default" : "secondary"}>
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
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
