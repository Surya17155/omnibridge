
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import colorSchemeApi from "@dazl/color-scheme/client?url";
import { ErrorBoundary as ErrorBoundaryRoot } from "~/components/error-boundary/error-boundary";
import { useColorScheme } from "@dazl/color-scheme/react";
import favicon from "/favicon.png";

import "./styles/reset.css";
import "./styles/global.css";
import "./styles/theme.css";

import { RouteLoadingIndicator } from "./blocks/__global/route-loading-indicator";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: favicon, type: "image/png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { rootCssClass, resolvedScheme } = useColorScheme();
  const baseUrl = (process.env.OMNIBRIDGE_PUBLIC_BASE_URL ?? "https://omnibridge-dev.vercel.app/api/v1").replace(/"/g, "\\\"");
  return (
    <html lang="en" suppressHydrationWarning className={rootCssClass} style={{ colorScheme: resolvedScheme }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <script src={colorSchemeApi} data-light-class="light-theme" data-dark-class="dark-theme"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__OMNIBRIDGE_BASE_URL__ = ${JSON.stringify(baseUrl)};`,
          }}
        />
        <Links />
      </head>
      <body>
        {children}
        <RouteLoadingIndicator />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export const ErrorBoundary = ErrorBoundaryRoot;
