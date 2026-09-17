// app/api/availability/route.js
//
// GET /api/availability?date=YYYY-MM-DD&service_id=...&staff_id=...
//
// Este es el endpoint que el Agente de Voz (Vapi / Buildmyagent)
// llama para saber qué horas ofrecerle al paciente. Cruza:
//   1) la duración del servicio pedido,
//   2) el horario de atención del negocio (tabla settings),
//   3) las citas ya activas de ese especialista ese día,
// y devuelve los huecos libres en bloques de 30 minutos.

import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/utils/supabase-server";

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// Estados que YA NO bloquean el horario (se liberó).
const NON_BLOCKING_STATUSES = ["no_show", "cancelled"];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("service_id");
  const staffId = searchParams.get("staff_id");

  if (!date || !serviceId || !staffId) {
    return NextResponse.json(
      { error: "date, service_id y staff_id son requeridos" },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date debe tener formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  const [serviceRes, settingsRes, apptsRes] = await Promise.all([
    supabase.from("services").select("duration_minutes").eq("id", serviceId).single(),
    supabase.from("settings").select("hours_open, hours_close").eq("id", 1).single(),
    supabase
      .from("appointments")
      .select("time, duration_minutes, status")
      .eq("date", date)
      .eq("staff_id", staffId),
  ]);

  if (serviceRes.error || !serviceRes.data) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  if (settingsRes.error || !settingsRes.data) {
    return NextResponse.json(
      { error: "No se pudo leer el horario del negocio" },
      { status: 500 }
    );
  }
  if (apptsRes.error) {
    return NextResponse.json({ error: apptsRes.error.message }, { status: 500 });
  }

  const duration = serviceRes.data.duration_minutes;
  const startMins = timeToMinutes(settingsRes.data.hours_open);
  const endMins = timeToMinutes(settingsRes.data.hours_close);

  const blockingAppts = (apptsRes.data || []).filter(
    (a) => !NON_BLOCKING_STATUSES.includes(a.status)
  );

  const availableSlots = [];
  for (let t = startMins; t + duration <= endMins; t += 30) {
    const slotEnd = t + duration;
    const overlaps = blockingAppts.some((a) => {
      const aStart = timeToMinutes(a.time.slice(0, 5));
      const aEnd = aStart + (a.duration_minutes || 30);
      return t < aEnd && slotEnd > aStart;
    });
    if (!overlaps) availableSlots.push(minutesToTime(t));
  }

  return NextResponse.json({
    date,
    service_id: serviceId,
    staff_id: staffId,
    duration_minutes: duration,
    available_slots: availableSlots,
  });
}
