import { redirect } from "react-router";
import { getSession, getUserById } from "./auth.server";

export interface AuthUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/omnibridge-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/auth");
  }
  const session = await getSession(sessionId);
  if (!session) {
    throw redirect("/auth");
  }
  const user = await getUserById(session.user_id);
  if (!user) {
    throw redirect("/auth");
  }
  return user;
}

export async function optionalAuth(request: Request): Promise<AuthUser | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}
