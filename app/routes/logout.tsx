import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { deleteSession } from "~/services/auth.server";
import { getSessionId } from "~/services/session.server";

export async function loader() {
  return redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionId = getSessionId(request);
  if (sessionId) {
    await deleteSession(sessionId);
  }
  return redirect("/auth", {
    headers: {
      "Set-Cookie": "omnibridge-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}
