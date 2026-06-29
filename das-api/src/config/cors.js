import cors from "cors";
import { env } from "./environment.js";

export const corsOptions = {
  origin: env.CLIENT_ORIGIN,
  credentials: true
};

export const corsMiddleware = cors(corsOptions);
