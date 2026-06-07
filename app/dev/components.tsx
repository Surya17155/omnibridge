// A development-only route allowing Dazl to render component previews.

import "@dazl/component-gallery/styles.css";
export { default } from "@dazl/component-gallery/route";
export function clientLoader() {}
export function HydrateFallback() {}
