import { createClient } from "@/lib/supabase/server";

export type Role = "administrador" | "consultor";

export async function getSessao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role: Role = user?.app_metadata?.role === "administrador" ? "administrador" : "consultor";

  return { user, role, isAdmin: role === "administrador" };
}
