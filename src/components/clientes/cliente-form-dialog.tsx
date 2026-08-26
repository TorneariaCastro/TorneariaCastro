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
import type { TipoPessoa } from "@/lib/types";
import { criarCliente } from "@/app/(app)/clientes/actions";

interface ClienteFormDialogProps {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children?: React.ReactNode;
}

export function ClienteFormDialog({ variant = "outline", className, children }: ClienteFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("juridica");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await criarCliente(undefined, formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Cliente cadastrado");
      setError(undefined);
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant }), "gap-2", className)}>
        {children ?? (
          <>
            <UserPlus className="size-4" />
            Cadastrar Cliente
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Cadastre um novo cliente pessoa física ou jurídica.</DialogDescription>
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
              <Input id="nome" name="nome" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documento">{tipoPessoa === "juridica" ? "CNPJ" : "CPF"}</Label>
              <Input id="documento" name="documento" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" name="telefone" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="logradouro">Endereço</Label>
                <Input id="logradouro" name="logradouro" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" name="numero" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" name="bairro" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" name="uf" maxLength={2} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" name="cep" required />
            </div>
          </div>

          {error && <p className="px-1 pb-2 text-sm text-status-danger-foreground">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
