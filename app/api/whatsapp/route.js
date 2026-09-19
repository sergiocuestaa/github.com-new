import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'clinicadental123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token invalido' }, { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Imprimir el evento exacto recibido de Meta
    console.log("--- EVENTO RECIBIDO DE META ---");
    console.log(JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("No es un mensaje de texto entrante (puede ser confirmación de lectura/entrega)");
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const from = message.from;
    const text = message.text?.body;

    console.log(`Mensaje recibido de ${from}: "${text}"`);

    // Respuesta automatica temporal
    if (text) {
      await sendWhatsAppMessage(from, `¡Hola! Recibí tu mensaje: "${text}". Un asesor te responderá pronto.`);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.error("Error procesando webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error("Faltan variables WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en Vercel");
    return;
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await res.json();
  console.log("Respuesta de la API de WhatsApp:", JSON.stringify(data));
}
