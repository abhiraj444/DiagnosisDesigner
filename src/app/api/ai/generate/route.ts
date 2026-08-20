import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for Vercel functions

const GEMINI_FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

function parseGoogleErrorMessage(err: any): { message: string; statusCode: number } {
  const raw = err?.message || String(err || '');
  const rawLower = raw.toLowerCase();

  if (rawLower.includes('api_key_invalid') || rawLower.includes('api key not valid') || rawLower.includes('invalid api key')) {
    return {
      message: 'Invalid Google Gemini API Key. Please verify your API key in Settings (or check GEMINI_API_KEY in your Vercel Environment Variables).',
      statusCode: 401,
    };
  }

  if (rawLower.includes('quota') || rawLower.includes('resource_exhausted') || rawLower.includes('429') || rawLower.includes('rate limit')) {
    return {
      message: 'Gemini API Rate Limit / Quota Exceeded (429). Please wait a moment before trying again or check your billing quota in Google AI Studio.',
      statusCode: 429,
    };
  }

  if (rawLower.includes('permission_denied') || rawLower.includes('403')) {
    return {
      message: 'Gemini API Permission Denied (403). Your API key does not have access to this feature or model.',
      statusCode: 403,
    };
  }

  if (rawLower.includes('not found') || rawLower.includes('404')) {
    return {
      message: `Gemini Model Not Found (404). ${raw}`,
      statusCode: 404,
    };
  }

  if (rawLower.includes('safety') || rawLower.includes('blocked') || rawLower.includes('harm_category')) {
    return {
      message: 'The AI request was filtered by safety policies. Please adjust or clarify the clinical phrasing.',
      statusCode: 422,
    };
  }

  if (rawLower.includes('service unavailable') || rawLower.includes('503') || rawLower.includes('overloaded')) {
    return {
      message: 'Google Gemini service is temporarily overloaded (503). Please retry in a few seconds.',
      statusCode: 503,
    };
  }

  return {
    message: raw.length > 300 ? raw.slice(0, 300) + '...' : raw,
    statusCode: 500,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, images = [], config = {} } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a text string.' }, { status: 400 });
    }

    // --- 1. Custom Provider Flow (OpenAI / OpenRouter / Groq / DeepSeek / Ollama) ---
    if (config.provider === 'custom') {
      let endpoint = (config.customEndpoint || '').trim();
      if (!endpoint) {
        return NextResponse.json(
          { error: 'Custom LLM endpoint is not configured. Please set your endpoint URL in Settings.' },
          { status: 400 }
        );
      }

      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const key = config.customApiKey || config.apiKey;
      if (key) {
        headers['Authorization'] = `Bearer ${key}`;
      }

      const contentParts: any[] = [{ type: 'text', text: prompt }];
      if (images && images.length > 0) {
        for (const img of images) {
          if (img.data) {
            if (img.mimeType.startsWith('image/')) {
              contentParts.push({
                type: 'image_url',
                image_url: {
                  url: `data:${img.mimeType};base64,${img.data}`,
                },
              });
            } else if (img.mimeType.startsWith('audio/')) {
              contentParts.push({
                type: 'input_audio',
                input_audio: {
                  data: img.data,
                  format: img.mimeType.replace('audio/', ''),
                },
              });
            }
          }
        }
      }

      const payload = {
        model: config.customModel || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: contentParts.length === 1 ? prompt : contentParts,
          },
        ],
        temperature: 0.2,
      };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          let parsedMsg = errText;
          try {
            const errJson = JSON.parse(errText);
            parsedMsg = errJson.error?.message || errJson.message || errText;
          } catch {
            // keep raw text
          }
          return NextResponse.json(
            {
              error: `Custom AI Endpoint Error (${res.status}): ${parsedMsg.slice(0, 300)}`,
              statusCode: res.status,
            },
            { status: res.status >= 400 && res.status < 600 ? res.status : 500 }
          );
        }

        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ text: replyText });
      } catch (fetchErr: any) {
        return NextResponse.json(
          {
            error: `Failed to connect to custom AI endpoint (${endpoint}): ${fetchErr?.message || 'Network error'}`,
          },
          { status: 502 }
        );
      }
    }

    // --- 2. Google Gemini Provider Flow ---
    const apiKey =
      config.geminiApiKey ||
      config.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Google Gemini API Key is missing. Please set your API key in Settings (or set GEMINI_API_KEY in your Vercel Project Environment Variables).',
        },
        { status: 400 }
      );
    }

    const requestedModel = config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
    const modelsToTry = [requestedModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== requestedModel)];

    const genAI = new GoogleGenerativeAI(apiKey);

    const parts: any[] = [prompt];
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.data) {
          parts.push({
            inlineData: {
              data: img.data,
              mimeType: img.mimeType || 'image/jpeg',
            },
          });
        }
      }
    }

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(parts);
        const responseText = result.response.text();
        return NextResponse.json({ text: responseText, modelUsed: modelName });
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || '').toLowerCase();
        // Only attempt fallback if the model was not found / 404
        if (errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('unsupported model')) {
          console.warn(`Model ${modelName} failed with 404, attempting fallback model...`);
          continue;
        }
        // For other errors (invalid API key, quota limit, etc.), fail immediately with accurate message
        break;
      }
    }

    const { message, statusCode } = parseGoogleErrorMessage(lastError);
    return NextResponse.json(
      {
        error: message,
        rawError: lastError?.message || String(lastError || ''),
      },
      { status: statusCode }
    );
  } catch (error: any) {
    console.error('Unhandled AI API Route Error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'An unexpected internal error occurred while processing the clinical question.',
      },
      { status: 500 }
    );
  }
}
