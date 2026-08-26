"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolverPendencia(formData: FormData) {
  const pendenciaId = String(formData.get("pendenciaId") ?? "");
  const empresaId = String(formData.get("empresaId") ?? "");

  const supabase = await createClient();
  await supabase
    .from("pendencias")
    .update({ status: "resolvida", resolvida_em: new Date().toISOString() })
    .eq("id", pendenciaId);

  revalidatePath(`/empresas/${empresaId}`);
}
