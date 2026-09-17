import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function consultarDisponibilidad(businessId, fecha) {
  const { data: citas, error } = await supabase
    .from('appointments')
    .select('time, status')
    .eq('business_id', businessId)
    .eq('date', fecha)
    .neq('status', 'cancelled');

  if (error) throw new Error('Error al consultar citas');

  const todosLosHorarios = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];
  const ocupados = citas ? citas.map((c) => c.time) : [];
  const disponibles = todosLosHorarios.filter((h) => !ocupados.includes(h));

  return { fecha, horarios_disponibles: disponibles };
}

export async function crearAgendamiento(params) {
  const { businessId, clienteNombre, clienteTelefono, fecha, hora, servicioId, staffId } = params;

  let { data: cliente } = await supabase
    .from('clients')
    .select('id')
    .eq('business_id', businessId)
    .eq('phone', clienteTelefono)
    .maybeSingle();

  if (!cliente) {
    const { data: nuevoCliente, error: errCliente } = await supabase
      .from('clients')
      .insert({ business_id: businessId, name: clienteNombre, phone: clienteTelefono })
      .select('id')
      .single();

    if (errCliente) throw new Error('No se pudo crear el cliente');
    cliente = nuevoCliente;
  }

  const { data: existente } = await supabase
    .from('appointments')
    .select('id')
    .eq('business_id', businessId)
    .eq('date', fecha)
    .eq('time', hora)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (existente) {
    return { success: false, message: 'El horario seleccionado ya fue ocupado.' };
  }

  const { data: cita, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      client_id: cliente.id,
      service_id: servicioId || null,
      staff_id: staffId || null,
      date: fecha,
      time: hora,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) throw new Error('Error al agendar la cita');

  return { success: true, cita };
}