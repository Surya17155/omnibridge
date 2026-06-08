import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath) && !process.env.ENCRYPTION_KEY) {
  const raw = readFileSync(envPath, "utf-8");
  const m = raw.match(/^ENCRYPTION_KEY=(.+)$/m);
  if (m) process.env.ENCRYPTION_KEY = m[1].trim();
}

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
"process.env.OMNIBRIDGE_PUBLIC_BASE_URL": JSON.stringify(
    process.env.OMNIBRIDGE_PUBLIC_BASE_URL ?? "https://omnibridge-dev.vercel.app/api/v1"
  ),
  },
  ssr: {
    external: ["@libsql/client", "bcryptjs", "node:crypto"],
  },
});
