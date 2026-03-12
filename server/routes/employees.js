import express from "express";
import prisma from "../database/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

const formatEmployee = (e) => ({
  id: e.id,
  garage_id: e.garageId,
  name: e.name,
  phone: e.phone,
  role: e.role,
  created_at: e.createdAt,
});

// Get all employees for the authenticated garage
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { garageId: req.user.garageId },
      orderBy: { name: "asc" },
    });
    res.json(employees.map(formatEmployee));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get employee by ID (only if belongs to authenticated garage)
router.get("/:id", async (req, res) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(formatEmployee(employee));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new employee (automatically assigned to authenticated garage)
router.post("/", async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const employee = await prisma.employee.create({
      data: {
        garageId: req.user.garageId,
        name,
        phone,
        role: role || "Mechanic",
      },
    });
    res.status(201).json(formatEmployee(employee));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update employee (only if belongs to authenticated garage)
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const existing = await prisma.employee.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: { name, phone, role },
    });
    res.json(formatEmployee(employee));
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete employee (only if belongs to authenticated garage)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.employee.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Employee not found" });
    }
    await prisma.employee.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Employee deleted" });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
