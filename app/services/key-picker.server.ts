import type { ProviderKey } from "./auth.server";
import type { ProviderName } from "./llm.server";

export type KeyScore = {
  key: ProviderKey;
  score: number;
};

function isUsable(k: ProviderKey): boolean {
  if (k.status !== "active") return false;
  if (k.quota_remaining === -1) return true;
  return k.quota_remaining > 0;
}

function keyScore(k: ProviderKey): number {
  if (k.quota_remaining === -1) return Number.POSITIVE_INFINITY;
  return k.quota_remaining;
}

/**
 * Build the candidate order: target provider first (best key first), then every
 * other available provider in availability order. Within each provider, keys are
 * sorted by remaining quota (unlimited wins), so we exhaust the same provider's
 * keys before falling back to the next provider.
 */
export function buildCandidateKeys(
  allKeys: ProviderKey[],
  target: ProviderName,
  availableOrder: ProviderName[]
): ProviderKey[] {
  const providers: ProviderName[] = [target];
  for (const p of availableOrder) {
    if (!providers.includes(p)) providers.push(p);
  }
  const out: ProviderKey[] = [];
  for (const p of providers) {
    const cands = allKeys
      .filter((k) => (k.provider as ProviderName) === p && isUsable(k))
      .sort((a, b) => keyScore(b) - keyScore(a));
    out.push(...cands);
  }
  return out;
}

/**
 * True if the upstream response looks like a transient error we should retry
 * with another key: 401/403, rate-limit, or 5xx.
 */
export function isTransientUpstreamError(response: { status: number; rateLimited?: boolean; error?: string }): boolean {
  if (response.rateLimited) return true;
  if (response.status === 401 || response.status === 403) return true;
  if (response.status >= 500 && response.status < 600) return true;
  const msg = (response.error || "").toLowerCase();
  if (response.status >= 400 && response.status < 500 && (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("authentication"))) {
    return true;
  }
  return false;
}
