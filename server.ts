import express from "express";
import path from "path";
import dotenv from "dotenv";
import { apiRouter } from "./server/api";

dotenv.config();

const app = express();
const PORT = (() => {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  return process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
})();

app.use(express.json());
app.use(apiRouter);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  async function startServer() {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { port: 0 }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  startServer();
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;
