/**
 * Web Dashboard Unified API Client
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const storage = {
  getToken: () => localStorage.getItem('wm_token'),
  setToken: (token) => localStorage.setItem('wm_token', token),
  removeToken: () => localStorage.removeItem('wm_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('wm_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('wm_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('wm_user'),
  clear: () => {
    localStorage.removeItem('wm_token');
    localStorage.removeItem('wm_user');
  },
};

async function request(endpoint, options = {}) {
  const token = storage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (response.status === 401) {
    storage.clear();
    // Dispatch auth state change event
    window.dispatchEvent(new Event('wm_auth_logout'));
  }

  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    storage.setToken(res.data.token);
    storage.setUser(res.data.user);
    return res.data;
  },

  async register(email, password) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    storage.setToken(res.data.token);
    storage.setUser(res.data.user);
    return res.data;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      storage.clear();
    }
  },

  async getMe() {
    const res = await request('/auth/me');
    storage.setUser(res.data);
    return res.data;
  },

  // Memories CRUD
  async getMemories(params = {}) {
    const qp = new URLSearchParams();
    if (params.page) qp.set('page', params.page);
    if (params.limit) qp.set('limit', params.limit);
    if (params.sort) qp.set('sort', params.sort);
    if (params.type) qp.set('type', params.type);
    if (params.tag) qp.set('tag', params.tag);
    if (params.domain) qp.set('domain', params.domain);
    if (params.q) qp.set('q', params.q);

    const query = qp.toString() ? `?${qp.toString()}` : '';
    return await request(`/memories${query}`);
  },

  async getMemory(id) {
    const res = await request(`/memories/${id}`);
    return res.data;
  },

  async createMemory(payload) {
    const res = await request('/memories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateMemory(id, payload) {
    const res = await request(`/memories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteMemory(id) {
    return await request(`/memories/${id}`, {
      method: 'DELETE',
    });
  },

  // AI & Semantic Search
  async askMemory(question) {
    const res = await request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
    return res.data;
  },

  async summarize(text) {
    const res = await request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return res.data;
  },
};
