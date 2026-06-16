import express from "express";
import { apiRouter } from "../server/api";

export const maxDuration = 60;

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  // Fix for Vercel req.url if it strips /api
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  next();
});

app.use(apiRouter);

app.use('*', (req, res) => {
  res.status(404).json({ error: "API route not found: " + req.url });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}

