import express from "express";
import prisma from "../database/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

const formatClient = (c) => ({
  id: c.id,
  garage_id: c.garageId,
  name: c.name,
  phone: c.phone,
  email: c.email,
  address: c.address,
  created_at: c.createdAt,
});

// Get all clients for the authenticated garage
router.get("/", async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { garageId: req.user.garageId },
      orderBy: { name: "asc" },
    });
    res.json(clients.map(formatClient));
  } catch (_error) {
    console.error("Error fetching clients:", _error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Get client by ID with their cars (only if belongs to authenticated garage)
router.get("/:id", async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
      include: { cars: { where: { garageId: req.user.garageId } } },
    });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({
      ...formatClient(client),
      cars: client.cars.map((car) => ({
        id: car.id,
        garage_id: car.garageId,
        client_id: car.clientId,
        plate: car.plate,
        brand: car.brand,
        model: car.model,
        year: car.year,
        created_at: car.createdAt,
      })),
    });
  } catch (_error) {
    console.error("Error fetching client:", _error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

// Create new client (automatically assigned to authenticated garage)
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }
    const client = await prisma.client.create({
      data: { garageId: req.user.garageId, name, phone, email, address },
    });
    res.status(201).json(formatClient(client));
  } catch (_error) {
    console.error("Error creating client:", _error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client (only if belongs to authenticated garage)
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }
    const existing = await prisma.client.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }
    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { name, phone, email, address },
    });
    res.json(formatClient(client));
  } catch (_error) {
    console.error("Error updating client:", _error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client (only if belongs to authenticated garage)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: Number(req.params.id), garageId: req.user.garageId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }
    await prisma.client.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Client deleted" });
  } catch (_error) {
    console.error("Error deleting client:", _error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
