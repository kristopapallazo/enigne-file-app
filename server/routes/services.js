import express from 'express';
import { pool } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get services for a work order (only if belongs to authenticated garage)
router.get('/work-order/:workOrderId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE work_order_id = $1 AND garage_id = $2',
      [req.params.workOrderId, req.user.garageId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add service to work order (automatically assigned to authenticated garage)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { work_order_id, description, quantity, unit_price } = req.body;
    const total_price = quantity * unit_price;

    const serviceResult = await client.query(
      'INSERT INTO services (garage_id, work_order_id, description, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.garageId, work_order_id, description, quantity, unit_price, total_price]
    );

    // Update work order total cost (only for this garage)
    const totalCostResult = await client.query(
      'SELECT SUM(total_price) as total FROM services WHERE work_order_id = $1 AND garage_id = $2',
      [work_order_id, req.user.garageId]
    );

    await client.query(
      'UPDATE work_orders SET total_cost = $1 WHERE id = $2 AND garage_id = $3',
      [totalCostResult.rows[0].total, work_order_id, req.user.garageId]
    );

    await client.query('COMMIT');
    res.status(201).json(serviceResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update service (only if belongs to authenticated garage)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { description, quantity, unit_price, work_order_id } = req.body;
    const total_price = quantity * unit_price;

    const serviceResult = await client.query(
      'UPDATE services SET description = $1, quantity = $2, unit_price = $3, total_price = $4 WHERE id = $5 AND garage_id = $6 RETURNING *',
      [description, quantity, unit_price, total_price, req.params.id, req.user.garageId]
    );

    if (serviceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update work order total cost (only for this garage)
    const totalCostResult = await client.query(
      'SELECT SUM(total_price) as total FROM services WHERE work_order_id = $1 AND garage_id = $2',
      [work_order_id, req.user.garageId]
    );

    await client.query(
      'UPDATE work_orders SET total_cost = $1 WHERE id = $2 AND garage_id = $3',
      [totalCostResult.rows[0].total, work_order_id, req.user.garageId]
    );

    await client.query('COMMIT');
    res.json(serviceResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete service (only if belongs to authenticated garage)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const serviceResult = await client.query(
      'SELECT work_order_id FROM services WHERE id = $1 AND garage_id = $2',
      [req.params.id, req.user.garageId]
    );

    if (serviceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Service not found' });
    }

    const work_order_id = serviceResult.rows[0].work_order_id;

    await client.query(
      'DELETE FROM services WHERE id = $1 AND garage_id = $2',
      [req.params.id, req.user.garageId]
    );

    // Update work order total cost (only for this garage)
    const totalCostResult = await client.query(
      'SELECT COALESCE(SUM(total_price), 0) as total FROM services WHERE work_order_id = $1 AND garage_id = $2',
      [work_order_id, req.user.garageId]
    );

    await client.query(
      'UPDATE work_orders SET total_cost = $1 WHERE id = $2 AND garage_id = $3',
      [totalCostResult.rows[0].total, work_order_id, req.user.garageId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Service deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
