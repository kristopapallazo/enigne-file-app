import express from "express";
import prisma from "../database/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

const formatCar = (car) => ({
  id: car.id,
  garage_id: car.garageId,
  client_id: car.clientId,
  plate: car.plate,
  brand: car.brand,
  model: car.model,
  year: car.year,
  created_at: car.createdAt,
  client_name: car.client?.name ?? null,
  client_phone: car.client?.phone ?? null,
});

// Get all cars for the authenticated garage
router.get("/", async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: { garageId: req.user.garageId },
      include: { client: true },
      orderBy: { plate: "asc" },
    });
    res.json(cars.map(formatCar));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get car by ID with history (only if belongs to authenticated garage)
router.get("/:id", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
      include: {
        client: true,
        workOrders: {
          where: { garageId: req.user.garageId },
          include: { employee: true },
          orderBy: { startDatetime: "desc" },
        },
      },
    });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    res.json({
      ...formatCar(car),
      workOrders: car.workOrders.map((wo) => ({
        id: wo.id,
        garage_id: wo.garageId,
        bill_number: wo.billNumber,
        car_id: wo.carId,
        client_id: wo.clientId,
        employee_id: wo.employeeId,
        start_datetime: wo.startDatetime,
        end_datetime: wo.endDatetime,
        total_cost: wo.totalCost,
        status: wo.status,
        notes: wo.notes,
        created_at: wo.createdAt,
        employee_name: wo.employee?.name ?? null,
      })),
    });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search cars by plate (only within authenticated garage)
router.get("/search/:plate", async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: {
        garageId: req.user.garageId,
        plate: { contains: req.params.plate, mode: "insensitive" },
      },
      include: { client: true },
    });
    res.json(cars.map(formatCar));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new car (automatically assigned to authenticated garage)
router.post("/", async (req, res) => {
  try {
    const { plate, brand, model, year, client_id } = req.body;
    if (!plate || !brand || !model || !client_id) {
      return res
        .status(400)
        .json({ error: "Plate, brand, model, and client are required" });
    }
    const car = await prisma.car.create({
      data: {
        garageId: req.user.garageId,
        plate: plate.toUpperCase(),
        brand,
        model,
        year: year ? Number(year) : null,
        clientId: Number(client_id),
      },
      include: { client: true },
    });
    res.status(201).json(formatCar(car));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update car (only if belongs to authenticated garage)
router.put("/:id", async (req, res) => {
  try {
    const { plate, brand, model, year, client_id } = req.body;
    if (!plate || !brand || !model || !client_id) {
      return res
        .status(400)
        .json({ error: "Plate, brand, model, and client are required" });
    }
    const existing = await prisma.car.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Car not found" });
    }
    const car = await prisma.car.update({
      where: { id: Number(req.params.id) },
      data: {
        plate: plate.toUpperCase(),
        brand,
        model,
        year: year ? Number(year) : null,
        clientId: Number(client_id),
      },
      include: { client: true },
    });
    res.json(formatCar(car));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete car (only if belongs to authenticated garage)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.car.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Car not found" });
    }
    await prisma.car.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Car deleted" });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
