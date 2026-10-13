import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// The live eval costs money and needs the key, so it only runs with --mode eval (npm run eval)
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: mode === "eval" ? ["src/**/*.eval.test.ts"] : ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: mode === "eval" ? configDefaults.exclude : [...configDefaults.exclude, "src/**/*.eval.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
