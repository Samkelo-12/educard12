// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * TanStack Start's preview-server-plugin looks for dist/server/server.js,
 * but the Nitro + Cloudflare build emits dist/server/index.mjs. Create a
 * thin ESM shim so prerender can find the server entry.
 */
function serverEntryShimPlugin(): import("vite").Plugin {
  return {
    name: "server-entry-shim",
    writeBundle(options: import("rollup").OutputOptions) {
      const dir = options.dir?.replace(/[/\\]+$/, "");
      if (dir && (dir.endsWith("/server") || dir.endsWith("\\server"))) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          join(dir, "server.js"),
          [
            'import entry from "./index.mjs";',
            "// Re-wrap in a plain Request: Nitro mutates request properties that",
            "// srvx's NodeRequest exposes as getter-only, which 500s the prerender.",
            "export default {",
            "  fetch(request, ...rest) {",
            "    const plain = new Request(request.url, {",
            "      method: request.method,",
            "      headers: request.headers,",
            "      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,",
            "      duplex: 'half',",
            "    });",
            "    const env = rest[0] ?? {",
            "      ASSETS: { fetch: () => new Response(null, { status: 404 }) },",
            "    };",
            "    const ctx = rest[1] ?? { waitUntil() {}, passThroughOnException() {} };",
            "    return entry.fetch(plain, env, ctx);",
            "  },",
            "};",
            "",
          ].join("\n"),
          "utf8",
        );
      }
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true },
  },
  vite: {
    plugins: [serverEntryShimPlugin()],
  },
});
