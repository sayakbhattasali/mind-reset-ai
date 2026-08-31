import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

const groqApiKey = process.env.GROQ_API_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

const groq = new Groq({ apiKey: groqApiKey });
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const SYSTEM_PROMPT = `
You are Dr. Marcus, an empathetic, clinical somatic therapist for MindReset.
You are guiding a 90-second somatic reset.
RULES:
1. Keep every response to 1 or 2 concise, calming sentences (under 25 words total).
2. Always respond directly and warmly to what the user said, connecting gently back to their somatic state, breath, or releasing physical tension.
3. Do NOT use bullet points, lists, asterisks, markdown bolding, or emojis.
4. If the user indicates they feel better, want to finish, or are done, warmly congratulate them, thank them, and append [END_SESSION] at the very end.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages = [], trigger = "General Distress", preScore = 5 } = body;

    // Direct opening line if history is empty
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        reply: `I'm right here with you. Let's calm this ${trigger} together. Take a slow, deep breath... and tell me how you feel.`,
        shouldEnd: false,
        provider: "opening_line",
      });
    }

    const lastUserMessage = messages.length > 0 && messages[messages.length - 1]?.role === "user"
      ? String(messages[messages.length - 1].content).toLowerCase()
      : "";

    const userWantsToEnd = /\b(end|stop|bye|goodbye|done|quit|finish|exit|wrap up|leave|i feel better|i'm good|i am good|thanks that helped)\b/i.test(lastUserMessage);

    let fullSystemPrompt = `${SYSTEM_PROMPT}\nPatient Context: Focus Target: "${trigger}", Urge Severity: ${preScore}/10.`;
    if (userWantsToEnd) {
      fullSystemPrompt += `\nInstruction: The patient is concluding the session. Warmly validate their grounding and append [END_SESSION] at the end.`;
    }

    const formattedHistory = messages
      .filter((m: any) => m && m.content && (m.role === "user" || m.role === "assistant"))
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).trim(),
      }));

    const encoder = new TextEncoder();

    // 1. FAST GROQ STREAMING (qwen/qwen3.8-27b ~400ms TTFT)
    if (groqApiKey) {
      try {
        const stream = await groq.chat.completions.create({
          messages: [
            { role: "system", content: fullSystemPrompt },
            ...formattedHistory.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
          model: "qwen/qwen3.8-27b",
          temperature: 0.5,
          max_tokens: 120,
          stream: true,
        });

        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              }
              controller.close();
            } catch (streamErr) {
              controller.error(streamErr);
            }
          },
        });

        return new Response(readableStream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-AI-Provider": "groq-qwen3.8-27b",
          },
        });
      } catch (groqErr: any) {
        console.warn("Groq streaming error:", groqErr?.message || groqErr);
      }
    }

    // 2. FALLBACK TO GEMINI STREAMING
    if (geminiApiKey) {
      try {
        const conversationTranscript = formattedHistory
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Dr. Marcus"}: ${m.content}`)
          .join("\n");

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${fullSystemPrompt}\n\nConversation Transcript:\n${conversationTranscript}\n\nDr. Marcus:`,
                },
              ],
            },
          ],
          config: {
            maxOutputTokens: 150,
            temperature: 0.55,
          },
        });

        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of responseStream) {
                if (chunk.text) {
                  controller.enqueue(encoder.encode(chunk.text));
                }
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(readableStream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-AI-Provider": "gemini-2.5-flash",
          },
        });
      } catch (geminiErr: any) {
        console.error("Gemini stream error:", geminiErr?.message || geminiErr);
      }
    }

    // 3. Fallback Response
    const fallbackText = "Take a slow, deep breath with me. Notice where your feet touch the ground, and let that tension soften.";
    return new Response(fallbackText, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Chat API Route Error:", err?.message || err);
    return new Response("I'm right here with you. Take a steady breath in, and slowly exhale.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

