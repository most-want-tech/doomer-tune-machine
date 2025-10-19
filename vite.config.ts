import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { resolve } from 'path';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version?: string };

const appVersion = packageJson.version ?? "0.0.0";
const gitSha = process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_GIT_SHA__: JSON.stringify(gitSha),
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: resolve(projectRoot, 'tests/setup-vitest.ts'),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
