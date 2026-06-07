import { getOmniKeyByValue, getUserById, type User } from "./auth.server";

export type ProxyAuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401; error: { message: string; type: string } };

export async function authenticateOmniKey(request: Request): Promise<ProxyAuthResult> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader) {
    return {
      ok: false,
      status: 401,
      error: { message: "Missing Authorization header. Use: Authorization: Bearer obai_sk_live_...", type: "auth_missing" },
    };
  }
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return {
      ok: false,
      status: 401,
      error: { message: "Authorization header must be: Bearer <omni_key>", type: "auth_format" },
    };
  }
  const value = match[1];
  if (!value.startsWith("obai_sk_live_")) {
    return {
      ok: false,
      status: 401,
      error: { message: "Invalid key format. OmniKey must start with obai_sk_live_", type: "auth_format" },
    };
  }
  const omni = await getOmniKeyByValue(value);
  if (!omni) {
    return {
      ok: false,
      status: 401,
      error: { message: "Invalid API key", type: "auth_invalid" },
    };
  }
  const user = await getUserById(omni.user_id);
  if (!user) {
    return {
      ok: false,
      status: 401,
      error: { message: "User not found for this API key", type: "auth_invalid" },
    };
  }
  return { ok: true, user };
}

export function openaiErrorResponse(status: number, type: string, message: string, code?: string) {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type,
        param: null,
        code: code ?? null,
      },
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
