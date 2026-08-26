"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ConvidarUsuarioState {
  error?: string;
}

const SITE_URL = "https://tornearia-castro.vercel.app";

export async function convidarUsuario(
  _prevState: ConvidarUsuarioState | undefined,
  formData: FormData,
): Promise<ConvidarUsuarioState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE_URL}/definir-senha`,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      return { error: "Já existe um usuário com esse e-mail." };
    }
    return { error: "Não foi possível enviar o convite." };
  }

  revalidatePath("/usuarios");
  return {};
}

export async function removerUsuario(userId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { error: "Não foi possível remover o usuário." };
  }

  revalidatePath("/usuarios");
  return {};
}
