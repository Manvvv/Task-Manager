// ============================================================
//  TASKR — Task Manager  |  server.js
//  Node.js + Express REST API backend
//  Run:  node server.js
//  API available at: http://localhost:3000/api/tasks
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connectDB } = require('./db');
const Task    = require('./models/Task');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve frontend

// ── CONNECT DATABASE ──────────────────────────────────────────
connectDB();

// ── ROUTES ───────────────────────────────────────────────────

// GET /api/tasks — Read all tasks (with optional filters)
// Query params: ?status=active|completed  ?priority=low|medium|high  ?search=keyword
app.get('/api/tasks', async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const query = {};

    if (status === 'active')    query.completed = false;
    if (status === 'completed') query.completed = true;
    if (priority)               query.priority  = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { desc:  { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, data: tasks });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/:id — Read a single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tasks — Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, desc, priority, category } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const task = await Task.create({
      title:    title.trim(),
      desc:     (desc || '').trim(),
      priority: priority || 'medium',
      category: category || 'general',
      completed: false
    });

    res.status(201).json({ success: true, data: task });

  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:id — Update a task (full or partial)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, desc, priority, category, completed } = req.body;
    const patch = {};

    if (title     !== undefined) patch.title     = title.trim();
    if (desc      !== undefined) patch.desc      = desc.trim();
    if (priority  !== undefined) patch.priority  = priority;
    if (category  !== undefined) patch.category  = category;
    if (completed !== undefined) patch.completed = completed;
    patch.updatedAt = new Date();

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });

  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/tasks/:id/toggle — Toggle completed status
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

    existing.completed = !existing.completed;
    existing.updatedAt = new Date();
    await existing.save();

    res.json({ success: true, data: existing });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tasks/:id — Delete a single task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted', id: req.params.id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tasks/completed/all — Bulk-delete completed tasks
app.delete('/api/tasks/completed/all', async (req, res) => {
  try {
    const result = await Task.deleteMany({ completed: true });
    res.json({ success: true, deleted: result.deletedCount });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/stats/summary — Dashboard stats
app.get('/api/tasks/stats/summary', async (req, res) => {
  try {
    const [total, active, completed, high, medium] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ completed: false }),
      Task.countDocuments({ completed: true }),
      Task.countDocuments({ priority: 'high',   completed: false }),
      Task.countDocuments({ priority: 'medium', completed: false })
    ]);

    res.json({ success: true, data: { total, active, completed, high, medium } });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 404 FALLBACK ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── START SERVER ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🚀 TASKR server running → http://localhost:${PORT}`);
  console.log(`  📡 API endpoint          → http://localhost:${PORT}/api/tasks\n`);
});

module.exports = app;
