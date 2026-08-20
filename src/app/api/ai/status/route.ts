import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const defaultModel = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

  return NextResponse.json({
    hasServerKey: hasGeminiKey,
    defaultModel,
    serverReady: true,
  });
}
