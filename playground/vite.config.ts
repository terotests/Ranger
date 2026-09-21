import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const playgroundDir = path.dirname(fileURLToPath(import.meta.url));
const rangerVersion = JSON.parse(
  fs.readFileSync(path.join(playgroundDir, "..", "package.json"), "utf8"),
).version as string;

/**
 * GitHub project site: https://terotests.github.io/Ranger/playground/
 *
 * The site root is the language's front page (landing/); the playground is
 * published under /playground/. Everything in src/ addresses its own files
 * through import.meta.env.BASE_URL, so this one line is the whole move.
 */
export default defineConfig({
  base: "/Ranger/playground/",
  define: {
    __RANGER_VERSION__: JSON.stringify(rangerVersion),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
