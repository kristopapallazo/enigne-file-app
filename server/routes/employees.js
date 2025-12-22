import express from 'express';
import { pool } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all employees for the authenticated garage
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE garage_id = $1 ORDER BY name',
      [req.user.garageId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by ID (only if belongs to authenticated garage)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1 AND garage_id = $2',
      [req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new employee (automatically assigned to authenticated garage)
router.post('/', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    const result = await pool.query(
      'INSERT INTO employees (garage_id, name, phone, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.garageId, name, phone, role || 'Mechanic']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee (only if belongs to authenticated garage)
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    const result = await pool.query(
      'UPDATE employees SET name = $1, phone = $2, role = $3 WHERE id = $4 AND garage_id = $5 RETURNING *',
      [name, phone, role, req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee (only if belongs to authenticated garage)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 AND garage_id = $2 RETURNING id',
      [req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
