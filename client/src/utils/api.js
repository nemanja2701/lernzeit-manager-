const BASE = import.meta.env.VITE_API_URL || '/api';

let authToken = localStorage.getItem('lzm_token') || null;
export function setToken(t) {
  authToken = t;
  if (t) localStorage.setItem('lzm_token', t);
  else localStorage.removeItem('lzm_token');
}
export function getToken() { return authToken; }

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event('lzm-unauthorized'));
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),

  getGoals: () => request('/goals'),
  getGoal: (id) => request(`/goals/${id}`),
  createGoal: (data) => request('/goals', { method: 'POST', body: data }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PATCH', body: data }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  getSessions: () => request('/sessions'),
  saveSession: (data) => request('/sessions', { method: 'POST', body: data }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  getStats: () => request('/sessions/stats/summary'),

  getMilestones: () => request('/milestones'),
  createMilestone: (data) => request('/milestones', { method: 'POST', body: data }),
  updateMilestone: (id, data) => request(`/milestones/${id}`, { method: 'PATCH', body: data }),
  deleteMilestone: (id) => request(`/milestones/${id}`, { method: 'DELETE' }),

  getPlan: (month) => request(`/plan${month ? `?month=${month}` : ''}`),
  createPlanEntry: (data) => request('/plan', { method: 'POST', body: data }),
  updatePlanEntry: (id, data) => request(`/plan/${id}`, { method: 'PATCH', body: data }),
  deletePlanEntry: (id) => request(`/plan/${id}`, { method: 'DELETE' }),
};
