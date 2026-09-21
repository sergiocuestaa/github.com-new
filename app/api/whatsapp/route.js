import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Verificación del Webhook de Meta
=======
// Inicializar cliente de Supabase de forma segura
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase URL o Key no válidas o no configuradas.');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

// GET: Verificación del Webhook por Meta
>>>>>>> 5d8cf4045fcf2142a3a51885a693116e750c9e37
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
<<<<<<< HEAD
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'clinicadental123';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }
  return new Response('Bad Request', { status: 400 });
}

// Recepción de mensajes de WhatsApp
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const messageObj = body.entry[0].changes[0].value.messages[0];
      const fromNumber = messageObj.from;
      const messageText = messageObj.text?.body;

      if (messageText) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Obtener la información de la clínica/sucursal desde Supabase dinámicamente
        const { data: clinicData } = await supabase
          .from('clinics') // O 'settings' según tu tabla
          .select('*')
          .limit(1)
          .single();

        // Datos por defecto por seguridad si la tabla está vacía
        const clinicInfo = clinicData || {
          name: "Clínica Dental Elite",
          city: "Tallin",
          country: "Estonia",
          address: "Oficina Central"
        };

        // 2. Guardar el mensaje entrante del usuario en Supabase
        await supabase.from('chat_messages').insert([
          { phone_number: fromNumber, role: 'user', content: messageText }
        ]);

        // 3. Obtener historial reciente de la conversación (últimos 10 mensajes)
        const { data: history } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('phone_number', fromNumber)
          .order('created_at', { ascending: false })
          .limit(10);

        const formattedHistory = (history || [])
          .reverse()
          .map(msg => ({ role: msg.role, content: msg.content }));

        // 4. Consultar respuesta con OpenAI pasando los datos de la sucursal
        const botReply = await getOpenAIResponse(formattedHistory, fromNumber, clinicInfo);

        // 5. Guardar la respuesta del asistente en Supabase
        await supabase.from('chat_messages').insert([
          { phone_number: fromNumber, role: 'assistant', content: botReply }
        ]);

        // 6. Enviar respuesta de vuelta a WhatsApp
        await sendWhatsAppMessage(fromNumber, botReply);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Error en webhook de WhatsApp:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Función para interactuar con OpenAI adaptada por ubicación y región
async function getOpenAIResponse(history, phoneNumber, clinic) {
  if (!openaiApiKey) {
    return `Hola, gracias por escribir a ${clinic.name}. ¿En qué podemos ayudarte hoy?`;
  }

  const systemPrompt = `Eres el asistente virtual experto de "${clinic.name}", ubicada en ${clinic.city}, ${clinic.country} (${clinic.address}). 
  Atendemos en el horario local de la sucursal. Ofrecemos servicios de limpieza dental, blanqueamiento, ortodoncia, endodoncia e implantes.
  Sé amable, profesional y conciso.
  
  CONTEXTO LEGAL Y PRIVACIDAD:
  Operas bajo las pautas de privacidad de ${clinic.country}. Antes de agendar, asegúrate de informar al paciente de manera amigable que sus datos serán tratados para la gestión de su cita conforme a las normativas locales aplicables, y pídele su conformidad.

  SI el usuario quiere agendar una cita y ya dio su consentimiento, pídele obligatoriamente su nombre completo, la fecha deseada (formato YYYY-MM-DD) y la hora (formato HH:MM). 
  Una vez que te dé esos datos, responde confirmando la cita y añade al final de tu respuesta un bloque oculto exactamente con este formato JSON:
  [BOOKING_DATA]{"customer_name": "Nombre", "customer_phone": "${phoneNumber}", "date": "YYYY-MM-DD", "start_time": "HH:MM"}[/BOOKING_DATA]`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    let replyText = data.choices?.[0]?.message?.content || `¡Hola! Bienvenido a ${clinic.name}. ¿En qué puedo ayudarte?`;

    // Detección automática para agendar y hacer fetch a la API interna
    const bookingMatch = replyText.match(/\[BOOKING_DATA\]([\s\S]*?)\[\/BOOKING_DATA\]/);
    
    if (bookingMatch) {
      try {
        const bookingJson = JSON.parse(bookingMatch[1]);
        
        const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://github-com-new-blond.vercel.app';
        const bookingResponse = await fetch(`${host}/api/public/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingJson)
        });

        const bookingResult = await bookingResponse.json();

        if (bookingResult.success) {
          replyText = replyText.replace(/\[BOOKING_DATA\][\s\S]*?\[\/BOOKING_DATA\]/, '').trim();
          replyText += "\n\n✅ ¡Listo! Tu cita ha quedado registrada correctamente en nuestro sistema.";
        } else {
          replyText = replyText.replace(/\[BOOKING_DATA\][\s\S]*?\[\/BOOKING_DATA\]/, '').trim();
          replyText += `\n\n⚠️ Hubo un detalle al agendar: ${bookingResult.error || 'El horario ya no está disponible.'}`;
        }
      } catch (parseErr) {
        console.error('Error procesando el JSON de reserva:', parseErr);
      }
    }

    return replyText;
  } catch (err) {
    console.error('Error con OpenAI:', err);
    return "Lo siento, tuve un pequeño problema técnico, pero ya estoy aquí. ¿Cómo te gustaría que te ayude?";
  }
}

// Función para enviar mensajes vía Meta WhatsApp API
async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;

  return await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
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
}
=======

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
      const from = message.from;
      const messageText = message.text ? message.text.body : '';

      if (!messageText) {
        return NextResponse.json({ status: 'ignored' }, { status: 200 });
      }

      console.log(`Mensaje recibido de ${from}: "${messageText}"`);

      // 1. Guardar mensaje del usuario en Supabase
      await saveMessageToSupabase(from, 'user', messageText);

      // 2. Obtener respuesta inteligente con historial
      const aiResponse = await getOpenAIResponseWithHistory(messageText, from);

      // 3. Guardar respuesta de la IA en Supabase
      await saveMessageToSupabase(from, 'assistant', aiResponse);

      // 4. Enviar respuesta al cliente por WhatsApp
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
  if (!supabase) return;

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

// Obtener historial desde Supabase
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
      console.error('Error obteniendo historial:', error);
      return [];
    }

    return data ? data.reverse().map(msg => ({ role: msg.role, content: msg.content })) : [];
  } catch (err) {
    console.error('Excepción al obtener historial:', err);
    return [];
  }
}

// OpenAI con historial
async function getOpenAIResponseWithHistory(userMessage, phoneNumber) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return '¡Hola! Sistema temporalmente en mantenimiento.';
  }

  const systemPrompt = {
    role: 'system',
    content: `
Eres el asistente virtual con Inteligencia Artificial de "Clínica Dental Elite".
Horarios: Lunes a Viernes de 9:00 AM a 7:00 PM, Sábados de 9:00 AM a 2:00 PM.
Servicios: Limpieza dental, Blanqueamiento, Ortodoncia, Endodoncia, Implantes y Valoración General.
Utiliza la información que el cliente te comparta previamente (como su nombre).
`
  };

  const history = await getChatHistory(phoneNumber, 10);
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
      return '¡Hola! Gracias por escribir a Clínica Dental Elite.';
    }
  } catch (error) {
    console.error('Error con OpenAI:', error);
    return 'Gracias por escribir a Clínica Dental Elite.';
  }
}

// Enviar mensaje por WhatsApp
async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) return;

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
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
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error);
  }
}
>>>>>>> 5d8cf4045fcf2142a3a51885a693116e750c9e37
