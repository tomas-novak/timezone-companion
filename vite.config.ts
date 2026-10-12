import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Serves api/parse-time.ts in `npm run dev`, so local work needs no Vercel CLI
function apiDev(mode: string): Plugin {
  return {
    name: "api-dev",
    apply: "serve",
    configureServer(server) {
      for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ""))) process.env[k] ??= v;
      server.middlewares.use("/api/parse-time", async (req, res) => {
        try {
          if (req.method !== "POST") {
            res.statusCode = 405;
            return void res.end();
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const mod = await server.ssrLoadModule("/api/parse-time.ts");
          const response: Response = await mod.POST(
            new Request("http://localhost/api/parse-time", {
              method: "POST",
              // sec-fetch-site carries the handler's cross-site guard, so dev must forward it too
              headers: {
                "content-type": String(req.headers["content-type"] ?? "application/json"),
                "sec-fetch-site": String(req.headers["sec-fetch-site"] ?? ""),
              },
              body: Buffer.concat(chunks),
            }),
          );
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          console.error(err);
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), apiDev(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
