// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// The Cloudflare adapter's default export reads env.ASSETS at request time.
// Vite's preview-server (used by SPA prerender) calls fetch() with no env,
// which crashes before our SSR wrapper runs. This shim wraps the real handler
// and provides a fallback env so prerender can hit SSR successfully.
export default defineConfig({
  tanstackStart: {
    //server: { entry: "server" },
    spa: { enabled: true },
  },
  vite: {
    plugins: [
      {
        name: "preview-server-entry-shim",
        apply: "build",
        closeBundle() {
          const src = resolve(process.cwd(), "dist/server/index.mjs");
          const dest = resolve(process.cwd(), "dist/server/server.js");
          if (!existsSync(src) || existsSync(dest)) return;
          const shim = `import handler from "./index.mjs";
const noop = () => {};
const fallbackEnv = { ASSETS: { fetch: async () => new Response("not found", { status: 404 }) } };
const fallbackCtx = { context: { waitUntil: noop, passThroughOnException: noop }, waitUntil: noop, passThroughOnException: noop };
// Vite's preview-server (used by SPA prerender) passes a plain web Request whose
// properties are read-only. The Cloudflare adapter mutates request.ip, so wrap
// it in a Proxy that swallows writes to unknown properties.
function wrapRequest(req) {
  const extras = {};
  return new Proxy(req, {
    get(target, prop) {
      if (prop in extras) return extras[prop];
      const value = Reflect.get(target, prop);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(_target, prop, value) { extras[prop] = value; return true; },
    has(target, prop) { return prop in extras || prop in target; },
  });
}
export default {
  fetch(request, env, ctx) {
    return handler.fetch(wrapRequest(request), env ?? fallbackEnv, ctx ?? fallbackCtx);
  },
};
`;
          try {
            writeFileSync(dest, shim, "utf8");
          } catch {}
        },
      },
    ],
  },
});
