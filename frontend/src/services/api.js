// ============================================================================
// VALENCE-X API SERVICE CLIENT
// Connects React UI components to Express / MySQL endpoints
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || (
  window.location.port === '5173' ? 'http://localhost:5000/api' : '/api'
);

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Authentication & Users
  login: (email, password) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  signup: (userData) => 
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getUsers: () =>
    request('/users'),

  getUserProfile: (userId) => 
    request(`/users/${userId}`),

  getUserPortfolio: (userId) => 
    request(`/users/portfolio/${userId}`),

  getUserProfileCard: (userId) =>
    request(`/users/profile-card/${userId}`),

  // Market & Securities Data
  getCompanies: () => 
    request('/companies'),

  getShares: () => 
    request('/shares'),

  getShareById: (id) => 
    request(`/shares/${id}`),

  // Orders
  getBuyOrders: () => 
    request('/buy'),

  getSellOrders: () => 
    request('/sell'),

  placeBuyOrder: (orderData) => 
    request('/buy', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),

  placeSellOrder: (orderData) => 
    request('/sell', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),

  cancelBuyOrder: (user_id, buy_id) => 
    request('/buy/cancel', {
      method: 'POST',
      body: JSON.stringify({ user_id, buy_id })
    }),

  cancelSellOrder: (user_id, sell_id) => 
    request('/sell/cancel', {
      method: 'POST',
      body: JSON.stringify({ user_id, sell_id })
    }),

  // Transactions & Matching Engine
  getTransactions: () => 
    request('/transactions'),

  getUserTransactions: (userId) => 
    request(`/transactions/user/${userId}`),

  matchOrders: () => 
    request('/match', {
      method: 'POST'
    }),

  // ESOPs & Debentures
  getESOPs: () => 
    request('/esops'),

  getDebentures: () => 
    request('/debentures'),

  // Exchange Stats
  getOverviewStats: () => 
    request('/stats/overview'),

  // Phase III Views
  getViewsList: () =>
    request('/stats/views'),

  getViewData: (viewName) =>
    request(`/stats/views/${viewName}`),

  // Phase III Triggers
  getTriggersList: () =>
    request('/stats/triggers'),

  // Phase II 16 Core Queries
  getQueriesList: () =>
    request('/stats/queries'),

  runQuery: (queryId) =>
    request('/stats/queries/run', {
      method: 'POST',
      body: JSON.stringify({ queryId })
    }),

  runCustomSql: (sql) =>
    request('/stats/run-custom-sql', {
      method: 'POST',
      body: JSON.stringify({ sql })
    })
};

export default api;
