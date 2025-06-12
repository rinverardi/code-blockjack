import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  assetsInclude: ['**/*.bin'],
  build: {
    chunkSizeWarningLimit: 2048,
  },
  define: {
    "import.meta.env.MOCKED": process.env.MOCKED === "true",
  },
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      "@backend-deployments": path.resolve(__dirname, "../backend/deployments"),
      "@backend-types": path.resolve(__dirname, "../backend/types"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    port: 9000,
  },
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
