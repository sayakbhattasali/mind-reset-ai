import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    const cleanText = text
      .replace(/\[END_SESSION\]/g, "")
      .replace(/[*_#`]/g, "")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: "Empty text after sanitization" }, { status: 400 });
    }

    // 1. Direct HTTPS REST Audio Stream (Under 150ms latency, Zero-Key, Vercel Serverless Ready)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    try {
      const encodedText = encodeURIComponent(cleanText.substring(0, 200));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength.toString(),
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
          },
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
    }

    // 2. Secondary Serverless REST Pipeline (HuggingFace Inference)
    try {
      const hfController = new AbortController();
      const hfTimeout = setTimeout(() => hfController.abort(), 1200);

      const hfResponse = await fetch("https://api-inference.huggingface.co/models/facebook/mms-tts-eng", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: cleanText }),
        signal: hfController.signal,
      });

      clearTimeout(hfTimeout);

      if (hfResponse.ok) {
        const audioBuffer = await hfResponse.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.byteLength.toString(),
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
          },
        });
      }
    } catch {}

    return NextResponse.json({ fallback: true }, { status: 503 });
  } catch {
    return NextResponse.json({ fallback: true }, { status: 500 });
  }
}
