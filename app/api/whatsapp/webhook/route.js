import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { consultarDisponibilidad, crearAgendamiento } from '@/lib/ai-tools';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'startup_estonia_secret';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return NextResponse.json({ status: 'ignored' });
    }

    const fromPhone = message.from;
    const userText = message.text.body;
    const businessId = '00000000-0000-0000-0000-000000000001';

    const tools = [
      {
        type: 'function',
        function: {
          name: 'consultarDisponibilidad',
          description: 'Consulta los horarios libres para una fecha específica (YYYY-MM-DD).',
          parameters: {
            type: 'object',
            properties: {
              fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
            },
            required: ['fecha'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'crearAgendamiento',
          description: 'Agenda una cita cuando el cliente ha confirmado fecha, hora y su nombre.',
          parameters: {
            type: 'object',
            properties: {
              clienteNombre: { type: 'string', description: 'Nombre completo del cliente' },
              fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
              hora: { type: 'string', description: 'Hora en formato HH:MM (ej. 10:00)' },
            },
            required: ['clienteNombre', 'fecha', 'hora'],
          },
        },
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Eres el asistente de agendamiento. NUNCA inventes disponibilidad. Usa consultarDisponibilidad antes de ofrecer horarios.',
        },
        { role: 'user', content: userText },
      ],
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    let finalAnswer = responseMessage.content;

    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'consultarDisponibilidad') {
          const res = await consultarDisponibilidad(businessId, args.fecha);
          finalAnswer = `Horarios disponibles para el ${args.fecha}: ${res.horarios_disponibles.join(', ')}`;
        } else if (toolCall.function.name === 'crearAgendamiento') {
          const res = await crearAgendamiento({
            businessId,
            clienteNombre: args.clienteNombre,
            clienteTelefono: fromPhone,
            fecha: args.fecha,
            hora: args.hora,
          });
          finalAnswer = res.success
            ? `¡Cita confirmada con éxito para el ${args.fecha} a las ${args.hora}!`
            : `No se pudo agendar: ${res.message}`;
        }
      }
    }

    if (finalAnswer) {
      await fetch(`https://graph.facebook.com/v18.0/${value.metadata.phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fromPhone,
          text: { body: finalAnswer },
        }),
      });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}