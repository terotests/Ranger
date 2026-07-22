import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import url from "node:url";
import { splineLibraryPlugin } from "./vite-plugin-library.mjs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue(), splineLibraryPlugin()],
  resolve: {
    alias: {
      "@tessellate": path.resolve(HERE, "../tessellate/spline_lathe.mjs"),
    },
  },
  server: {
    port: 5177,
    // Bind localhost only — library API can DELETE project folders.
    host: "localhost",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
