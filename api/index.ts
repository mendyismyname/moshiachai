import express from "express";
import { apiRouter } from "../server/api";

export const maxDuration = 60;

const app = express();
app.use(express.json());
app.use(apiRouter);

export default app;
