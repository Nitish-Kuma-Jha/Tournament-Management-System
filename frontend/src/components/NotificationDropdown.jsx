import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { markAllAsRead, markAsRead, removeNotification, clearAll, setNotifications, setUnreadCount } from '../features/notifications/notificationSlice'
import { notificationAPI } from '../services/api'
import { Bell, CheckCheck, X, Trash2, RefreshCw, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'

const notifIcons = {
  registration_approved: '✅',
  registration_rejected: '❌',
  tournament_update: '🏆',
  match_scheduled: '📅',
  match_result: '⚽',
  payment_received: '💳',
  payment_success: '💰',
  account_verified: '✨',
  account_suspended: '🚫',
  system_announcement: '📢',
  bracket_generated: '🎯',
  registration_open: '🔓',
  default: '🔔',
}

const notifColors = {
  registration_approved: 'border-l-green-500',
  registration_rejected: 'border-l-red-500',
  payment_received: 'border-l-primary-500',
  payment_success: 'border-l-primary-500',
  system_announcement: 'border-l-blue-500',
  account_suspended: 'border-l-red-500',
  default: 'border-l-dark-600',
}

export default function NotificationDropdown({ onClose }) {
  const dispatch = useDispatch()
  const { notifications, unreadCount } = useSelector((state) => state.notifications)
  const ref = useRef(null)
  const [filter, setFilter] = useState('all') // all | unread
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch notifications from API
  const { refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationAPI.getAll({ limit: 30 })
      const data = res?.data?.data || []
      dispatch(setNotifications(data))
      return data
    },
    refetchInterval: 30000, // poll every 30s
    refetchOnWindowFocus: true,
  })

  // Fetch unread count
  useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await notificationAPI.getUnreadCount()
      dispatch(setUnreadCount(res?.data?.data?.count || 0))
      return res?.data?.data?.count
    },
    refetchInterval: 15000,
  })

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleMarkAllRead = async () => {
    dispatch(markAllAsRead())
    try { await notificationAPI.markAllRead() } catch (_) {}
  }

  const handleMarkRead = async (id) => {
    dispatch(markAsRead(id))
    try { await notificationAPI.markAsRead(id) } catch (_) {}
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    dispatch(removeNotification(id))
  }

  const handleClearAll = () => {
    dispatch(clearAll())
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 card shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 bg-dark-800/50">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-primary-400" />
          <h3 className="font-semibold text-dark-100 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary-500 text-dark-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="btn-ghost p-1.5 rounded-md text-dark-500 hover:text-dark-300"
            title="Refresh"
          >
            <motion.span animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.6 }}>
              <RefreshCw size={13} />
            </motion.span>
          </button>
          {notifications.length > 0 && (
            <button onClick={handleMarkAllRead} className="btn-ghost p-1.5 rounded-md text-dark-500 hover:text-green-400" title="Mark all read">
              <CheckCheck size={14} />
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="btn-ghost p-1.5 rounded-md text-dark-500 hover:text-red-400" title="Clear all">
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-md text-dark-500 hover:text-dark-200">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {notifications.length > 0 && (
        <div className="flex border-b border-dark-700/50 bg-dark-900/30">
          {['all', 'unread'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-all ${
                filter === f
                  ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5'
                  : 'text-dark-500 hover:text-dark-300'
              }`}
            >
              {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto overscroll-contain">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-14 text-center"
            >
              <Bell size={32} className="text-dark-700 mx-auto mb-3" />
              <p className="text-dark-500 text-sm font-medium">
                {filter === 'unread' ? 'All caught up! 🎉' : 'No notifications yet'}
              </p>
              <p className="text-dark-600 text-xs mt-1">
                {filter === 'unread' ? 'No unread notifications' : "We'll notify you when something happens"}
              </p>
            </motion.div>
          ) : (
            filtered.map((n, i) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <button
                  onClick={() => handleMarkRead(n._id)}
                  className={`w-full text-left px-4 py-3 hover:bg-dark-800/60 transition-colors border-b border-dark-800/40 last:border-0 border-l-2 group
                    ${!n.isRead ? `bg-primary-500/4 ${notifColors[n.type] || notifColors.default}` : 'border-l-transparent'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {notifIcons[n.type] || notifIcons.default}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug ${n.isRead ? 'text-dark-400' : 'text-dark-100'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                          <button
                            onClick={(e) => handleDelete(e, n._id)}
                            className="opacity-0 group-hover:opacity-100 text-dark-600 hover:text-red-400 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-dark-600 mt-1.5">
                        {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-dark-700/50 bg-dark-900/30 flex items-center justify-between">
          <span className="text-xs text-dark-600">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
          {filter === 'all' && unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
              <CheckCheck size={11} /> Mark all read
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
