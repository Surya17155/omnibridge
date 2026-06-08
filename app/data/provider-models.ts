export type SubModel = {
  id: string;
  label: string;
  free: boolean;
  category: "fast" | "balanced" | "reasoning" | "vision";
};

export const PROVIDER_SUB_MODELS: Record<string, SubModel[]> = {
  Groq: [
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", free: true, category: "fast" },
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", free: true, category: "balanced" },
    { id: "llama-3.1-70b-versatile", label: "Llama 3.1 70B Versatile", free: true, category: "balanced" },
    { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", free: true, category: "balanced" },
  ],
  OpenRouter: [
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini (OpenAI)", free: false, category: "balanced" },
    { id: "openai/gpt-4o", label: "GPT-4o (OpenAI)", free: false, category: "balanced" },
    { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Anthropic)", free: false, category: "reasoning" },
    { id: "google/gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Exp (Google)", free: true, category: "fast" },
    { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct (Meta)", free: true, category: "balanced" },
    { id: "deepseek/deepseek-chat", label: "DeepSeek V3 (DeepSeek)", free: true, category: "reasoning" },
    { id: "nvidia/nemotron-3-ultra", label: "Nemotron 3 Ultra (Nvidia)", free: true, category: "reasoning" },
  ],
  GitHub: [
    { id: "gpt-4o-mini", label: "GPT-4o mini (OpenAI)", free: true, category: "fast" },
    { id: "gpt-4o", label: "GPT-4o (OpenAI)", free: true, category: "balanced" },
    { id: "DeepSeek-R1", label: "DeepSeek R1 (DeepSeek)", free: true, category: "reasoning" },
    { id: "Phi-4-multimodal-instruct", label: "Phi-4 Multimodal (Microsoft)", free: true, category: "balanced" },
    { id: "Mistral-large-2407", label: "Mistral Large (Mistral AI)", free: true, category: "balanced" },
    { id: "AI21-Jamba-1.5-Mini", label: "Jamba 1.5 Mini (AI21)", free: true, category: "fast" },
    { id: "Cohere-command-r-plus-08-2024", label: "Command R+ (Cohere)", free: true, category: "balanced" },
    { id: "Meta-Llama-3.1-8B-Instruct", label: "Llama 3.1 8B (Meta)", free: true, category: "fast" },
    { id: "Meta-Llama-3.1-70B-Instruct", label: "Llama 3.1 70B (Meta)", free: true, category: "balanced" },
    { id: "Meta-Llama-3.1-405B-Instruct", label: "Llama 3.1 405B (Meta)", free: true, category: "reasoning" },
  ],
  Cerebras: [
    { id: "llama-3.3-70b", label: "Llama 3.3 70B", free: true, category: "balanced" },
    { id: "llama-3.1-8b", label: "Llama 3.1 8B", free: true, category: "fast" },
    { id: "llama-3.1-70b", label: "Llama 3.1 70B", free: true, category: "balanced" },
  ],
  Cohere: [
    { id: "command-r-plus-08-2024", label: "Command R+", free: true, category: "balanced" },
    { id: "command-r-08-2024", label: "Command R", free: true, category: "balanced" },
    { id: "command-a-03-2025", label: "Command A", free: true, category: "reasoning" },
  ],
  Cloudflare: [
    { id: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B (Meta)", free: true, category: "fast" },
    { id: "@cf/meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B (Meta)", free: true, category: "balanced" },
    { id: "@cf/meta/llama-3.2-3b-instruct", label: "Llama 3.2 3B (Meta)", free: true, category: "fast" },
    { id: "@cf/mistral/mistral-7b-instruct-v0.3", label: "Mistral 7B (Mistral)", free: true, category: "fast" },
    { id: "@hf/google/gemma-2-2b-it", label: "Gemma 2 2B (Google)", free: true, category: "fast" },
    { id: "@hf/cohere/command-r-plus", label: "Command R+ (Cohere)", free: true, category: "balanced" },
  ],
  ZAI: [
    { id: "gpt-4o-mini", label: "GPT-4o mini (OpenAI)", free: true, category: "fast" },
    { id: "gpt-4o", label: "GPT-4o (OpenAI)", free: true, category: "balanced" },
    { id: "deepseek-r1", label: "DeepSeek R1", free: true, category: "reasoning" },
    { id: "meta-llama-3.1-70b", label: "Llama 3.1 70B (Meta)", free: true, category: "balanced" },
    { id: "qwen-2.5-72b", label: "Qwen 2.5 72B", free: true, category: "balanced" },
  ],
  Kilo: [
    { id: "gpt-4o", label: "GPT-4o (OpenAI)", free: true, category: "balanced" },
    { id: "gpt-4o-mini", label: "GPT-4o mini (OpenAI)", free: true, category: "fast" },
    { id: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Anthropic)", free: true, category: "reasoning" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Google)", free: true, category: "fast" },
    { id: "meta-llama-3.3-70b", label: "Llama 3.3 70B (Meta)", free: true, category: "balanced" },
    { id: "deepseek-r1", label: "DeepSeek R1", free: true, category: "reasoning" },
  ],
  Pollinations: [
    { id: "openai", label: "OpenAI (ChatGPT)", free: true, category: "balanced" },
    { id: "openai-large", label: "OpenAI Large", free: true, category: "balanced" },
    { id: "mistral", label: "Mistral", free: true, category: "fast" },
    { id: "llama", label: "Llama (Meta)", free: true, category: "balanced" },
    { id: "search", label: "Search mode", free: true, category: "balanced" },
  ],
  OpenCode: [
    { id: "default", label: "Default", free: true, category: "balanced" },
  ],
  Nvidia: [
    { id: "meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B (Meta)", free: true, category: "fast" },
    { id: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B (Meta)", free: true, category: "balanced" },
    { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B (Meta)", free: true, category: "balanced" },
    { id: "meta/llama-3.2-3b-instruct", label: "Llama 3.2 3B (Meta)", free: true, category: "fast" },
    { id: "meta/llama-3.2-11b-vision-instruct", label: "Llama 3.2 11B Vision (Meta)", free: true, category: "vision" },
    { id: "meta/llama-3.2-90b-vision-instruct", label: "Llama 3.2 90B Vision (Meta)", free: true, category: "vision" },
    { id: "mistralai/mixtral-8x7b-instruct-v0.1", label: "Mixtral 8x7B (Mistral)", free: true, category: "balanced" },
    { id: "mistralai/ministral-14b-instruct-2512", label: "Ministral 14B (Mistral)", free: true, category: "balanced" },
    { id: "microsoft/phi-4-mini-instruct", label: "Phi-4 Mini (Microsoft)", free: true, category: "fast" },
    { id: "google/gemma-2-2b-it", label: "Gemma 2 2B (Google)", free: true, category: "fast" },
    { id: "google/gemma-3n-e2b-it", label: "Gemma 3n 8B (Google)", free: true, category: "fast" },
    { id: "google/gemma-3n-e4b-it", label: "Gemma 3n 16B (Google)", free: true, category: "balanced" },
    { id: "qwen/qwen3.5-122b-a10b", label: "Qwen3.5 122B (Qwen)", free: true, category: "reasoning" },
    { id: "qwen/qwen3-next-80b-a3b-instruct", label: "Qwen3 80B (Qwen)", free: true, category: "balanced" },
    { id: "qwen/qwen3.5-397b-a17b", label: "Qwen3.5 397B (Qwen)", free: true, category: "reasoning" },
    { id: "bytedance/seed-oss-36b-instruct", label: "Seed OSS 36B (ByteDance)", free: true, category: "balanced" },
    { id: "abacusai/dracarys-llama-3.1-70b-instruct", label: "Dracarys 70B (AbacusAI)", free: true, category: "balanced" },
    { id: "moonshotai/kimi-k2.6", label: "Kimi K2.6 (Moonshot)", free: true, category: "reasoning" },
    { id: "sarvamai/sarvam-m", label: "Sarvam M (SarvamAI)", free: true, category: "balanced" },
    { id: "stepfun-ai/step-3.5-flash", label: "Step 3.5 Flash (StepFun)", free: true, category: "fast" },
    { id: "stepfun-ai/step-3.7-flash", label: "Step 3.7 Flash (StepFun)", free: true, category: "fast" },
    { id: "stockmark/stockmark-2-100b-instruct", label: "Stockmark 2 100B", free: true, category: "balanced" },
    { id: "upstage/solar-10.7b-instruct", label: "Solar 10.7B (Upstage)", free: true, category: "fast" },
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B (OpenAI)", free: true, category: "reasoning" },
    { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B (OpenAI)", free: true, category: "balanced" },
    { id: "nvidia/nvidia-nemotron-nano-9b-v2", label: "Nemotron Nano 9B (Nvidia)", free: true, category: "fast" },
    { id: "nvidia/nemotron-mini-4b-instruct", label: "Nemotron Mini 4B (Nvidia)", free: true, category: "fast" },
    { id: "nvidia/nemotron-3-nano-30b-a3b", label: "Nemotron 3 Nano 30B (Nvidia)", free: true, category: "balanced" },
    { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", label: "Nemotron 3 Nano Omni 30B (Nvidia)", free: true, category: "reasoning" },
    { id: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron 3 Super 120B (Nvidia)", free: true, category: "reasoning" },
    { id: "nvidia/llama-3.3-nemotron-super-49b-v1.5", label: "Nemotron Super 49B (Nvidia)", free: true, category: "reasoning" },
    { id: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1", label: "Nemotron Nano VL 8B (Nvidia)", free: true, category: "vision" },
    { id: "nvidia/nemotron-nano-12b-v2-vl", label: "Nemotron Nano VL 12B (Nvidia)", free: true, category: "vision" },
  ],
};

export function getProviderModels(provider: string): SubModel[] {
  return PROVIDER_SUB_MODELS[provider] || [];
}

export function hasSubModels(provider: string): boolean {
  return provider in PROVIDER_SUB_MODELS;
}

export function getDefaultModel(provider: string): string {
  const models = PROVIDER_SUB_MODELS[provider];
  return models?.[0]?.id || "";
}

export function getModelById(provider: string, modelId: string): SubModel | undefined {
  return PROVIDER_SUB_MODELS[provider]?.find((m) => m.id === modelId);
}