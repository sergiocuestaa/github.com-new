import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
  {
    type: 'function',
    function: {
      name: 'consultar_disponibilidad',
      description: 'Consulta los horarios disponibles para agendar una cita en una fecha determinada.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'La fecha para consultar en formato YYYY-MM-DD (ej. 2026-09-15)'
          }
        },
        required: ['date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'agendar_cita',
      description: 'Registra una nueva cita en el sistema con los datos del cliente.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Nombre completo del cliente' },
          customer_phone: { type: 'string', description: 'Número de teléfono del cliente con código de país' },
          date: { type: 'string', description: 'Fecha de la cita en formato YYYY-MM-DD' },
          start_time: { type: 'string', description: 'Hora de inicio de la cita en formato HH:MM (ej. 10:30)' }
        },
        required: ['customer_name', 'customer_phone', 'date', 'start_time']
      }
    }
  }
];

export async function POST(request) {
  try {
    const { messages } = await request.json();

    const systemPrompt = {
      role: 'system',
      content: `Eres la asistente virtual amigable, eficiente y profesional de la clínica/barbería.
Tu objetivo es ayudar a los clientes a consultar horarios y agendar sus citas.
Instrucciones clave:
1. Sé siempre amable y profesional.
2. Si el cliente pregunta por disponibilidad, usa la función 'consultar_disponibilidad'.
3. Para confirmar una cita, debes solicitar el nombre y número de teléfono del cliente.
4. Una vez tengas nombre, teléfono, fecha y hora, usa la función 'agendar_cita'.
5. La fecha actual del sistema es ${new Date().toISOString().split('T')[0]}.`
    };

    const fullMessages = [systemPrompt, ...messages];

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      tools: tools,
      tool_choice: 'auto'
    });

    let responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      fullMessages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResult;

        if (functionName === 'consultar_disponibilidad') {
          const res = await fetch(`http://localhost:3000/api/public/book?date=${functionArgs.date}`);
          functionResult = await res.json();
        } else if (functionName === 'agendar_cita') {
          const res = await fetch(`http://localhost:3000/api/public/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(functionArgs)
          });
          functionResult = await res.json();
        }

        fullMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(functionResult)
        });
      }

      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: fullMessages
      });

      return NextResponse.json({
        respuesta: secondResponse.choices[0].message.content
      });
    }

    return NextResponse.json({
      respuesta: responseMessage.content
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Error en el agente de IA", detail: err.message },
      { status: 500 }
    );
  }
}
