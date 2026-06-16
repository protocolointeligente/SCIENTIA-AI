import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface GeminiPart { text: string }
interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string;
      history: { role: 'user' | 'assistant'; content: string }[];
      apiKey?: string;
    };

    const { message, history = [], apiKey } = body;

    // Key: env var takes priority, then client-supplied key
    const key = process.env.GEMINI_API_KEY ?? apiKey ?? '';

    if (!key) {
      return NextResponse.json(
        { error: 'no_key', reply: 'Configure sua chave do Google Gemini nas Configurações → Chaves de API para receber respostas da IA.' },
        { status: 200 }, // 200 so frontend shows the message gracefully
      );
    }

    // Build Gemini conversation history
    const geminiHistory: GeminiContent[] = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemPrompt = `Você é o Assistente Científico da SCIENTIA AI, uma plataforma de pesquisa acadêmica.
Você ajuda pesquisadores a analisar artigos científicos, comparar estudos, identificar lacunas de pesquisa e construir argumentos baseados em evidências.
Responda sempre em português brasileiro, de forma objetiva e baseada em evidências científicas.
Quando citar estudos, indique autor e ano. Seja conciso mas completo.`;

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        ...geminiHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({})) as { error?: { message?: string } };
      const msg = errBody?.error?.message ?? `Gemini respondeu com erro ${geminiRes.status}`;

      if (geminiRes.status === 400 && msg.includes('API_KEY')) {
        return NextResponse.json(
          { error: 'invalid_key', reply: 'Chave de API inválida. Verifique a chave do Google Gemini nas Configurações → Chaves de API.' },
          { status: 200 },
        );
      }

      return NextResponse.json({ error: msg, reply: `Erro ao conectar com a IA: ${msg}` }, { status: 200 });
    }

    const data = await geminiRes.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não recebi resposta da IA.';

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message, reply: `Erro interno: ${message}` }, { status: 200 });
  }
}
