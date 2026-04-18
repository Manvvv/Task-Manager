/* ============================================================
   TASKR — Task Manager  |  app.js
   Frontend logic: Communicates with Express API
   ============================================================ */

'use strict';

const API_BASE = '/api/tasks';

// ── API DATA LAYER ───────────────────────────────────────────
const DB = {
  // READ — fetch tasks with filters
  async find(filter = {}) {
    try {
      const params = new URLSearchParams();
      if (filter.status)   params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.search)   params.append('search', filter.search);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (err) {
      console.error('Fetch error:', err);
      return [];
    }
  },

  // CREATE — send new task to backend
  async insert(task) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.error('Insert error:', err);
      return null;
    }
  },

  // UPDATE — patch existing task
  async update(id, patch) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      return await res.json();
    } catch (err) {
      console.error('Update error:', err);
    }
  },

  // TOGGLE — specialized route for completion toggle
  async toggle(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/toggle`, { method: 'PATCH' });
      return await res.json();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  },

  // DELETE — remove task
  async delete(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('Delete error:', err);
    }
  },

  // BULK DELETE — remove completed
  async clearCompleted() {
    try {
      const res = await fetch(`${API_BASE}/completed/all`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('Clear error:', err);
    }
  },

  // STATS — get summary from dashboard
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats/summary`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.error('Stats error:', err);
      return null;
    }
  }
};

// ── APPLICATION STATE ─────────────────────────────────────────
let currentFilter = 'all';
let searchQuery   = '';

// ── UTILITY HELPERS ───────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function priorityBadge(p) {
  return `<span class="badge badge-${p}">${p.toUpperCase()}</span>`;
}

function catBadge(c) {
  return c !== 'general'
    ? `<span class="badge badge-cat">${c.toUpperCase()}</span>`
    : '';
}

// ── TOAST NOTIFICATION ────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// ── RENDER ENGINE ─────────────────────────────────────────────
async function render() {
  const list  = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  const filter = {};
  if (currentFilter === 'active')    filter.status   = 'active';
  else if (currentFilter === 'completed') filter.status = 'completed';
  else if (['high', 'medium', 'low'].includes(currentFilter)) filter.priority = currentFilter;
  if (searchQuery) filter.search = searchQuery;

  const tasks = await DB.find(filter);

  list.innerHTML = '';
  empty.classList.toggle('show', tasks.length === 0);

  tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.className  = `task-item priority-${task.priority}${task.completed ? ' completed' : ''}`;
    li.dataset.id = task._id;
    li.style.animationDelay = `${i * 0.04}s`;

    li.innerHTML = `
      <div class="task-main">
        <div class="task-check" onclick="toggleTask('${task._id}')">
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="#000" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="task-body">
          <div class="task-title">${escHtml(task.title)}</div>
          ${task.desc ? `<div class="task-desc">${escHtml(task.desc)}</div>` : ''}
          <div class="task-meta">
            ${priorityBadge(task.priority)}
            ${catBadge(task.category)}
            <span class="task-date">${formatDate(task.createdAt)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn edit" onclick="openEdit('${task._id}')" title="Edit">✎</button>
          <button class="icon-btn del"  onclick="deleteTask('${task._id}')" title="Delete">✕</button>
        </div>
      </div>

      <div class="edit-form" id="edit-${task._id}">
        <input type="text" class="input-main" id="et-${task._id}"
               value="${escHtml(task.title)}" placeholder="Task title...">
        <textarea class="input-main" id="ed-${task._id}"
                  rows="2" placeholder="Description...">${escHtml(task.desc || '')}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="ep-${task._id}">
            <option value="low"   ${task.priority === 'low'    ? 'selected' : ''}>LOW</option>
            <option value="medium"${task.priority === 'medium' ? 'selected' : ''}>MEDIUM</option>
            <option value="high"  ${task.priority === 'high'   ? 'selected' : ''}>HIGH</option>
          </select>
          <select id="ec-${task._id}">
            <option value="general" ${task.category === 'general'  ? 'selected' : ''}>GENERAL</option>
            <option value="work"    ${task.category === 'work'     ? 'selected' : ''}>WORK</option>
            <option value="personal"${task.category === 'personal' ? 'selected' : ''}>PERSONAL</option>
            <option value="study"   ${task.category === 'study'    ? 'selected' : ''}>STUDY</option>
            <option value="health"  ${task.category === 'health'   ? 'selected' : ''}>HEALTH</option>
          </select>
          <button class="btn btn-primary" onclick="saveEdit('${task._id}')">SAVE</button>
          <button class="btn btn-ghost"   onclick="closeEdit('${task._id}')">CANCEL</button>
        </div>
      </div>`;

    list.appendChild(li);
  });

  updateStats();
}

// ── STATS UPDATE ──────────────────────────────────────────────
async function updateStats() {
  const stats = await DB.getStats();
  if (!stats) return;

  document.getElementById('stat-total').textContent  = stats.total;
  document.getElementById('s-active').textContent    = stats.active;
  document.getElementById('s-completed').textContent = stats.completed;
  document.getElementById('s-medium').textContent    = stats.medium;
  document.getElementById('s-high').textContent      = stats.high;
}

// ── CRUD OPERATIONS ───────────────────────────────────────────

// CREATE
async function addTask() {
  const titleInput = document.getElementById('task-input');
  const title = titleInput.value.trim();
  if (!title) { titleInput.focus(); return; }

  const newTask = {
    title,
    desc:     document.getElementById('desc-input').value.trim(),
    priority: document.getElementById('priority-select').value,
    category: document.getElementById('cat-select').value
  };

  const saved = await DB.insert(newTask);
  if (saved) {
    titleInput.value = '';
    document.getElementById('desc-input').value = '';
    toast('// TASK INSERTED');
    render();
  }
}

// UPDATE — toggle complete/active
async function toggleTask(id) {
  const res = await DB.toggle(id);
  if (res && res.success) {
    toast(res.data.completed ? '// MARKED DONE' : '// MARKED ACTIVE');
    render();
  }
}

// UPDATE — save inline edits
async function saveEdit(id) {
  const title = document.getElementById('et-' + id).value.trim();
  if (!title) return;

  const res = await DB.update(id, {
    title,
    desc:     document.getElementById('ed-' + id).value.trim(),
    priority: document.getElementById('ep-' + id).value,
    category: document.getElementById('ec-' + id).value
  });

  if (res && res.success) {
    toast('// TASK UPDATED');
    render();
  }
}

// DELETE
async function deleteTask(id) {
  const res = await DB.delete(id);
  if (res && res.success) {
    toast('// TASK DELETED');
    render();
  }
}

// ── EDIT FORM HELPERS ─────────────────────────────────────────
function openEdit(id) {
  document.querySelectorAll('.edit-form').forEach(f => f.classList.remove('open'));
  const el = document.getElementById('edit-' + id);
  if (el) el.classList.add('open');
}

function closeEdit(id) {
  const el = document.getElementById('edit-' + id);
  if (el) el.classList.remove('open');
}

// ── EVENT LISTENERS ───────────────────────────────────────────
document.getElementById('add-btn').addEventListener('click', addTask);

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

document.getElementById('clear-form-btn').addEventListener('click', () => {
  document.getElementById('task-input').value = '';
  document.getElementById('desc-input').value = '';
  document.getElementById('task-input').focus();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

document.getElementById('search-input').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  render();
});

document.getElementById('clear-completed').addEventListener('click', async () => {
  const res = await DB.clearCompleted();
  if (res && res.success) {
    toast('// COMPLETED TASKS CLEARED');
    render();
  }
});

// ── INITIALISE ────────────────────────────────────────────────
document.getElementById('today-date').textContent = new Date()
  .toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
  .toUpperCase();

render();
