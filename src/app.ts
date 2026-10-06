import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import linksRouter from "./routes/links";
import authRouter from "./routes/auth";
import collectionsRouter from "./routes/collections";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

// Tight limit on credential endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, try again later" },
});

// Loose general limit so normal use is unaffected
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "LinkVault API is running!" });
});

app.use("/api/auth", authRouter);
app.use("/api/links", linksRouter);
app.use("/api/collections", collectionsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
