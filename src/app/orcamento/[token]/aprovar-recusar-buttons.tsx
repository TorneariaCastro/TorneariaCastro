"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { aprovarOrcamento, recusarOrcamento } from "./actions";

export function AprovarRecusarButtons({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [decidido, setDecidido] = useState<"aprovado" | "recusado" | null>(null);

  function handleAprovar() {
    startTransition(async () => {
      const result = await aprovarOrcamento(token);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDecidido("aprovado");
      toast.success("Orçamento aprovado!");
    });
  }

  function handleRecusar() {
    startTransition(async () => {
      const result = await recusarOrcamento(token);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDecidido("recusado");
      toast.success("Orçamento recusado.");
    });
  }

  if (decidido === "aprovado") {
    return <p className="text-sm text-status-success-foreground">Orçamento aprovado. Obrigado!</p>;
  }
  if (decidido === "recusado") {
    return <p className="text-sm text-status-danger-foreground">Orçamento recusado.</p>;
  }

  return (
    <div className="flex gap-3">
      <Button className="flex-1 gap-2" disabled={pending} onClick={handleAprovar}>
        <CheckCircle2 className="size-4" />
        Aprovar orçamento
      </Button>
      <Button variant="outline" className="flex-1 gap-2" disabled={pending} onClick={handleRecusar}>
        <XCircle className="size-4" />
        Recusar
      </Button>
    </div>
  );
}
