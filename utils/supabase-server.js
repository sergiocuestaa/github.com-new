// utils/supabase-server.js
//
// Cliente de Supabase para USO EXCLUSIVO EN SERVIDOR (rutas de
// app/api/*). Usa la service role key, que ignora RLS por
// completo — por eso NUNCA debe importarse desde un componente
// 'use client' ni exponerse con el prefijo NEXT_PUBLIC_.
//
// Este es el canal que usará el Agente de Voz (Vapi / Buildmyagent):
// llama a tus endpoints HTTP, que a su vez usan esta service role
// key para leer/escribir sin depender de que el visitante tenga
// sesión iniciada.

import { createClient } from "@supabase/supabase-js";

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
