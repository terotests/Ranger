import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    globals: true,
    testTimeout: 10000,
    reporters: ["verbose"],
  },
});
