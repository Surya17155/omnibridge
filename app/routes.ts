import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("/auth", "routes/auth.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("api/v1/chat/completions", "routes/api.v1.chat.completions.ts"),
  route("api/v1/models", "routes/api.v1.models.ts"),
  route("/dashboard", "routes/dashboard/layout.tsx", [
    index("routes/dashboard/home.tsx"),
    route("chat", "routes/dashboard/chat.tsx"),
    route("key-management", "routes/dashboard/key-management.tsx"),
    route("proxy-configuration", "routes/dashboard/proxy-configuration.tsx"),
    route("usage-logs", "routes/dashboard/usage-logs.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
