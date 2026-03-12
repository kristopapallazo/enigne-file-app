import express from 'express';
import { pool } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all work orders for the authenticated garage
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wo.*,
             c.plate, c.brand, c.model,
             cl.name as client_name, cl.phone as client_phone,
             e.name as employee_name
      FROM work_orders wo
      LEFT JOIN cars c ON wo.car_id = c.id
      LEFT JOIN clients cl ON wo.client_id = cl.id
      LEFT JOIN employees e ON wo.employee_id = e.id
      WHERE wo.garage_id = $1
      ORDER BY wo.start_datetime DESC
    `, [req.user.garageId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get work order by ID with services (only if belongs to authenticated garage)
router.get('/:id', async (req, res) => {
  try {
    const workOrderResult = await pool.query(`
      SELECT wo.*,
             c.plate, c.brand, c.model,
             cl.name as client_name, cl.phone as client_phone,
             e.name as employee_name
      FROM work_orders wo
      LEFT JOIN cars c ON wo.car_id = c.id
      LEFT JOIN clients cl ON wo.client_id = cl.id
      LEFT JOIN employees e ON wo.employee_id = e.id
      WHERE wo.id = $1 AND wo.garage_id = $2
    `, [req.params.id, req.user.garageId]);

    if (workOrderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const servicesResult = await pool.query(
      'SELECT * FROM services WHERE work_order_id = $1 AND garage_id = $2',
      [req.params.id, req.user.garageId]
    );
    res.json({ ...workOrderResult.rows[0], services: servicesResult.rows });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new work order (automatically assigned to authenticated garage)
router.post('/', async (req, res) => {
  try {
    const { bill_number, car_id, client_id, employee_id, start_datetime, notes } = req.body;
    if (!bill_number || !car_id || !client_id || !employee_id || !start_datetime) {
      return res.status(400).json({ error: 'Bill number, car, client, employee, and start date are required' });
    }

    // Verify all referenced entities belong to the current garage
    const [carCheck, clientCheck, employeeCheck] = await Promise.all([
      pool.query('SELECT id FROM cars WHERE id = $1 AND garage_id = $2', [car_id, req.user.garageId]),
      pool.query('SELECT id FROM clients WHERE id = $1 AND garage_id = $2', [client_id, req.user.garageId]),
      pool.query('SELECT id FROM employees WHERE id = $1 AND garage_id = $2', [employee_id, req.user.garageId]),
    ]);
    if (carCheck.rows.length === 0) return res.status(404).json({ error: 'Car not found' });
    if (clientCheck.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    if (employeeCheck.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const result = await pool.query(
      'INSERT INTO work_orders (garage_id, bill_number, car_id, client_id, employee_id, start_datetime, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.garageId, bill_number, car_id, client_id, employee_id, start_datetime, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update work order (only if belongs to authenticated garage)
router.put('/:id', async (req, res) => {
  try {
    const { end_datetime, total_cost, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE work_orders SET end_datetime = $1, total_cost = $2, status = $3, notes = $4 WHERE id = $5 AND garage_id = $6 RETURNING *',
      [end_datetime, total_cost, status, notes, req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete work order (only if belongs to authenticated garage)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM work_orders WHERE id = $1 AND garage_id = $2 RETURNING id',
      [req.params.id, req.user.garageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json({ message: 'Work order deleted' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
