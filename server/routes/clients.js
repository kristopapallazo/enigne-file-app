import express from "express";
import { pool } from "../database/init.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all clients for the authenticated garage
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clients WHERE garage_id = $1 ORDER BY name",
      [req.user.garageId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Get client by ID with their cars (only if belongs to authenticated garage)
router.get("/:id", async (req, res) => {
  try {
    const clientResult = await pool.query(
      "SELECT * FROM clients WHERE id = $1 AND garage_id = $2",
      [req.params.id, req.user.garageId],
    );
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const carsResult = await pool.query(
      "SELECT * FROM cars WHERE client_id = $1 AND garage_id = $2",
      [req.params.id, req.user.garageId],
    );
    res.json({ ...clientResult.rows[0], cars: carsResult.rows });
  } catch (error) {
    console.error("Error fetching client:", error);
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
    const result = await pool.query(
      "INSERT INTO clients (garage_id, name, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.garageId, name, phone, email, address],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating client:", error);
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
    const result = await pool.query(
      "UPDATE clients SET name = $1, phone = $2, email = $3, address = $4 WHERE id = $5 AND garage_id = $6 RETURNING *",
      [name, phone, email, address, req.params.id, req.user.garageId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client (only if belongs to authenticated garage)
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM clients WHERE id = $1 AND garage_id = $2 RETURNING id",
      [req.params.id, req.user.garageId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({ message: "Client deleted" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
