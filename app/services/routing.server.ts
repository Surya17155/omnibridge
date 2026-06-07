import { isVisionCapable, type ChatMessage, type ProviderName } from "./llm.server";

export type RoutingTarget = ProviderName | "OmniBridge";

export type RoutingDecision = {
  target: RoutingTarget;
  reason: string;
};

export const CODE_KEYWORDS = [
  "code",
  "function",
  "python",
  "javascript",
  "typescript",
  "react",
  "api",
  "bug",
  "error",
  "fix",
  "refactor",
  "algorithm",
  "sort",
  "async",
  "await",
  "class",
  "stack trace",
  "regex",
  "sql",
  "compile",
];

export const FAST_KEYWORDS = [
  "fast",
  "quick",
  "rapid",
  "brief",
  "short",
  "summary",
  "summarize",
  "simple",
  "one-liner",
  "tldr",
];

export function decideRouting(
  userMessage: ChatMessage,
  availableProviders: ProviderName[]
): RoutingDecision {
  const text = userMessage.content.toLowerCase();

  if (userMessage.imageDataUrl) {
    const vision = availableProviders.filter((p) => isVisionCapable(p));
    if (vision.includes("Gemini")) {
      return { target: "Gemini", reason: "Image attached — routed to Gemini (vision-capable)" };
    }
    if (vision.includes("OpenAI")) {
      return { target: "OpenAI", reason: "Image attached — routed to OpenAI (vision-capable)" };
    }
    return { target: "OmniBridge", reason: "Image attached but no vision provider available" };
  }

  if (CODE_KEYWORDS.some((k) => text.includes(k)) && availableProviders.includes("DeepSeek")) {
    return { target: "DeepSeek", reason: "Code-related query — routed to DeepSeek" };
  }

  if (FAST_KEYWORDS.some((k) => text.includes(k)) && availableProviders.includes("Groq")) {
    return { target: "Groq", reason: "Speed-focused query — routed to Groq (fast inference)" };
  }

  if (availableProviders.includes("Gemini")) {
    return { target: "Gemini", reason: "Default model — routed to Gemini" };
  }

  if (availableProviders.length > 0) {
    return { target: availableProviders[0], reason: `Routed to ${availableProviders[0]} (default fallback)` };
  }

  return { target: "OmniBridge", reason: "No provider keys available" };
}
