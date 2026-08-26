import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "administrador" | "consultor";

/**
 * cache() deduplica chamadas dentro do mesmo request (layout + page
 * chamam isso independentemente) — evita bater no Supabase Auth mais
 * de uma vez por requisição.
 */
export const getSessao = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role: Role = user?.app_metadata?.role === "administrador" ? "administrador" : "consultor";

  return { user, role, isAdmin: role === "administrador" };
});
