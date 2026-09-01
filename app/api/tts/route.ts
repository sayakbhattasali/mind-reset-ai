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
      return NextResponse.json({ error: "Empty text" }, { status: 400 });
    }

    // Direct Zero-Key StreamElements Polly male voice REST stream (Voice: Brian)
    const encodedText = encodeURIComponent(cleanText);
    const pollyUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodedText}`;

    const response = await fetch(pollyUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://streamelements.com/",
      },
    });

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // High-Availability Fallback for long strings
    const ttsRes = await fetch("https://ttsmp3.com/makemp3_new.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ msg: cleanText, lang: "Brian", source: "ttsmp3" }).toString(),
    });

    if (ttsRes.ok) {
      const data = await ttsRes.json();
      if (data?.URL) {
        const audioRes = await fetch(data.URL);
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.byteLength.toString(),
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    }

    return NextResponse.json({ error: "TTS generation failed" }, { status: 502 });
  } catch (err) {
    console.error("TTS Server Route Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
