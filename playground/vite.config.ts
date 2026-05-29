import { defineConfig } from "vite";

/** GitHub project site: https://terotests.github.io/Ranger/ */
export default defineConfig({
  base: "/Ranger/",
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
