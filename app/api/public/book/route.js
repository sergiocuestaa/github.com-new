import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { phone_number, message } = await request.json();

    if (!phone_number || !message) {
      return NextResponse.json({ error: 'Faltan datos requeridos (phone_number o message)' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Guardar el mensaje manual en el historial de Supabase como 'assistant'
    await supabase.from('chat_messages').insert([
      { phone_number, role: 'assistant', content: message }
    ]);

    // 2. Enviar el mensaje directamente a través de Meta WhatsApp API
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneId) {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone_number,
          type: 'text',
          text: { body: message },
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        console.error('Error de la API de Meta WhatsApp:', errorDetail);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error enviando mensaje manual:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}