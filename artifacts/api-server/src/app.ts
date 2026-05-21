import express from "express";
import menuRouter from "./routes/menu";
import tabsRouter from "./routes/tabs";
import historyRouter from "./routes/history";

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://comandabar.up.railway.app",
    "https://elegant-contentment-production-3f0b.up.railway.app",
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.use("/api", menuRouter);
app.use("/api", tabsRouter);
app.use("/api", historyRouter);

export default app;