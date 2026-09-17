// app/api/appointments/route.js
//
// POST /api/appointments
// Body esperado (JSON):
// {
//   "client_name": "María López",
//   "client_phone": "+52 998 123 4567",   // opcional, pero recomendado
//   "service_id": "uuid",
//   "staff_id": "uuid",
//   "date": "2026-09-10",
//   "time": "14:00"
// }
//
// Este es el endpoint que el Agente de Voz llama para CONFIRMAR
// una cita después de haber consultado /api/availability. Hace:
//   1) Busca al cliente por teléfono; si no existe, lo crea.
//   2) Revuelve a validar el horario contra citas activas (evita
//      condiciones de carrera: dos llamadas agendando el mismo
//      hueco casi al mismo tiempo).
//   3) Inserta la cita con snapshot de precio/duración del servicio.

import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/utils/supabase-server";

const NON_BLOCKING_STATUSES = ["no_show", "cancelled"];

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON" }, { status: 400 });
  }

  const { client_name, client_phone, service_id, staff_id, date, time } = body || {};

  if (!client_name || !service_id || !staff_id || !date || !time) {
    return NextResponse.json(
      { error: "client_name, service_id, staff_id, date y time son requeridos" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // 1) Servicio (para snapshot de precio/duración)
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("price, duration_minutes")
    .eq("id", service_id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  // 2) Cliente: buscar por teléfono, o crear uno nuevo
  let clientId = null;
  if (client_phone) {
    const { data: existingClient, error: findError } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", client_phone)
      .maybeSingle();
    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (existingClient) clientId = existingClient.id;
  }

  if (!clientId) {
    const { data: newClient, error: createError } = await supabase
      .from("clients")
      .insert({ name: client_name, phone: client_phone || null })
      .select("id")
      .single();
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    clientId = newClient.id;
  }

  // 3) Revalidar disponibilidad (evita doble reserva por condición de carrera)
  const { data: sameDayAppts, error: apptsError } = await supabase
    .from("appointments")
    .select("time, duration_minutes, status")
    .eq("date", date)
    .eq("staff_id", staff_id);

  if (apptsError) {
    return NextResponse.json({ error: apptsError.message }, { status: 500 });
  }

  const startMins = timeToMinutes(time);
  const endMins = startMins + service.duration_minutes;
  const hasConflict = (sameDayAppts || [])
    .filter((a) => !NON_BLOCKING_STATUSES.includes(a.status))
    .some((a) => {
      const aStart = timeToMinutes(a.time.slice(0, 5));
      const aEnd = aStart + (a.duration_minutes || 30);
      return startMins < aEnd && endMins > aStart;
    });

  if (hasConflict) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible, elige otro." },
      { status: 409 }
    );
  }

  // 4) Crear la cita
  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      client_id: clientId,
      service_id,
      staff_id,
      date,
      time,
      duration_minutes: service.duration_minutes,
      price: service.price,
      status: "pending",
    })
    .select("*, clients(name, phone), services(name), staff(name)")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
