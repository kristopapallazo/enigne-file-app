import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/init.js";
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
app.use(cors());
app.use(express.json());

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();

    // Routes
    app.use("/api/auth", authRouter);
    app.use("/api/clients", clientsRouter);
    app.use("/api/cars", carsRouter);
    app.use("/api/employees", employeesRouter);
    app.use("/api/work-orders", workOrdersRouter);
    app.use("/api/services", servicesRouter);

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({ status: "OK", message: "Car Garage API is running" });
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

