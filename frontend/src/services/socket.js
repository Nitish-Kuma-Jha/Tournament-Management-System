import { io } from 'socket.io-client'
import { store } from '../store'
import { addNotification } from '../features/notifications/notificationSlice'
import toast from 'react-hot-toast'

let socket = null

export const connectSocket = () => {
  const token = store.getState().auth.accessToken
  if (!token) throw new Error('No auth token')

  socket = io(import.meta.env.VITE_SOCKET_URL || '', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('notification:new', (notification) => {
    store.dispatch(addNotification(notification))
    toast(notification.title, { icon: '🔔', duration: 5000 })
  })

  socket.on('tournament:updated', (data) => {
    console.log('Tournament updated:', data)
  })

  socket.on('match:result', () => {
    toast('Match result updated!', { icon: '⚽' })
  })

  socket.on('bracket:generated', () => {
    toast.success('Tournament bracket has been generated!', { duration: 5000 })
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket
export const joinTournament = (tournamentId) => socket?.emit('join:tournament', tournamentId)
export const leaveTournament = (tournamentId) => socket?.emit('leave:tournament', tournamentId)
