import express from "express";
import prisma from "../database/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

const formatService = (s) => ({
  id: s.id,
  garage_id: s.garageId,
  work_order_id: s.workOrderId,
  description: s.description,
  quantity: s.quantity,
  unit_price: s.unitPrice,
  total_price: s.totalPrice,
  created_at: s.createdAt,
});

// Get services for a work order (only if belongs to authenticated garage)
router.get("/work-order/:workOrderId", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        workOrderId: Number(req.params.workOrderId),
        garageId: req.user.garageId,
      },
    });
    res.json(services.map(formatService));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add service to work order (automatically assigned to authenticated garage)
router.post("/", async (req, res) => {
  try {
    const { work_order_id, description, quantity, unit_price } = req.body;
    if (!work_order_id || !description || !quantity || !unit_price) {
      return res.status(400).json({
        error: "Work order, description, quantity, and unit price are required",
      });
    }
    const garageId = req.user.garageId;
    const workOrderId = Number(work_order_id);
    const totalPrice = Number(quantity) * Number(unit_price);

    const service = await prisma.$transaction(async (tx) => {
      const svc = await tx.service.create({
        data: {
          garageId,
          workOrderId,
          description,
          quantity: Number(quantity),
          unitPrice: Number(unit_price),
          totalPrice,
        },
      });
      const agg = await tx.service.aggregate({
        _sum: { totalPrice: true },
        where: { workOrderId, garageId },
      });
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { totalCost: agg._sum.totalPrice ?? 0 },
      });
      return svc;
    });

    res.status(201).json(formatService(service));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update service (only if belongs to authenticated garage)
router.put("/:id", async (req, res) => {
  try {
    const { description, quantity, unit_price, work_order_id } = req.body;
    const garageId = req.user.garageId;
    const workOrderId = Number(work_order_id);
    const totalPrice = Number(quantity) * Number(unit_price);

    const existing = await prisma.service.findFirst({
      where: { id: Number(req.params.id), garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const service = await prisma.$transaction(async (tx) => {
      const svc = await tx.service.update({
        where: { id: Number(req.params.id) },
        data: {
          description,
          quantity: Number(quantity),
          unitPrice: Number(unit_price),
          totalPrice,
        },
      });
      const agg = await tx.service.aggregate({
        _sum: { totalPrice: true },
        where: { workOrderId, garageId },
      });
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { totalCost: agg._sum.totalPrice ?? 0 },
      });
      return svc;
    });

    res.json(formatService(service));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete service (only if belongs to authenticated garage)
router.delete("/:id", async (req, res) => {
  try {
    const garageId = req.user.garageId;
    const existing = await prisma.service.findFirst({
      where: { id: Number(req.params.id), garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }
    const workOrderId = existing.workOrderId;

    await prisma.$transaction(async (tx) => {
      await tx.service.delete({ where: { id: Number(req.params.id) } });
      const agg = await tx.service.aggregate({
        _sum: { totalPrice: true },
        where: { workOrderId, garageId },
      });
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { totalCost: agg._sum.totalPrice ?? 0 },
      });
    });

    res.json({ message: "Service deleted" });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
