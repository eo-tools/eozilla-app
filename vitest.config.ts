import { defineConfig } from "vitest/config";
import * as path from "node:path";

// See https://vitest.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
