import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Verificación del Webhook de Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
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
          .from('clinics')
          .select('*')
          .limit(1)
          .single();

        const clinicInfo = clinicData || {
          name: "Clínica Dental Elite",
          city: "Tallin",
          country: "Estonia",
          address: "Oficina Central"
        };

        // 2. Obtener historial previo de la conversación ANTES de insertar el nuevo mensaje
        const { data: history } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('phone_number', fromNumber)
          .order('created_at', { ascending: false })
          .limit(10);

        const formattedHistory = (history || [])
          .reverse()
          .map(msg => ({ role: msg.role, content: msg.content }));

        // 3. Guardar el mensaje entrante del usuario en Supabase
        await supabase.from('chat_messages').insert([
          { phone_number: fromNumber, role: 'user', content: messageText }
        ]);

        // Añadir el mensaje actual al historial que verá OpenAI
        formattedHistory.push({ role: 'user', content: messageText });

        // 4. Consultar respuesta con OpenAI pasando el historial completo y datos de la sucursal
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
async function getOpenAIResponse(messagesHistory, phoneNumber, clinic) {
  if (!openaiApiKey) {
    return `Hola, gracias por escribir a ${clinic.name}. ¿En qué podemos ayudarte hoy?`;
  }

  const fechaHoy = new Date().toISOString().split('T')[0];

  const systemPrompt = `Eres el asistente virtual experto de "${clinic.name}", ubicada en ${clinic.city}, ${clinic.country} (${clinic.address}). 
  LA FECHA DE HOY ES: ${fechaHoy}. Ten en cuenta estrictamente esta fecha actual para validar cualquier día, año o cita que solicite el usuario (no inventes años pasados ni futuros lejanos).
  Atendemos en el horario local de la sucursal. Ofrecemos servicios de limpieza dental, blanqueamiento, ortodoncia, endodoncia e implantes.
  Sé amable, profesional y conciso. RECUERDA SIEMPRE EL NOMBRE DEL USUARIO Y EL CONTEXTO DE LA CONVERSACIÓN PREVIA.
  
  CONTEXTO LEGAL Y PRIVACIDAD:
  Operas bajo las pautas de privacidad de ${clinic.country}. Antes de agendar, asegúrate de informar al paciente de manera amigable que sus datos serán tratados para la gestión de su cita conforme a las normativas locales aplicables, y pídele su conformidad.

  SI el usuario quiere agendar una cita y ya dio su consentimiento, pídele obligatoriamente su nombre completo, la fecha deseada (formato YYYY-MM-DD) y la hora (formato HH:MM). 
  Una vez que te dé esos datos, responde confirmando la cita y añade al final de tu respuesta un bloque oculto exactamente con este formato JSON:
  [BOOKING_DATA]{"customer_name": "Nombre", "customer_phone": "${phoneNumber}", "date": "YYYY-MM-DD", "start_time": "HH:MM"}[/BOOKING_DATA]`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...messagesHistory
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