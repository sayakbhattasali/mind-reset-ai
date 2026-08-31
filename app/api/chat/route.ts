import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are Dr. Marcus, an empathetic, clinical somatic therapist for MindReset.
You are guiding a 90-second somatic reset.
RULES:
1. Keep every response to 1 or 2 concise, calming sentences (under 25 words total).
2. Always respond directly and warmly to what the user said, connecting gently back to their somatic state, breath, or releasing physical tension.
3. Do NOT use bullet points, lists, asterisks, markdown bolding, or emojis.
4. If the user indicates they feel better, want to finish, or are done, warmly congratulate them, thank them, and append [END_SESSION] at the very end.
`;

const SERVER_ERROR_MESSAGE = "I apologize, but I am unable to connect to the AI server right now. Wishing you peace and strength. [END_SESSION]";

function getGroqApiKey(): string {
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY.trim();
  }
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GROQ_API_KEY\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (e) {}
  return "";
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();
    const { messages = [], trigger = "General Distress", preScore = 5 } = body;

    // Direct opening line if history is empty
    if (!messages || messages.length === 0) {
      return new Response(`I'm right here with you. Let's calm this ${trigger} together. Take a slow, deep breath... and tell me how you feel.`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const lastUserMessage = messages.length > 0 && messages[messages.length - 1]?.role === "user"
      ? String(messages[messages.length - 1].content).trim()
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

    const groqApiKey = getGroqApiKey();

    // 1. FAST GROQ STREAMING
    if (groqApiKey) {
      const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
      const groq = new Groq({ apiKey: groqApiKey });

      for (const modelId of groqModels) {
        try {
          const stream = await groq.chat.completions.create({
            messages: [
              { role: "system", content: fullSystemPrompt },
              ...formattedHistory.map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            ],
            model: modelId,
            temperature: 0.5,
            max_tokens: 100,
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
              "X-AI-Provider": `groq-${modelId}`,
            },
          });
        } catch (groqErr: any) {
          console.error(`[API /api/chat] Groq ${modelId} error:`, groqErr?.message || groqErr);
        }
      }
    }

    // 2. NO WORKING API - APOLOGIZE AND END SESSION (NO HARCODED REPLIES)
    return new Response(SERVER_ERROR_MESSAGE, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Chat API Route Error:", err?.message || err);
    return new Response(SERVER_ERROR_MESSAGE, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
