import express from 'express';
import { pool } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all cars for the authenticated garage
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cl.name as client_name
      FROM cars c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.garage_id = $1
      ORDER BY c.plate
    `, [req.user.garageId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get car by ID with history (only if belongs to authenticated garage)
router.get('/:id', async (req, res) => {
  try {
    const carResult = await pool.query(`
      SELECT c.*, cl.name as client_name, cl.phone as client_phone
      FROM cars c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = $1 AND c.garage_id = $2
    `, [req.params.id, req.user.garageId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const workOrdersResult = await pool.query(`
      SELECT wo.*, e.name as employee_name
      FROM work_orders wo
      LEFT JOIN employees e ON wo.employee_id = e.id
      WHERE wo.car_id = $1 AND wo.garage_id = $2
      ORDER BY wo.start_datetime DESC
    `, [req.params.id, req.user.garageId]);

    res.json({ ...carResult.rows[0], workOrders: workOrdersResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search cars by plate (only within authenticated garage)
router.get('/search/:plate', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cl.name as client_name
      FROM cars c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.plate ILIKE $1 AND c.garage_id = $2
    `, [`%${req.params.plate}%`, req.user.garageId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new car (automatically assigned to authenticated garage)
router.post('/', async (req, res) => {
  try {
    const { plate, brand, model, year, client_id } = req.body;
    const result = await pool.query(
      'INSERT INTO cars (garage_id, plate, brand, model, year, client_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.garageId, plate.toUpperCase(), brand, model, year, client_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update car (only if belongs to authenticated garage)
router.put('/:id', async (req, res) => {
  try {
    const { plate, brand, model, year, client_id } = req.body;
    const result = await pool.query(
      'UPDATE cars SET plate = $1, brand = $2, model = $3, year = $4, client_id = $5 WHERE id = $6 AND garage_id = $7 RETURNING *',
      [plate.toUpperCase(), brand, model, year, client_id, req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete car (only if belongs to authenticated garage)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cars WHERE id = $1 AND garage_id = $2 RETURNING id',
      [req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json({ message: 'Car deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
