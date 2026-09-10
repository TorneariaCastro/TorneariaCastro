"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Cliente, TipoPessoa } from "@/lib/types";
import { atualizarCliente, criarCliente } from "@/app/(app)/clientes/actions";

interface ClienteFormDialogProps {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children?: React.ReactNode;
  /** Quando informado, o formulário edita esse cliente em vez de criar um novo. */
  cliente?: Cliente;
}

export function ClienteFormDialog({ variant = "outline", className, children, cliente }: ClienteFormDialogProps) {
  const editando = Boolean(cliente);
  const [open, setOpen] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(cliente?.tipoPessoa ?? "juridica");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    // Validação explícita: dentro do dialog, o balão de validação nativo do
    // navegador não aparece, e o envio era bloqueado sem nenhum aviso na tela.
    const obrigatorios: Array<[string, string]> = [
      ["nome", tipoPessoa === "juridica" ? "Razão Social" : "Nome completo"],
      ["documento", tipoPessoa === "juridica" ? "CNPJ" : "CPF"],
      ["email", "E-mail"],
      ["telefone", "Telefone"],
      ["logradouro", "Logradouro"],
      ["numero", "Número"],
      ["bairro", "Bairro"],
      ["cidade", "Cidade"],
      ["uf", "UF"],
      ["cep", "CEP"],
    ];
    const faltando = obrigatorios.find(([campo]) => !String(formData.get(campo) ?? "").trim());
    if (faltando) {
      const mensagem = `Preencha o campo "${faltando[1]}".`;
      setError(mensagem);
      toast.error(mensagem);
      return;
    }

    startTransition(async () => {
      const result = cliente
        ? await atualizarCliente(cliente.id, formData)
        : await criarCliente(undefined, formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(editando ? "Cliente atualizado" : "Cliente cadastrado");
      setError(undefined);
      setOpen(false);
      if (!editando) formRef.current?.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant }), "gap-2", className)}>
        {children ?? (
          <>
            <UserPlus className="size-4" />
            {editando ? "Editar cliente" : "Cadastrar Cliente"}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>{editando ? "Altere os dados do cliente." : "Cadastre um novo cliente pessoa física ou jurídica."}</DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4 pr-1">
            <div className="grid gap-2">
              <Label>Tipo de pessoa</Label>
              <Select
                value={tipoPessoa}
                onValueChange={(v) => setTipoPessoa(v as TipoPessoa)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="tipoPessoa" value={tipoPessoa} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome">{tipoPessoa === "juridica" ? "Razão Social" : "Nome completo"}</Label>
              <Input id="nome" name="nome" defaultValue={cliente?.nome ?? ""} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documento">{tipoPessoa === "juridica" ? "CNPJ" : "CPF"}</Label>
              <Input id="documento" name="documento" defaultValue={cliente?.documento ?? ""} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" name="telefone" defaultValue={cliente?.telefone ?? ""} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="logradouro">Endereço</Label>
                <Input id="logradouro" name="logradouro" defaultValue={cliente?.endereco?.logradouro ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" name="numero" defaultValue={cliente?.endereco?.numero ?? ""} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" name="bairro" defaultValue={cliente?.endereco?.bairro ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" defaultValue={cliente?.endereco?.cidade ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" name="uf" maxLength={2} defaultValue={cliente?.endereco?.uf ?? ""} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" name="cep" defaultValue={cliente?.endereco?.cep ?? ""} required />
            </div>
          </div>

          {error && <p className="px-1 pb-2 text-sm text-status-danger-foreground">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : editando ? "Salvar alterações" : "Salvar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
