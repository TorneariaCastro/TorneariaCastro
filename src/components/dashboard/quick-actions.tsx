import { Wrench, FilePlus2, UserPlus } from "lucide-react";
import { OrdemServicoFormDialog } from "@/components/ordens-servico/ordem-servico-form-dialog";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import type { Cliente } from "@/lib/types";

export function QuickActions({ clientes }: { clientes: Cliente[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <OrdemServicoFormDialog modo="os" variant="default" clientes={clientes}>
        <Wrench className="size-4" />
        Nova Ordem de Serviço
      </OrdemServicoFormDialog>

      <OrdemServicoFormDialog modo="orcamento" variant="secondary" clientes={clientes}>
        <FilePlus2 className="size-4" />
        Criar Orçamento
      </OrdemServicoFormDialog>

      <ClienteFormDialog variant="outline">
        <UserPlus className="size-4" />
        Cadastrar Cliente
      </ClienteFormDialog>
    </div>
  );
}
