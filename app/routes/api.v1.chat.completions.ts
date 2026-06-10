import type { ActionFunctionArgs } from "react-router";
import { authenticateOmniKey, openaiErrorResponse } from "~/services/proxy-auth.server";
import { handleChatCompletion, type ProxyChatRequest } from "~/services/proxy.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const auth = await authenticateOmniKey(request);
  if (!auth.ok) {
    return openaiErrorResponse(auth.status, auth.error.type, auth.error.message);
  }

  let body: ProxyChatRequest;
  try {
    body = await request.json();
  } catch {
    return openaiErrorResponse(400, "invalid_request_error", "Request body must be valid JSON", "parse_error");
  }

  const result = await handleChatCompletion(auth.user.id, body, "/api/v1/chat/completions");

  if (result instanceof Response) {
    return result;
  }

  if (!result.ok) {
    return result.response;
  }

  return new Response(JSON.stringify(result.response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
