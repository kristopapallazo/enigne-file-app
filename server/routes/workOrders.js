import express from "express";
import prisma from "../database/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

const formatWorkOrder = (wo) => ({
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
  plate: wo.car?.plate ?? null,
  brand: wo.car?.brand ?? null,
  model: wo.car?.model ?? null,
  client_name: wo.client?.name ?? null,
  client_phone: wo.client?.phone ?? null,
  employee_name: wo.employee?.name ?? null,
});

const workOrderInclude = { car: true, client: true, employee: true };

// Get all work orders for the authenticated garage
router.get("/", async (req, res) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      where: { garageId: req.user.garageId },
      include: workOrderInclude,
      orderBy: { startDatetime: "desc" },
    });
    res.json(workOrders.map(formatWorkOrder));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get work order by ID with services (only if belongs to authenticated garage)
router.get("/:id", async (req, res) => {
  try {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
      include: {
        ...workOrderInclude,
        services: { where: { garageId: req.user.garageId } },
      },
    });
    if (!workOrder) {
      return res.status(404).json({ error: "Work order not found" });
    }
    res.json({
      ...formatWorkOrder(workOrder),
      services: workOrder.services.map((s) => ({
        id: s.id,
        garage_id: s.garageId,
        work_order_id: s.workOrderId,
        description: s.description,
        quantity: s.quantity,
        unit_price: s.unitPrice,
        total_price: s.totalPrice,
        created_at: s.createdAt,
      })),
    });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new work order (automatically assigned to authenticated garage)
router.post("/", async (req, res) => {
  try {
    const {
      bill_number,
      car_id,
      client_id,
      employee_id,
      start_datetime,
      notes,
    } = req.body;
    if (
      !bill_number ||
      !car_id ||
      !client_id ||
      !employee_id ||
      !start_datetime
    ) {
      return res
        .status(400)
        .json({
          error:
            "Bill number, car, client, employee, and start date are required",
        });
    }

    const garageId = req.user.garageId;

    // Verify all referenced entities belong to the current garage
    const [carCheck, clientCheck, employeeCheck] = await Promise.all([
      prisma.car.findFirst({ where: { id: Number(car_id), garageId } }),
      prisma.client.findFirst({ where: { id: Number(client_id), garageId } }),
      prisma.employee.findFirst({
        where: { id: Number(employee_id), garageId },
      }),
    ]);
    if (!carCheck) return res.status(404).json({ error: "Car not found" });
    if (!clientCheck)
      return res.status(404).json({ error: "Client not found" });
    if (!employeeCheck)
      return res.status(404).json({ error: "Employee not found" });

    const workOrder = await prisma.workOrder.create({
      data: {
        garageId,
        billNumber: bill_number,
        carId: Number(car_id),
        clientId: Number(client_id),
        employeeId: Number(employee_id),
        startDatetime: new Date(start_datetime),
        notes,
      },
      include: workOrderInclude,
    });
    res.status(201).json(formatWorkOrder(workOrder));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update work order (only if belongs to authenticated garage)
router.put("/:id", async (req, res) => {
  try {
    const { end_datetime, total_cost, status, notes } = req.body;
    const existing = await prisma.workOrder.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Work order not found" });
    }
    const workOrder = await prisma.workOrder.update({
      where: { id: Number(req.params.id) },
      data: {
        endDatetime: end_datetime ? new Date(end_datetime) : null,
        totalCost: total_cost != null ? total_cost : undefined,
        status,
        notes,
      },
      include: workOrderInclude,
    });
    res.json(formatWorkOrder(workOrder));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete work order (only if belongs to authenticated garage)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.workOrder.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Work order not found" });
    }
    await prisma.workOrder.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Work order deleted" });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
