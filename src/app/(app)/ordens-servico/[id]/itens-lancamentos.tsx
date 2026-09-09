"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarMoeda } from "@/lib/format";
import type { ItemMaoDeObra, ItemMaterial } from "@/lib/types";
import { adicionarMaoDeObra, adicionarMaterial, removerItem } from "../actions";

interface Props {
  ordemServicoId: string;
  maoDeObra: ItemMaoDeObra[];
  materiais: ItemMaterial[];
  podeEditar: boolean;
}

export function ItensLancamentos({ ordemServicoId, maoDeObra, materiais, podeEditar }: Props) {
  const [pending, startTransition] = useTransition();
  const formMaoDeObra = useRef<HTMLFormElement>(null);
  const formMaterial = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string>();

  function lancarMaoDeObra(formData: FormData) {
    startTransition(async () => {
      const r = await adicionarMaoDeObra(ordemServicoId, formData);
      if (r.error) {
        setErro(r.error);
        toast.error(r.error);
        return;
      }
      setErro(undefined);
      toast.success("Mão de obra lançada.");
      formMaoDeObra.current?.reset();
    });
  }

  function lancarMaterial(formData: FormData) {
    startTransition(async () => {
      const r = await adicionarMaterial(ordemServicoId, formData);
      if (r.error) {
        setErro(r.error);
        toast.error(r.error);
        return;
      }
      setErro(undefined);
      toast.success("Material lançado.");
      formMaterial.current?.reset();
    });
  }

  function remover(tipo: "mao_de_obra" | "material", itemId: string) {
    startTransition(async () => {
      const r = await removerItem(tipo, itemId, ordemServicoId);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Lançamento removido.");
    });
  }

  const totalMaoDeObra = maoDeObra.reduce((t, i) => t + i.horas * i.valorHora, 0);
  const totalMateriais = materiais.reduce((t, i) => t + i.quantidade * i.valorUnitario, 0);

  return (
    <div className="space-y-6">
      {erro && <p className="text-sm text-status-danger-foreground">{erro}</p>}

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Mão de obra</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{formatarMoeda(totalMaoDeObra)}</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Horas</TableHead>
              <TableHead className="text-right">Valor/hora</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              {podeEditar && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {maoDeObra.length === 0 ? (
              <TableRow>
                <TableCell colSpan={podeEditar ? 5 : 4} className="text-sm text-muted-foreground">
                  Nenhuma mão de obra lançada.
                </TableCell>
              </TableRow>
            ) : (
              maoDeObra.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.horas}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatarMoeda(item.valorHora)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoeda(item.horas * item.valorHora)}
                  </TableCell>
                  {podeEditar && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        onClick={() => remover("mao_de_obra", item.id)}
                        title="Remover"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {podeEditar && (
          <form ref={formMaoDeObra} action={lancarMaoDeObra} noValidate className="grid gap-3 sm:grid-cols-[1fr_7rem_9rem_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor="mo-descricao">Descrição</Label>
              <Input id="mo-descricao" name="descricao" placeholder="Ex: Torneamento de eixo" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mo-horas">Horas</Label>
              <Input id="mo-horas" name="horas" inputMode="decimal" placeholder="2" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mo-valor">Valor por hora</Label>
              <Input id="mo-valor" name="valorHora" inputMode="decimal" placeholder="120,00" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={pending} className="gap-1.5">
                <Plus className="size-4" />
                Lançar
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-3 border-t pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Materiais</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{formatarMoeda(totalMateriais)}</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="text-right">Valor unitário</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              {podeEditar && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {materiais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={podeEditar ? 5 : 4} className="text-sm text-muted-foreground">
                  Nenhum material lançado.
                </TableCell>
              </TableRow>
            ) : (
              materiais.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantidade} {item.unidade}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatarMoeda(item.valorUnitario)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoeda(item.quantidade * item.valorUnitario)}
                  </TableCell>
                  {podeEditar && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        onClick={() => remover("material", item.id)}
                        title="Remover"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {podeEditar && (
          <form
            ref={formMaterial}
            action={lancarMaterial}
            noValidate
            className="grid gap-3 sm:grid-cols-[1fr_6rem_5rem_9rem_auto]"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="mat-descricao">Descrição</Label>
              <Input id="mat-descricao" name="descricao" placeholder="Ex: Aço 1045" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mat-qtd">Qtd.</Label>
              <Input id="mat-qtd" name="quantidade" inputMode="decimal" placeholder="3" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mat-unidade">Unidade</Label>
              <Input id="mat-unidade" name="unidade" placeholder="un" defaultValue="un" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mat-valor">Valor unitário</Label>
              <Input id="mat-valor" name="valorUnitario" inputMode="decimal" placeholder="85,00" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={pending} className="gap-1.5">
                <Plus className="size-4" />
                Lançar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
