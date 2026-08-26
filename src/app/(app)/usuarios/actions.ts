"use server";

import { revalidatePath } from "next/cache";
import { getSessao } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth/session";

export interface CriarUsuarioState {
  error?: string;
}

export async function criarUsuario(
  _prevState: CriarUsuarioState | undefined,
  formData: FormData,
): Promise<CriarUsuarioState> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    return { error: "Só administradores podem criar usuários." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "administrador" ? "administrador" : "consultor";

  if (!email || !email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      return { error: "Já existe um usuário com esse e-mail." };
    }
    return { error: "Não foi possível criar o usuário." };
  }

  revalidatePath("/usuarios");
  return {};
}

export async function alterarPapel(userId: string, role: Role): Promise<{ error?: string }> {
  const { isAdmin } = await getSessao();
  if (!isAdmin) {
    return { error: "Só administradores podem alterar papéis." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: { role } });

  if (error) {
    return { error: "Não foi possível alterar o papel do usuário." };
  }

  revalidatePath("/usuarios");
  return {};
}

export async function removerUsuario(userId: string): Promise<{ error?: string }> {
  const { isAdmin, user } = await getSessao();
  if (!isAdmin) {
    return { error: "Só administradores podem remover usuários." };
  }
  if (user?.id === userId) {
    return { error: "Você não pode remover a si mesmo." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { error: "Não foi possível remover o usuário." };
  }

  revalidatePath("/usuarios");
  return {};
}
