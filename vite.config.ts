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
const fallbackEnv = { ASSETS: { fetch: async () => new Response("not found", { status: 404 }) } };
export default {
  fetch(request, env, ctx) {
    return handler.fetch(request, env ?? fallbackEnv, ctx ?? {});
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
