/**
 * Provider-agnostic AI client.
 *
 * Any OpenAI-compatible chat-completions endpoint works (OpenAI, OpenRouter,
 * Groq, Together, Google AI Studio's compat endpoint, local Ollama). When no
 * key is configured the app stays fully functional in local extractive mode:
 * features that genuinely need a model report that clearly instead of
 * fabricating legal content.
 */

export type TextPart = { type: "text"; text: string };
export type ImagePart = { type: "image_url"; image_url: { url: string } };
export type ContentPart = TextPart | ImagePart;

export type AIMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "user"; content: ContentPart[] };

export class AIUnavailableError extends Error {
  constructor(message = "No AI provider is configured.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

export const aiConfig = {
  baseUrl: (process.env.AI_API_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
  key: process.env.AI_API_KEY || "",
  chatModel: process.env.AI_CHAT_MODEL || "gpt-4.1-mini",
  visionModel: process.env.AI_VISION_MODEL || process.env.AI_CHAT_MODEL || "gpt-4.1-mini",
  briefModel: process.env.AI_BRIEF_MODEL || process.env.AI_CHAT_MODEL || "gpt-4.1-mini",
};

export function aiConfigured() {
  return Boolean(aiConfig.key);
}

export function aiStatus() {
  return {
    configured: aiConfigured(),
    model: aiConfig.chatModel,
    visionModel: aiConfig.visionModel,
    baseUrl: aiConfig.baseUrl,
  };
}

type CompleteOptions = {
  model?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

async function complete(messages: AIMessage[], options: CompleteOptions = {}): Promise<string> {
  if (!aiConfigured()) throw new AIUnavailableError();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 90_000);
  try {
    const res = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.key}`,
      },
      body: JSON.stringify({
        model: options.model ?? aiConfig.chatModel,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2400,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`AI provider returned ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("The AI provider returned an empty response.");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export async function aiText(
  system: string,
  user: string,
  options: CompleteOptions = {},
): Promise<string> {
  return complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    options,
  );
}

export async function aiVision(
  system: string,
  prompt: string,
  imageDataUrls: string[],
  options: CompleteOptions = {},
): Promise<string> {
  const parts: ContentPart[] = imageDataUrls.map((url) => ({ type: "image_url", image_url: { url } }));
  parts.push({ type: "text", text: prompt });
  return complete([{ role: "system", content: system }, { role: "user", content: parts }], {
    ...options,
    model: options.model ?? aiConfig.visionModel,
    maxTokens: options.maxTokens ?? 2400,
  });
}

/** Parse JSON from a model response, tolerating code fences or prose wrappers. */
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Could not read the AI response as structured data.");
  }
}

export async function aiJson<T>(
  system: string,
  user: string,
  options: CompleteOptions = {},
): Promise<T> {
  const raw = await aiText(system, user, { ...options, json: true, temperature: 0.1 });
  return parseJsonLoose<T>(raw);
}

export const FABRICATION_RULES = `You are an academic support tool for Indian law students.
Absolute rules:
- Never invent case facts, citations, quotations, statute numbers, dates, judges, or holdings.
- Only state what is supported by the supplied source text or by well-established, verifiable law.
- If a field cannot be supported, write exactly "Not available in the supplied document." and list it under "missing".
- Distinguish official statutory text from your own explanation. Label explanations as educational.
- You do not give legal advice or predict case outcomes. This is study material.`;
