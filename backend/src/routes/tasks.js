const express = require('express');
const { pool } = require('../config/db');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validateTask');

const router = express.Router();

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const conditions = [];
    const params = [];

    if (status && ['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, title, description, status, priority,
             DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
             created_at, updated_at
      FROM tasks
      ${whereClause}
      ORDER BY FIELD(status, 'IN_PROGRESS', 'TODO', 'DONE'),
               FIELD(priority, 'HIGH', 'MEDIUM', 'LOW'),
               created_at DESC
    `;

    const [rows] = await pool.execute(sql, params);
    res.json({ count: rows.length, tasks: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const [rows] = await pool.execute(
      `SELECT id, title, description, status, priority,
              DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
              created_at, updated_at
       FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

// POST /api/tasks
router.post('/', validateCreateTask, async (req, res, next) => {
  try {
    const { title, description, status, priority, due_date } = req.validatedTask;

    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, status, priority, due_date]
    );

    const [createdRows] = await pool.execute(
      `SELECT id, title, description, status, priority,
              DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
              created_at, updated_at
       FROM tasks WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(createdRows[0]);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', validateUpdateTask, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const updates = req.validatedUpdates;
    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }

    params.push(taskId);

    const [result] = await pool.execute(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [updatedRows] = await pool.execute(
      `SELECT id, title, description, status, priority,
              DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
              created_at, updated_at
       FROM tasks WHERE id = ?`,
      [taskId]
    );

    return res.json(updatedRows[0]);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
