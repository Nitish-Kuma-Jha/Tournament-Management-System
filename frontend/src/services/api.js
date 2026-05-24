import axios from 'axios'
import { store } from '../store'
import { updateTokens, updateAccessToken, clearAuth } from '../features/auth/authSlice'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = store.getState().auth.refreshToken

      if (!refreshToken) {
        store.dispatch(clearAuth())
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        // Save BOTH rotated tokens — critical for refresh token rotation security
        store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }))

        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        store.dispatch(clearAuth())
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
}

export const tournamentAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getOne: (id) => api.get(`/tournaments/${id}`),
  getMyTournaments: (params) => api.get('/tournaments/my', { params }),
  create: (data) => api.post('/tournaments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  approve: (id, data) => api.post(`/tournaments/${id}/approve`, data),
  reject: (id, data) => api.post(`/tournaments/${id}/reject`, data),
  generateBracket: (id) => api.post(`/tournaments/${id}/generate-bracket`),
  getStats: (id) => api.get(`/tournaments/${id}/stats`),
}

export const teamAPI = {
  getAll: (params) => api.get('/teams', { params }),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  getMyTeams: () => api.get('/users/teams'),
}

export const registrationAPI = {
  register: (data) => api.post('/registrations', data),
  registerWithForm: (data) => api.post('/registrations', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyRegistrations: (params) => api.get('/registrations/my', { params }),
  getTournamentRegistrations: (tournamentId, params) =>
    api.get(`/registrations/tournament/${tournamentId}`, { params }),
  approve: (id, data) => api.put(`/registrations/${id}/approve`, data),
  reject: (id, data) => api.put(`/registrations/${id}/reject`, data),
  withdraw: (id) => api.put(`/registrations/${id}/withdraw`),
}

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
}

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  verifyDocument: (id) => api.put(`/admin/users/${id}/verify-document`),
  getPendingApprovals: () => api.get('/admin/pending-approvals'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  sendAnnouncement: (data) => api.post('/admin/announcements', data),
}

export const analyticsAPI = {
  platform: (params) => api.get('/analytics/platform', { params }),
  organizer: (params) => api.get('/analytics/organizer', { params }),
  user: () => api.get('/analytics/user'),
}

export const groundAPI = {
  getAll: (params) => api.get('/grounds', { params }),
  getOne: (id) => api.get(`/grounds/${id}`),
  create: (data) => api.post('/grounds', data),
  update: (id, data) => api.put(`/grounds/${id}`, data),
  delete: (id) => api.delete(`/grounds/${id}`),
}

export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (data) => api.post('/users/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadDocument: (data) => api.post('/users/upload-document', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPayments: (params) => api.get('/payments/my', { params }),
}

export const eventAPI = {
  getByTournament: (tournamentId) => api.get(`/events/tournament/${tournamentId}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  updateResult: (id, data) => api.put(`/events/${id}/result`, data),
}

export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  verify: (data) => api.post('/payments/verify', data),
  getHistory: (params) => api.get('/payments/my', { params }),
}

export const ticketAPI = {
  create: (data) => api.post('/tickets', data),
  getAll: (params) => api.get('/tickets', { params }),
  getOne: (id) => api.get(`/tickets/${id}`),
  addReply: (id, data) => api.post(`/tickets/${id}/reply`, data),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  reopen: (id, data) => api.post(`/tickets/${id}/reopen`, data),
  rate: (id, data) => api.post(`/tickets/${id}/rate`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getStats: () => api.get('/tickets/stats'),
}

export default api
