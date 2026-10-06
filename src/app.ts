import express from "express";
import linksRouter from "./routes/links";
import authRouter from "./routes/auth";
import collectionsRouter from "./routes/collections";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "LinkVault API is running!" });
});

app.use("/api/auth", authRouter);
app.use("/api/links", linksRouter);
app.use("/api/collections", collectionsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
