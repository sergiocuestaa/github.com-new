import { NextResponse } from 'next/server';

// 1. GET: Verificación del Webhook por parte de Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // El verify token por defecto configurado para la app
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'clinicadental123';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return new Response('Bad Request', { status: 400 });
}

// 2. POST: Recepción de mensajes entrantes de WhatsApp
export async function POST(request) {
  try {
    const body = await request.json();

    // Comprobar si es un evento de mensaje de WhatsApp
    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const messageObj = body.entry[0].changes[0].value.messages[0];
      const fromNumber = messageObj.from; // Número del cliente
      const messageText = messageObj.text?.body; // Texto enviado

      if (messageText) {
        console.log(`Mensaje recibido de ${fromNumber}: ${messageText}`);

        // Responder al usuario vía Meta API
        await sendWhatsAppMessage(fromNumber, `Hola, he recibido tu mensaje: "${messageText}". Estamos procesando tu consulta.`);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Función auxiliar para enviar mensajes con la API de Graph
async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error('Faltan variables de entorno WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID');
    return;
  }

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

  const responseData = await res.json();
  if (!res.ok) {
    console.error('Error enviando mensaje vía Meta API:', responseData);
  }
  return responseData;
}