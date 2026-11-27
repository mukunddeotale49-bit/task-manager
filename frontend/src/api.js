const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function fetchTasks({ status = '', priority = '', search = '' } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  if (search) params.append('search', search);

  const queryString = params.toString();
  const url = `${API_BASE}/tasks${queryString ? `?${queryString}` : ''}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createTask(taskPayload) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskPayload)
  });
  return handleResponse(res);
}

export async function updateTask(id, updates) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(res);
}
