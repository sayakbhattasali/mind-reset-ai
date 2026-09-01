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

    // Direct, zero-key Kokoro-82M Male Voice Endpoint (Voice: am_adam / am_michael)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch("https://api.kokorotts.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "kokoro",
          input: cleanText,
          voice: "am_adam", // Explicitly deep male voice
          response_format: "mp3",
          speed: 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get("Content-Type") || "";
        if (contentType.includes("audio") || contentType.includes("mpeg") || contentType.includes("wav") || contentType.includes("octet-stream")) {
          const audioBuffer = await response.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.byteLength.toString(),
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({ fallback: true }, { status: 503 });
  } catch {
    return NextResponse.json({ fallback: true }, { status: 500 });
  }
}
