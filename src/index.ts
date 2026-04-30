import express, { type NextFunction, type Request, type Response } from "express";
import { chat } from "./veniceai.js";
import dotenv from "dotenv";
import { loadConfig } from "./config.js";
import { slowDown } from "express-slow-down";

dotenv.config();

const config = loadConfig();

const app = express();

app.set("trust proxy", 1);

const limiter = slowDown({
  delayAfter: 20,
  delayMs: (hits) => hits * 100,
  windowMs: 5 * 60 * 1000,
});

app.use(limiter);

class ServerError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ServerError";
    this.status = status;
  }
}

app.use(express.json());

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return next(new ServerError("Authentication required", 401));
  }

  const authHeaderValues = authHeader.split(" ");

  if (authHeaderValues.length !== 2) {
    return next(new ServerError("Invalid authentication", 401));
  }

  const [scheme, apiKey] = authHeaderValues;

  if (scheme !== "Bearer" || apiKey !== config.botineApiKey) {
    return next(new ServerError("Invalid authentication", 401));
  }

  next();
});

app.post("/api/v1/chat", async (req: Request, res: Response) => {
  const message = await chat(config, req.body.message);
  res.send(message);
});

app.use((err: ServerError, req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500);
  res.send({ error: err.message });
});

app.use((req: Request, res: Response) => {
  res.status(404);
  res.send({ error: "Not available" });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
