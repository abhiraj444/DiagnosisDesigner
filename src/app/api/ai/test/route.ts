import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { config = {} } = body;

    if (config.provider === 'custom') {
      let endpoint = (config.customEndpoint || '').trim();
      if (!endpoint) {
        return NextResponse.json({
          success: false,
          message: 'Custom LLM endpoint is empty. Please enter your endpoint URL.',
          latencyMs: Date.now() - startTime,
        });
      }

      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const key = config.customApiKey || config.apiKey;
      if (key) headers['Authorization'] = `Bearer ${key}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.customModel || 'gpt-4o',
          messages: [{ role: 'user', content: 'Respond with "READY"' }],
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({
          success: false,
          message: `Custom Endpoint returned HTTP ${res.status}: ${txt.slice(0, 200)}`,
          latencyMs,
          modelUsed: config.customModel || 'Custom',
        });
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || 'READY';
      return NextResponse.json({
        success: true,
        message: `Connected successfully (${latencyMs}ms): ${text.trim().slice(0, 50)}`,
        latencyMs,
        modelUsed: config.customModel || 'Custom',
      });
    }

    // Gemini
    const apiKey =
      config.geminiApiKey ||
      config.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'No Google Gemini API key found in Settings or server environment.',
        latencyMs: Date.now() - startTime,
        modelUsed: config.geminiModel || 'gemini-3.7-flash',
      });
    }

    const modelName = config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent('Respond with "READY"');
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Connection successful (${latencyMs}ms): ${result.response.text().trim().slice(0, 50)}`,
      latencyMs,
      modelUsed: modelName,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err?.message || 'Connection test failed.',
      latencyMs: Date.now() - startTime,
      modelUsed: 'Unknown',
    });
  }
}
