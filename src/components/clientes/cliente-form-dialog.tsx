"use client";

import { useState } from "react";
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

interface ClienteFormDialogProps {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children?: React.ReactNode;
}

export function ClienteFormDialog({ variant = "outline", className, children }: ClienteFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("juridica");
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 500));
    setSalvando(false);
    setOpen(false);
    toast.success("Cliente cadastrado", {
      description: nome ? `${nome} foi adicionado à sua base de clientes.` : undefined,
    });
    setNome("");
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Cadastre um novo cliente pessoa física ou jurídica.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo de pessoa</Label>
              <Select value={tipoPessoa} onValueChange={(v) => setTipoPessoa(v as TipoPessoa)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome">{tipoPessoa === "juridica" ? "Razão Social" : "Nome completo"}</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documento">{tipoPessoa === "juridica" ? "CNPJ" : "CPF"}</Label>
              <Input id="documento" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" required />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
