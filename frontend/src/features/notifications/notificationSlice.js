import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  notifications: [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // Avoid duplicates
      const exists = state.notifications.find(n => n._id === action.payload._id)
      if (!exists) {
        state.notifications.unshift(action.payload)
        if (!action.payload.isRead) state.unreadCount += 1
      }
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.isRead).length
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload
    },
    markAsRead: (state, action) => {
      const n = state.notifications.find(n => n._id === action.payload)
      if (n && !n.isRead) {
        n.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.isRead = true })
      state.unreadCount = 0
    },
    removeNotification: (state, action) => {
      const idx = state.notifications.findIndex(n => n._id === action.payload)
      if (idx !== -1) {
        if (!state.notifications[idx].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1)
        state.notifications.splice(idx, 1)
      }
    },
    clearAll: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
  },
})

export const { addNotification, setNotifications, setUnreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = notificationSlice.actions
export default notificationSlice.reducer
