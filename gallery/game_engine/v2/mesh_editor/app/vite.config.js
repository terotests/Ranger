import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@tessellate": path.resolve(HERE, "../tessellate/spline_lathe.mjs"),
    },
  },
  server: {
    port: 5177,
    host: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
