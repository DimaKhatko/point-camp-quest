import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  resolve: {
    // The `@` alias also comes from tsconfig paths; kept explicit so it
    // resolves even for tooling that doesn't read tsconfig.
    alias: {
      "@": `${process.cwd()}/src`,
    },
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    // Redirect TanStack Start's bundled SSR server entry to src/server.ts
    // (our error-wrapping handler). Nitro builds the server from this.
    tanstackStart({ server: { entry: "server" } }),
    // Build-only: produce a Vercel-compatible server bundle.
    ...(command === "build"
      ? [
          nitro({
            preset: "vercel",
            // firebase-admin and its google-cloud/grpc deps are CJS packages
            // that use __dirname and load .proto assets by path — they break
            // when bundled into the ESM function. traceDeps tells Nitro to keep
            // them external and copy the real packages (with their assets) into
            // the function's node_modules instead.
            traceDeps: ["firebase-admin"],
          }),
        ]
      : []),
    viteReact(),
  ],
}));
