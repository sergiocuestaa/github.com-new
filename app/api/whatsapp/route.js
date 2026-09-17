import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const wamid = message.id;
    const phone = message.from;
    const userText = message.text.body;

    processMessageAsync(wamid, phone, userText);

    return NextResponse.json({ status: 'processing' }, { status: 200 });
  } catch (error) {
    console.error('Error en Webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processMessageAsync(wamid, phone, userText) {
  try {
    const { data: existingMsg } = await supabase
      .from('messages')
      .select('id')
      .eq('wamid', wamid)
      .maybeSingle();

    if (existingMsg) {
      console.log('Mensaje duplicado omitido:', wamid);
      return;
    }

    const { error: contactErr } = await supabase.from('contacts').upsert({ phone }, { onConflict: 'phone' });
    if (contactErr) console.error('Error guardando contacto:', contactErr.message);

    const { error: userMsgErr } = await supabase.from('messages').insert({
      wamid: wamid,
      phone: phone,
      role: 'user',
      content: userText,
    });
    if (userMsgErr) console.error('Error guardando mensaje de usuario:', userMsgErr.message);

    const { data: history, error: historyErr } = await supabase
      .from('messages')
      .select('role, content')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyErr) console.error('Error leyendo historial:', historyErr.message);

    const formattedHistory = (history || []).reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = {
      role: 'system',
      content: `Eres la asistente virtual experta de Software Visa Eesti / Clínica Dental Elite.

REGLAS DE INTERACCIÓN:
1. Tono profesional, empático y fluido. Habla de "tú" y sé amable.
2. Formato para WhatsApp: Da respuestas breves (máximo 2 párrafos cortos). La gente no lee textos largos. Usa emojis de manera limpia.
3. No saludes repetitivamente si la conversación ya está avanzada.

OBJETIVO PRINCIPAL:
- Responder dudas sobre tratamientos dentales (implantes, diseño de sonrisa, alineadores).
- Guiar sutilmente al paciente a calificar para agendar una cita de valoración presencial.
- Termina la mayoría de tus respuestas con una pregunta corta para mantener el interés del paciente.`,
    };

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...formattedHistory],
      }),
    });

    const aiData = await openAIRes.json();
    const gptReply =
      aiData.choices?.[0]?.message?.content ||
      'Disculpa, tuve un problema temporal procesando tu solicitud.';

    const { error: aiMsgErr } = await supabase.from('messages').insert({
      phone: phone,
      role: 'assistant',
      content: gptReply,
    });
    if (aiMsgErr) console.error('Error guardando respuesta IA:', aiMsgErr.message);

    await sendWhatsAppMessage(phone, gptReply);
  } catch (err) {
    console.error('Error en proceso asíncrono:', err);
  }
}

async function sendWhatsAppMessage(phone, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const res = await fetch(\`https://graph.facebook.com/v18.0/\${phoneId}/messages\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await res.json();
  console.log('Mensaje enviado a Meta:', data);
}
