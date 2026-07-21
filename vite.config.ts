// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    //server: { entry: "server" },
    spa: { enabled: true },
  },
  vite: {
    plugins: [
      {
        name: "alias-server-entry-for-preview",
        apply: "build",
        closeBundle() {
          const src = resolve(process.cwd(), "dist/server/index.mjs");
          const dest = resolve(process.cwd(), "dist/server/server.js");
          if (existsSync(src) && !existsSync(dest)) {
            try {
              copyFileSync(src, dest);
            } catch {}
          }
        },
      },
    ],
  },
});
