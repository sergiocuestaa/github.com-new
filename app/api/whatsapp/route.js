import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// GET: Verificación del Webhook por Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'clinicadental123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new Response(challenge, { status: 200 });
  } else {
    return NextResponse.json({ error: 'Token invalido' }, { status: 403 });
  }
}

// POST: Procesar mensajes entrantes de WhatsApp
export async function POST(request) {
  try {
    const body = await request.json();

    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // Número del cliente
      const messageText = message.text ? message.text.body : '';

      // Ignorar eventos sin texto
      if (!messageText) {
        return NextResponse.json({ status: 'ignored' }, { status: 200 });
      }

      console.log(`Mensaje recibido de ${from}: "${messageText}"`);

      // 1. Guardar mensaje del usuario en Supabase
      await saveMessageToSupabase(from, 'user', messageText);

      // 2. Obtener la respuesta inteligente pasando el historial de conversación
      const aiResponse = await getOpenAIResponseWithHistory(messageText, from);

      // 3. Guardar respuesta de la IA en Supabase
      await saveMessageToSupabase(from, 'assistant', aiResponse);

      // 4. Enviar la respuesta al cliente por WhatsApp
      await sendWhatsAppMessage(from, aiResponse);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error al procesar el webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Guardar mensaje en Supabase
async function saveMessageToSupabase(phoneNumber, role, content) {
  if (!supabase) {
    console.warn('Supabase no está configurado. Omitiendo guardado de historial.');
    return;
  }

  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert([{ phone_number: phoneNumber, role: role, content: content }]);

    if (error) {
      console.error('Error al insertar mensaje en Supabase:', error);
    }
  } catch (err) {
    console.error('Excepción al guardar en Supabase:', err);
  }
}

// Obtener el historial de la conversación desde Supabase
async function getChatHistory(phoneNumber, limit = 10) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo historial de Supabase:', error);
      return [];
    }

    // Invertir para ordenar cronológicamente
    return data ? data.reverse().map(msg => ({ role: msg.role, content: msg.content })) : [];
  } catch (err) {
    console.error('Excepción al obtener historial:', err);
    return [];
  }
}

// Función para interactuar con OpenAI conservando el historial
async function getOpenAIResponseWithHistory(userMessage, phoneNumber) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY no está configurada');
    return '¡Hola! En este momento nuestro sistema de asistencia inteligente está en mantenimiento. Un asesor humano te contactará a la brevedad.';
  }

  const systemPrompt = {
    role: 'system',
    content: `
Eres el asistente virtual con Inteligencia Artificial de "Clínica Dental Elite".
Tu objetivo es brindar información amable, profesional y ágil a los clientes, así como ayudarles a agendar o consultar citas médicas.

Información general de la clínica:
- Horarios de atención: Lunes a Viernes de 9:00 AM a 7:00 PM, Sábados de 9:00 AM a 2:00 PM.
- Dirección: Av. Principal #123, Colonia Centro.
- Servicios: Limpieza dental, Blanqueamiento, Ortodoncia (Brackets e Invisalign), Endodoncia, Implantes y Valoración General.

Instrucciones de comportamiento:
- Sé siempre cortés, empático y profesional.
- Utiliza la información que el cliente te haya compartido en mensajes anteriores (su nombre, tratamiento solicitado, etc.).
- Respuestas breves y concisas, ideales para WhatsApp (máximo 2 a 3 párrafos cortos).
- Si el cliente desea agendar una cita, solicita amablemente su nombre completo, el servicio deseado y la fecha/hora de preferencia.
`
  };

  // Cargar mensajes pasados
  const history = await getChatHistory(phoneNumber, 10);

  // Si no hay historial suficiente en la base de datos, usamos la interacción actual
  const messagesToSend = history.length > 0 
    ? [systemPrompt, ...history] 
    : [systemPrompt, { role: 'user', content: userMessage }];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('Respuesta inesperada de OpenAI:', JSON.stringify(data));
      return '¡Hola! Gracias por escribir a Clínica Dental Elite. ¿En qué puedo ayudarte hoy?';
    }
  } catch (error) {
    console.error('Error al conectar con OpenAI:', error);
    return 'Gracias por escribir a Clínica Dental Elite. Un asesor responderá tu consulta en breve.';
  }
}

// Función para enviar mensajes vía la API de WhatsApp Business
async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error('WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados');
    return;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      }),
    });

    const resData = await res.json();
    console.log('Respuesta del envío a WhatsApp:', JSON.stringify(resData));
  } catch (error) {
    console.error('Error al enviar el mensaje de WhatsApp:', error);
  }
}
