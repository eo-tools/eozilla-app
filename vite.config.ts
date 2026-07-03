import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react-swc";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version?: string };

const appVersion = packageJson.version ?? "0.0.0";
const buildNumber =
  process.env.VITE_BUILD_NUMBER ??
  process.env.BUILD_NUMBER ??
  getBuildNumberSinceLatestPublicRelease();

function getBuildNumberSinceLatestPublicRelease(): string {
  try {
    const tags = execFileSync(
      "git",
      ["tag", "--merged", "HEAD", "--sort=-creatordate"],
      { encoding: "utf8" },
    )
      .split(/\r?\n/)
      .map((tag) => tag.trim())
      .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));

    const latestPublicReleaseTag = tags[0];

    if (!latestPublicReleaseTag) {
      return "0";
    }

    return execFileSync(
      "git",
      ["rev-list", `${latestPublicReleaseTag}..HEAD`, "--count"],
      { encoding: "utf8" },
    ).trim();
  } catch {
    return "0";
  }
}

// See https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_BUILD_NUMBER": JSON.stringify(buildNumber),
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
      "react-dom": fileURLToPath(
        new URL("./node_modules/react-dom", import.meta.url),
      ),
      "react/jsx-runtime": fileURLToPath(
        new URL("./node_modules/react/jsx-runtime.js", import.meta.url),
      ),
    },
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    globals: true,
  },
});
