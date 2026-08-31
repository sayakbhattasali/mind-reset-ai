import { NextResponse } from "next/server";

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

    // 1. OpenAI High-Fidelity Neural TTS (onyx: Deep, authoritative, warm male clinician voice)
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (openAiApiKey) {
      try {
        const openAiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            voice: "onyx", // 'onyx' is a deep, resonant, warm male therapist voice
            input: cleanText,
            speed: 0.92, // Grounded, calming therapeutic cadence
          }),
        });

        if (openAiResponse.ok) {
          const audioBuffer = await openAiResponse.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
            },
          });
        } else {
          const errBody = await openAiResponse.text();
          console.warn("OpenAI TTS non-ok response:", openAiResponse.status, errBody);
        }
      } catch (openAiErr) {
        console.error("OpenAI TTS Request Failed:", openAiErr);
      }
    }

    // 2. ElevenLabs Fallback (if ELEVENLABS_API_KEY is configured)
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsApiKey) {
      try {
        const voiceId = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9"; // Deep male voice
        const elevenResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsApiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: cleanText,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.75,
                similarity_boost: 0.85,
              },
            }),
          }
        );

        if (elevenResponse.ok) {
          const audioBuffer = await elevenResponse.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
            },
          });
        }
      } catch (elevenErr) {
        console.error("ElevenLabs TTS Failed:", elevenErr);
      }
    }

    // If no external TTS key is configured or remote call failed, return 503 so client falls back gracefully
    return NextResponse.json(
      {
        error: "No server TTS provider configured (set OPENAI_API_KEY for OpenAI onyx male voice)",
        fallback: true,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("TTS Route Critical Error:", error);
    return NextResponse.json({ error: "Failed to generate speech", fallback: true }, { status: 500 });
  }
}
