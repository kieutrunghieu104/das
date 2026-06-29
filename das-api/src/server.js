import express from "express";
import helmet from "helmet";
import adminRoutes from "./routers/adminRoutes.js";
import appointmentRoutes from "./routers/appointmentRoutes.js";
import authRoutes from "./routers/authRoutes.js";
import clinicalRoutes from "./routers/clinicalRoutes.js";
import { corsMiddleware } from "./config/cors.js";
import { env } from "./config/environment.js";
import { connectMongoDB } from "./config/mongodb.js";
import patientRoutes from "./routers/patientRoutes.js";
import publicRoutes from "./routers/publicRoutes.js";
import receptionRoutes from "./routers/receptionRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));

app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await connectMongoDB();

  return app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  try {
    await startServer();
  } catch (_error) {
    process.exit(1);
  }
}
