import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const assetsAPI = {
  getAll: () => api.get('/assets/'),
  add: (data) => api.post('/assets/', data),
  remove: (id) => api.delete(`/assets/${id}`),
}

export const breachesAPI = {
  scanAsset: (id) => api.post(`/breaches/scan/${id}`),
  scanAll: () => api.post('/breaches/scan-all'),
  getAssetBreaches: (id) => api.get(`/breaches/asset/${id}`),
  getRecommendations: (breachId) => api.get(`/breaches/${breachId}/recommendations`),
  getLegal: (breachId) => api.get(`/breaches/${breachId}/legal`),
}

export const alertsAPI = {
  getAll: () => api.get('/alerts/'),
  getUnreadCount: () => api.get('/alerts/unread-count'),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  markAllRead: () => api.post('/alerts/mark-all-read'),
  dismiss: (id) => api.delete(`/alerts/${id}`),
}

export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
}

export const notificationsAPI = {
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.patch('/notifications/preferences', data),
}

export default api
