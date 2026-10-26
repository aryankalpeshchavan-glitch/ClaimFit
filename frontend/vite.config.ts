import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production build goes to ../app/web, which FastAPI serves at "/". In dev, /api is proxied to uvicorn on :8000.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "../app/web", emptyOutDir: true, sourcemap: false },
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  test: { environment: "node" },
});
