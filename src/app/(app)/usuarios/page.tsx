import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConvidarUsuarioDialog } from "@/components/usuarios/convidar-usuario-dialog";
import { RemoverUsuarioButton } from "@/components/usuarios/remover-usuario-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/format";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user: usuarioAtual },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  const usuarios = error ? [] : data.users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {usuarios.length} {usuarios.length === 1 ? "pessoa tem" : "pessoas têm"} acesso ao sistema
          </p>
        </div>
        <ConvidarUsuarioDialog />
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {usuarios.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
              <Users className="size-8 text-muted-foreground/50" />
              Nenhum usuário encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Convidado em</TableHead>
                  <TableHead className="hidden md:table-cell">Último acesso</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      {usuario.email}
                      {usuario.id === usuarioAtual?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.email_confirmed_at ? "default" : "secondary"}>
                        {usuario.email_confirmed_at ? "Ativo" : "Convite pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatarData(usuario.created_at)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {usuario.last_sign_in_at ? formatarData(usuario.last_sign_in_at) : "Nunca entrou"}
                    </TableCell>
                    <TableCell>
                      {usuario.id !== usuarioAtual?.id && (
                        <RemoverUsuarioButton userId={usuario.id} email={usuario.email ?? ""} />
                      )}
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
