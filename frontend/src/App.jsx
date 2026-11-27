import React, { useState, useEffect, useCallback } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask } from './api';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  due_date: ''
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTasks({
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery
      });
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks from API.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await updateTask(editingId, form);
        setEditingId(null);
      } else {
        await createTask(form);
      }
      setForm(INITIAL_FORM);
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError('');
  };

  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      if (editingId === id) handleCancelEdit();
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  const counts = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>CloudTask Manager</h1>
          <p className="subtitle">Containerized React + Express on AWS EC2 + RDS MySQL</p>
        </div>
        <div className="stats-bar">
          <span className="stat-pill">Total: {counts.total}</span>
          <span className="stat-pill stat-todo">To Do: {counts.todo}</span>
          <span className="stat-pill stat-progress">In Progress: {counts.inProgress}</span>
          <span className="stat-pill stat-done">Done: {counts.done}</span>
        </div>
      </header>

      {error && (
        <div className="alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="btn-close">
            &times;
          </button>
        </div>
      )}

      <main className="main-grid">
        <section className="card form-card">
          <h2>{editingId ? `Edit Task #${editingId}` : 'Create New Task'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                maxLength={255}
                required
                placeholder="e.g., Configure RDS Security Group"
                value={form.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Add implementation details or notes..."
                value={form.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={form.status} onChange={handleInputChange}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select id="priority" name="priority" value={form.priority} onChange={handleInputChange}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="due_date">Due Date</label>
                <input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Task' : 'Add Task'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="tasks-section">
          <div className="card filter-bar">
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {loading ? (
            <div className="card empty-state">Loading tasks from database...</div>
          ) : tasks.length === 0 ? (
            <div className="card empty-state">
              No tasks match your filters. Create a task using the form to get started!
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article key={task.id} className={`card task-card status-${task.status.toLowerCase()}`}>
                  <div className="task-top">
                    <div className="badges">
                      <span className={`badge badge-status-${task.status.toLowerCase()}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      {task.due_date && <span className="due-date">Due: {task.due_date}</span>}
                    </div>
                    <div className="task-actions">
                      <select
                        aria-label="Quick status update"
                        value={task.status}
                        onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                        className="status-select"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleEdit(task)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <h3 className={task.status === 'DONE' ? 'completed-title' : ''}>{task.title}</h3>
                  {task.description && <p className="task-desc">{task.description}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
