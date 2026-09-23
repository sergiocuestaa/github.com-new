import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'gocuesta_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  
  return new Response('Forbidden', { status: 403 });
}

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

        const { data: clinicData } = await supabase
          .from('clinics')
          .select('*')
          .limit(1)
          .single();

        const clinicInfo = clinicData || {
          name: "GoCuesta Clinic",
          city: "Tallinn",
          country: "Estonia"
        };

        const { data: history } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('phone_number', fromNumber)
          .order('created_at', { ascending: false })
          .limit(10);

        const formattedHistory = (history || [])
          .reverse()
          .map(msg => ({ role: msg.role, content: msg.content }));

        await supabase.from('chat_messages').insert([
          { phone_number: fromNumber, role: 'user', content: messageText }
        ]);

        formattedHistory.push({ role: 'user', content: messageText });

        const botReply = await getOpenAIResponseWithTools(formattedHistory, fromNumber, clinicInfo, supabase);

        await supabase.from('chat_messages').insert([
          { phone_number: fromNumber, role: 'assistant', content: botReply }
        ]);

        await sendWhatsAppMessage(fromNumber, botReply);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Error en webhook de WhatsApp:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getOpenAIResponseWithTools(messagesHistory, phoneNumber, clinic, supabase) {
  if (!openaiApiKey) {
    return `¡Hola! ¿Qué tal? ¿En qué te puedo ayudar hoy?`;
  }

  const today = new Date();
  const fechaHoyStr = today.toISOString().split('T')[0];

  try {
    const { data: servicesData } = await supabase
      .from('services')
      .select('name, price, duration_minutes');

    const servicesText = servicesData && servicesData.length > 0
      ? servicesData.map(s => `- ${s.name} ($${s.price}, ${s.duration_minutes} mins)`).join('\n')
      : '- Limpieza Dental ($250)';

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('date, time, status')
      .gte('date', fechaHoyStr)
      .neq('status', 'cancelled');

    const bookedSlotsText = existingAppointments && existingAppointments.length > 0
      ? existingAppointments.map(app => `- ${app.date} a las ${app.time}`).join('\n')
      : 'Sin citas ocupadas por el momento.';

    const systemPrompt = `Eres la recepcionista humana de "${clinic.name}". Estás chateando por WhatsApp.
    
    REGLAS DE COMPORTAMIENTO HUMANO:
    - Escribe como una persona real en WhatsApp: mensajes cortos, cercanos, naturales, sin formato de robot.
    - HOY es estrictamente: ${fechaHoyStr}. Si te piden fechas futuras, calcúlalas bien en formato YYYY-MM-DD.
    - No hagas cuestionarios ni muchas preguntas a la vez. Ve fluyendo con la plática.
    - Cuando ya tengas clara la fecha, la hora y el nombre, ejecuta de inmediato la herramienta 'registrar_cita' y despídete natural.

    SERVICIOS:
    ${servicesText}

    CITAS YA OCUPADAS:
    ${bookedSlotsText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...messagesHistory
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "registrar_cita",
          description: `Registra una cita en Supabase. OBLIGATORIO: Usa la fecha actual (${fechaHoyStr}) o calcula el día exacto que pidió el cliente, pero el año DEBE ser estrictamente 2026 o superior.`,
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string", description: "Nombre de la persona" },
              service_name: { type: "string", description: "Servicio que solicitó" },
              date: { 
                type: "string", 
                description: `Fecha exacta de la cita en formato YYYY-MM-DD. Hoy es ${fechaHoyStr}.` 
              },
              start_time: { type: "string", description: "Hora en formato HH:MM (ej. 16:00)" }
            },
            required: ["customer_name", "service_name", "date", "start_time"]
          }
        }
      }
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
        tools: tools,
        tool_choice: "auto",
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const responseMessage = data.choices?.[0]?.message;

    if (responseMessage?.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'registrar_cita') {
        const args = JSON.parse(toolCall.function.arguments);

        let finalDate = args.date;
        if (!finalDate || finalDate.includes('2023') || finalDate.includes('2024') || finalDate.includes('2025')) {
          finalDate = fechaHoyStr; 
        }

        const { error: dbError } = await supabase.from('appointments').insert([
          {
            date: finalDate,
            time: args.start_time,
            duration_minutes: 30,
            price: 250.00,
            status: 'scheduled'
          }
        ]);

        if (!dbError) {
          return `¡Listo ${args.customer_name}! Ya te agendé para el ${finalDate} a las ${args.start_time}. ¡Por ahí te esperamos! 😊`;
        } else {
          console.error('Error en Supabase:', dbError);
          return `Oye ${args.customer_name}, tuve un pequeño detalle al guardar en el sistema, déjame checarlo un segundo.`;
        }
      }
    }

    return responseMessage?.content || `¡Hola! ¿Qué tal? ¿En qué te puedo ayudar?`;

  } catch (err) {
    console.error('Error OpenAI Tools:', err);
    return "Hola, discúlpame, se me trabó tantito el chat. ¿En qué estábamos?";
  }
}

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