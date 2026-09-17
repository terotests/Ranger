import { defineConfig } from "vite";

/**
 * GitHub project site: https://terotests.github.io/Ranger/playground/
 *
 * The site root is the language's front page (landing/); the playground is
 * published under /playground/. Everything in src/ addresses its own files
 * through import.meta.env.BASE_URL, so this one line is the whole move.
 */
export default defineConfig({
  base: "/Ranger/playground/",
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
