import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
