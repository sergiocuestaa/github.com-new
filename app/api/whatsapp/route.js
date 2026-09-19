import { NextResponse } from 'next/server';

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
    await sendWhatsAppMessage(fromNumber, `Hola, he recibido tu mensaje: "${messageText}". Estamos procesando tu consulta.`);
  }
}
return NextResponse.json({ status: 'ok' }, { status: 200 });
} catch (error) {
return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
