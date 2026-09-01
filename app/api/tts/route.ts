import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";

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

    // Zero-key Neural Male Voice (en-US-ChristopherNeural: Deep, grounded, authoritative therapist)
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-ChristopherNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText, {
      rate: "-6%",
      pitch: "-3Hz",
    });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => resolve());
      audioStream.on("error", (err: Error) => reject(err));
    });

    const fullBuffer = Buffer.concat(chunks);

    return new NextResponse(fullBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": fullBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
