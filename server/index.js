import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./database/prisma.js";
import authRouter from "./routes/auth.js";
import clientsRouter from "./routes/clients.js";
import carsRouter from "./routes/cars.js";
import employeesRouter from "./routes/employees.js";
import workOrdersRouter from "./routes/workOrders.js";
import servicesRouter from "./routes/services.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : [/^http:\/\/localhost:\d+$/];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize database connection and start server
async function startServer() {
  try {
    await prisma.$connect();

    // Routes
    app.use("/api/auth", authLimiter, authRouter);
    app.use("/api/clients", clientsRouter);
    app.use("/api/cars", carsRouter);
    app.use("/api/employees", employeesRouter);
    app.use("/api/work-orders", workOrdersRouter);
    app.use("/api/services", servicesRouter);

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({ status: "OK", message: "Car Garage API is running" });
    });

    // Global error handler
    app.use((err, req, res, _next) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    });

    app.listen(PORT, () => {
      console.log(`🚗 Car Garage API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
