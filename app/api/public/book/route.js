import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ----------------------------------------------------
// GET: CONSULTAR DISPONIBILIDAD DINÁMICA
// ----------------------------------------------------
export async function GET(request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Faltan variables de entorno de Supabase" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);

    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const serviceId = searchParams.get('service_id');
    const staffId = searchParams.get('staff_id');

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError) {
      return NextResponse.json({ error: "Error al consultar la configuración", detail: settingsError.message }, { status: 500 });
    }

    let durationMinutes = 30;
    let serviceName = null;

    if (serviceId) {
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (service) {
        durationMinutes = service.duration_minutes || 30;
        serviceName = service.name;
      }
    }

    let query = supabase
      .from('appointments')
      .select('start_time, end_time, staff_id')
      .eq('date', date)
      .neq('status', 'cancelled');

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data: appointments, error: apptError } = await query;
    if (apptError) {
      return NextResponse.json({ error: "Error al consultar citas agendadas", detail: apptError.message }, { status: 500 });
    }

    const openMinutes = timeToMinutes(settings.hours_open);
    const closeMinutes = timeToMinutes(settings.hours_close);

    const bookedRanges = (appointments || []).map(appt => ({
      start: timeToMinutes(appt.start_time),
      end: timeToMinutes(appt.end_time)
    }));

    const availableSlots = [];

    for (let current = openMinutes; current + durationMinutes <= closeMinutes; current += durationMinutes) {
      const slotEnd = current + durationMinutes;
      const isOverlapping = bookedRanges.some(range => current < range.end && slotEnd > range.start);

      if (!isOverlapping) {
        availableSlots.push(minutesToTime(current));
      }
    }

    return NextResponse.json({
      success: true,
      negocio: settings.business_name,
      fecha: date,
      servicio: serviceName || 'General',
      duracion_minutos: durationMinutes,
      horarios_disponibles: availableSlots
    });

  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}

// ----------------------------------------------------
// POST: CREAR / REGISTRAR NUEVA CITA
// ----------------------------------------------------
export async function POST(request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Faltan variables de entorno de Supabase" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    const { customer_name, customer_phone, customer_email, date, start_time, service_id, staff_id } = body;

    if (!customer_name || !customer_phone || !date || !start_time) {
      return NextResponse.json({
        error: "Faltan datos obligatorios: customer_name, customer_phone, date, start_time"
      }, { status: 400 });
    }

    // 1. Obtener duración del servicio
    let durationMinutes = 30;
    if (service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', service_id)
        .single();
      if (service?.duration_minutes) {
        durationMinutes = service.duration_minutes;
      }
    }

    // Calcular end_time
    const startMin = timeToMinutes(start_time);
    const endMin = startMin + durationMinutes;
    const end_time = minutesToTime(endMin);

    // 2. Re-validación anti-colisión: Verificar que el horario siga disponible
    const { data: existingAppts } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('date', date)
      .neq('status', 'cancelled');

    const isConflict = (existingAppts || []).some(appt => {
      const existingStart = timeToMinutes(appt.start_time);
      const existingEnd = timeToMinutes(appt.end_time);
      return startMin < existingEnd && endMin > existingStart;
    });

    if (isConflict) {
      return NextResponse.json({
        success: false,
        error: "El horario seleccionado ya no se encuentra disponible."
      }, { status: 409 });
    }

    // 3. Crear o buscar el cliente en la tabla `customers`
    let customerId = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customer_phone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: createCustomerErr } = await supabase
        .from('customers')
        .insert([{ name: customer_name, phone: customer_phone, email: customer_email || null }])
        .select()
        .single();

      if (createCustomerErr) {
        return NextResponse.json({ error: "Error al registrar cliente", detail: createCustomerErr.message }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // 4. Crear la cita en la tabla `appointments`
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .insert([{
        customer_id: customerId,
        staff_id: staff_id || null,
        service_id: service_id || null,
        date: date,
        start_time: start_time,
        end_time: end_time,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (apptError) {
      return NextResponse.json({ error: "Error al registrar la cita", detail: apptError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensaje: "Cita agendada con éxito",
      reserva: {
        id: appointment.id,
        cliente: customer_name,
        telefono: customer_phone,
        fecha: date,
        hora_inicio: start_time,
        hora_fin: end_time,
        estado: appointment.status
      }
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
} python3 -m http.server 3000
