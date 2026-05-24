import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { ticketAPI } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import io from 'socket.io-client'
import {
  MessageSquare, Plus, Search, ChevronRight, Clock,
  AlertCircle, CheckCircle, RefreshCw, XCircle, Loader2,
  ArrowLeft, Send, Lock, Star, Shield, Bell, X,
  TrendingUp, Inbox, CircleDot
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { SectionHeader, PageLoader, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'registration_issue', label: 'Registration Issue', icon: '📋' },
  { value: 'payment_issue', label: 'Payment Issue', icon: '💳' },
  { value: 'tournament_query', label: 'Tournament Query', icon: '🏆' },
  { value: 'account_issue', label: 'Account Issue', icon: '👤' },
  { value: 'technical_bug', label: 'Technical Bug', icon: '🐛' },
  { value: 'refund_request', label: 'Refund Request', icon: '💰' },
  { value: 'organizer_support', label: 'Organizer Support', icon: '🎯' },
  { value: 'general_inquiry', label: 'General Inquiry', icon: '❓' },
  { value: 'complaint', label: 'Complaint', icon: '⚠️' },
  { value: 'feature_request', label: 'Feature Request', icon: '✨' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'high', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { value: 'critical', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
]

const STATUSES = [
  { value: 'open', label: 'Open', Icon: CircleDot, color: 'text-blue-400' },
  { value: 'in_progress', label: 'In Progress', Icon: RefreshCw, color: 'text-yellow-400' },
  { value: 'waiting_for_user', label: 'Waiting', Icon: Clock, color: 'text-purple-400' },
  { value: 'resolved', label: 'Resolved', Icon: CheckCircle, color: 'text-green-400' },
  { value: 'closed', label: 'Closed', Icon: Lock, color: 'text-slate-400' },
  { value: 'reopened', label: 'Reopened', Icon: RefreshCw, color: 'text-orange-400' },
]

const priorityMeta = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[1]
const statusMeta = (s) => STATUSES.find(x => x.value === s) || STATUSES[0]
const categoryMeta = (c) => CATEGORIES.find(x => x.value === c) || { label: c, icon: '📌' }

function PriorityBadge({ priority }) {
  const m = priorityMeta(priority)
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${m.bg} ${m.color}`}>{m.label}</span>
}

function TicketStatusBadge({ status }) {
  const m = statusMeta(status)
  const Icon = m.Icon
  return <span className={`flex items-center gap-1 text-xs font-semibold ${m.color}`}><Icon size={11} />{m.label}</span>
}

// Notification System Component
function NotificationBell({ unreadCount, notifications }) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-dark-800 transition-colors"
      >
        <Bell size={18} className="text-dark-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-4 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800">
            <p className="font-semibold text-dark-200">Notifications</p>
            <button onClick={() => setShowDropdown(false)} className="text-dark-500 hover:text-dark-200">
              <X size={14} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-dark-500 text-sm">No new notifications</div>
          ) : (
            <div className="divide-y divide-dark-700">
              {notifications.slice(0, 10).map((notif) => (
                <div key={notif._id} className="p-3 hover:bg-dark-700/50 transition-colors">
                  <p className="text-xs font-semibold text-dark-300">{notif.title}</p>
                  <p className="text-xs text-dark-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-dark-600 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function StatsPanel({ userRole }) {
  const { data } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => ticketAPI.getStats(),
    enabled: userRole !== 'user',
  })
  const stats = data?.data?.data
  if (!stats || userRole === 'user') return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Open', value: stats.open, Icon: CircleDot, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Critical', value: stats.criticalPriority, Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'In Progress', value: stats.inProgress, Icon: RefreshCw, color: 'text-primary-400', bg: 'bg-primary-500/10' },
        { label: 'Total', value: stats.total, Icon: Inbox, color: 'text-slate-400', bg: 'bg-slate-500/10' },
      ].map(({ label, value, Icon, color, bg }) => (
        <div key={label} className="card p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className={color} />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-dark-100">{value || 0}</p>
            <p className="text-xs text-dark-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CreateTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium' })
  const [errors, setErrors] = useState({})
  const qc = useQueryClient()

  const { mutate, isLoading } = useMutation({
    mutationFn: (data) => ticketAPI.create(data),
    onSuccess: (res) => {
      const ticketId = res.data?.data?._id || res.data?.data?.ticketId
      toast.success(`Ticket raised successfully!`)
      qc.invalidateQueries(['tickets'])
      qc.invalidateQueries(['ticket-stats'])
      onCreated(ticketId)
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ticket'),
  })

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category) e.category = 'Please select a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="font-display font-bold text-dark-50 text-lg">Raise Support Ticket</h2>
            <p className="text-dark-500 text-xs mt-0.5">Our team responds within the SLA window</p>
          </div>
          <button onClick={onClose} className="text-dark-500 hover:text-dark-200"><XCircle size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs text-dark-400 mb-1.5">Subject *</label>
            <input className={`input ${errors.title ? 'border-red-500/50' : ''}`} placeholder="Brief summary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-dark-400 mb-1.5">Category *</label>
              <select className={`input ${errors.category ? 'border-red-500/50' : ''}`} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1.5">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1.5">Description *</label>
            <textarea className={`input min-h-[100px] resize-none ${errors.description ? 'border-red-500/50' : ''}`} placeholder="Describe in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
          </div>
          {form.priority && (
            <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-3 flex items-center gap-2">
              <Clock size={13} className="text-dark-500 shrink-0" />
              <p className="text-xs text-dark-400">
                <strong className="text-dark-300">{priorityMeta(form.priority).label}:</strong>{' '}
                {form.priority === 'low' ? '72h' : form.priority === 'medium' ? '24h' : form.priority === 'high' ? '8h' : '2h'} response SLA
              </p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button onClick={() => { if (validate()) mutate(form) }} disabled={isLoading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 size={14} className="animate-spin" />Raising...</> : <><Send size={14} />Raise Ticket</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function TicketDetail({ ticketId, onBack, userRole, userId }) {
  const qc = useQueryClient()
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [statusUpdate, setStatusUpdate] = useState({ status: '', resolution: '', internalNote: '' })
  const [showManage, setShowManage] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketAPI.getOne(ticketId),
    refetchInterval: 15000,
  })

  const ticket = data?.data?.data

  const { mutate: sendReply, isLoading: replying } = useMutation({
    mutationFn: (d) => ticketAPI.addReply(ticketId, d),
    onSuccess: () => { setReply(''); qc.invalidateQueries(['ticket', ticketId]); qc.invalidateQueries(['tickets']); toast.success('Reply sent') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to send'),
  })

  const { mutate: updateStatus, isLoading: updating } = useMutation({
    mutationFn: (d) => ticketAPI.updateStatus(ticketId, d),
    onSuccess: () => { qc.invalidateQueries(['ticket', ticketId]); qc.invalidateQueries(['tickets']); setShowManage(false); toast.success('Updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  })

  const { mutate: reopenTicket } = useMutation({
    mutationFn: (d) => ticketAPI.reopen(ticketId, d),
    onSuccess: () => { qc.invalidateQueries(['ticket', ticketId]); toast.success('Ticket reopened') },
  })

  const { mutate: rateTicket, isLoading: ratingLoading } = useMutation({
    mutationFn: (d) => ticketAPI.rate(ticketId, d),
    onSuccess: () => { qc.invalidateQueries(['ticket', ticketId]); toast.success('Thank you for rating!') },
  })

  if (isLoading) return <PageLoader />
  if (!ticket) return <div className="text-center py-20 text-dark-500">Ticket not found</div>

  const isOwner = ticket.requester?._id?.toString() === userId?.toString() || ticket.requester?._id === userId
  const isAssignee = ticket.assignedTo?._id?.toString() === userId?.toString()
  const canManage = userRole === 'admin' || (userRole === 'organizer' && (isOwner || isAssignee))
  const canResolve = userRole === 'admin' // ✅ ONLY ADMIN CAN RESOLVE
  const canRate = isOwner && ticket.status === 'resolved' && !ticket.rating?.ratedAt
  const canReply = !['closed'].includes(ticket.status)

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-dark-500 hover:text-dark-200 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">{ticket._id}</span>
              <PriorityBadge priority={ticket.priority} />
              <span className="text-base">{categoryMeta(ticket.category)?.icon}</span>
            </div>
            <h1 className="text-xl font-display font-bold text-dark-50 mb-2">{ticket.title}</h1>
            <div className="flex items-center gap-3 text-xs text-dark-500 mb-4 flex-wrap">
              <span>By <strong className="text-dark-300">{ticket.requester?.name}</strong></span>
              <span>·</span>
              <span>{ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm') : ''}</span>
              <span>·</span>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4 text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
          </div>

          {/* Replies */}
          {ticket.replies?.map((r, i) => {
            const isMe = r.author?._id?.toString() === userId?.toString()
            // ✅ Hide internal replies from non-admin users
            if (r.isInternal && userRole !== 'admin') return null

            return (
              <motion.div key={r._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`card p-4 border-l-2 ${r.isInternal ? 'border-l-yellow-500 bg-yellow-500/5' : isMe ? 'border-l-primary-500' : 'border-l-dark-600'}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-primary-400 overflow-hidden flex-shrink-0">
                    {r.author?.avatar?.url ? <img src={r.author.avatar.url} alt="" className="w-full h-full object-cover" /> : r.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-dark-200">{r.author?.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded text-dark-400 bg-dark-800 capitalize">{r.authorRole}</span>
                  {r.isInternal && <span className="text-xs text-yellow-400">🔒 Internal</span>}
                  <span className="ml-auto text-xs text-dark-600">{r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}</span>
                </div>
                <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap pl-9">{r.message}</p>
              </motion.div>
            )
          })}

          {/* Rating */}
          {canRate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5 border border-primary-500/20">
              <p className="font-semibold text-dark-200 mb-3 flex items-center gap-2"><Star size={14} className="text-primary-400" />Rate this resolution</p>
              <div className="flex gap-2 mb-3">{[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? '' : 'grayscale opacity-30'}`}>⭐</button>
              ))}</div>
              <textarea className="input resize-none mb-3 text-sm" rows={2} placeholder="Optional feedback..." value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)} />
              <button onClick={() => rateTicket({ score: rating, comment: ratingFeedback })} disabled={!rating || ratingLoading} className="btn-primary py-2 px-5 text-sm">
                {ratingLoading ? 'Submitting...' : 'Submit & Close Ticket'}
              </button>
            </motion.div>
          )}

          {/* Reopen */}
          {isOwner && ['resolved', 'closed'].includes(ticket.status) && !canRate && (
            <div className="card p-4 flex items-center justify-between">
              <p className="text-sm text-dark-400">Issue not resolved?</p>
              <button onClick={() => reopenTicket({ reason: 'User requested reopen.' })} className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-1.5">
                <RefreshCw size={12} />Reopen
              </button>
            </div>
          )}

          {/* Reply box */}
          {canReply && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-dark-200 text-sm">Add Reply</p>
                {userRole === 'admin' && (
                  <label className="flex items-center gap-2 text-xs text-dark-400 cursor-pointer">
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="accent-yellow-400" />
                    <Lock size={11} className="text-yellow-400" />Internal note
                  </label>
                )}
              </div>
              <textarea
                className={`input resize-none mb-3 text-sm ${isInternal ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}
                rows={4}
                placeholder={isInternal ? 'Internal note (admin-only)...' : 'Type your reply...'}
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <button onClick={() => reply.trim() && sendReply({ message: reply, isInternal })} disabled={!reply.trim() || replying}
                className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2">
                {replying ? <><Loader2 size={14} className="animate-spin" />Sending...</> : <><Send size={14} />Send Reply</>}
              </button>
            </div>
          )}
          {!canReply && (
            <div className="card p-4 flex items-center gap-2 text-dark-500 text-sm"><Lock size={13} />This ticket is closed.</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-dark-200 text-sm mb-4">Ticket Info</h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Status', value: <TicketStatusBadge status={ticket.status} /> },
                { label: 'Priority', value: <PriorityBadge priority={ticket.priority} /> },
                { label: 'Category', value: `${categoryMeta(ticket.category)?.icon} ${categoryMeta(ticket.category)?.label}` },
                { label: 'Assigned', value: ticket.assignedTo?.name || 'Unassigned' },
                { label: 'Raised by', value: ticket.requester?.name },
                { label: 'Replies', value: ticket.replies?.filter(r => !r.isInternal).length || 0 },
                { label: 'Last activity', value: ticket.lastActivity ? formatDistanceToNow(new Date(ticket.lastActivity), { addSuffix: true }) : '-' },
                ...(ticket.resolvedAt ? [{ label: 'Resolved', value: formatDistanceToNow(new Date(ticket.resolvedAt), { addSuffix: true }) }] : []),
                ...(ticket.rating?.score ? [{ label: 'Rating', value: '⭐'.repeat(ticket.rating.score) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-dark-500 shrink-0">{label}</dt>
                  <dd className="text-dark-300 text-right text-xs">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {ticket.tournament && (
            <div className="card p-4">
              <p className="text-xs text-dark-500 mb-1">Related Tournament</p>
              <p className="text-sm text-dark-200 font-medium">🏆 {ticket.tournament?.name}</p>
            </div>
          )}

          {/* ✅ ADMIN ONLY - Resolve Ticket */}
          {canResolve && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 border border-green-500/20 bg-green-500/5">
              <p className="font-semibold text-green-400 text-sm mb-3 flex items-center gap-2">
                <CheckCircle size={14} /> Resolve Ticket
              </p>
              <textarea
                className="input resize-none mb-3 text-sm"
                rows={3}
                placeholder="Resolution details..."
                value={statusUpdate.resolution}
                onChange={e => setStatusUpdate({ ...statusUpdate, resolution: e.target.value })}
              />
              <button
                onClick={() => updateStatus({ status: 'resolved', resolution: statusUpdate.resolution })}
                disabled={updating || !statusUpdate.resolution.trim()}
                className="btn-success w-full py-2 text-sm"
              >
                {updating ? 'Resolving...' : 'Mark as Resolved'}
              </button>
            </motion.div>
          )}

          {/* ✅ ADMIN/ORGANIZER - Manage Ticket */}
          {canManage && (
            <div className="card p-5">
              <button onClick={() => setShowManage(!showManage)} className="flex items-center gap-2 font-semibold text-dark-200 text-sm w-full">
                <Shield size={14} className="text-primary-400" />Manage Ticket
                <motion.span animate={{ rotate: showManage ? 90 : 0 }} className="ml-auto"><ChevronRight size={14} /></motion.span>
              </button>
              <AnimatePresence>
                {showManage && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-xs text-dark-500 mb-1">Status</label>
                        <select className="input text-sm py-2" value={statusUpdate.status} onChange={e => setStatusUpdate({ ...statusUpdate, status: e.target.value })}>
                          <option value="">-- Keep Current --</option>
                          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      {userRole === 'admin' && (
                        <div>
                          <label className="block text-xs text-dark-500 mb-1">Internal Note</label>
                          <textarea className="input text-sm resize-none" rows={2} placeholder="Admin note (visible to admins only)..." value={statusUpdate.internalNote} onChange={e => setStatusUpdate({ ...statusUpdate, internalNote: e.target.value })} />
                        </div>
                      )}
                      <button onClick={() => updateStatus({ status: statusUpdate.status, internalNote: statusUpdate.internalNote })} disabled={updating} className="btn-primary w-full py-2 text-sm">
                        {updating ? 'Updating...' : 'Apply Changes'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TicketRow({ ticket, onClick, userRole, userId }) {
  const cat = categoryMeta(ticket.category)
  const replies = ticket.replies?.filter(r => !r.isInternal).length || 0
  const isOwner = ticket.requester?._id?.toString() === userId?.toString()

  return (
    <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} whileHover={{ x: 2 }} onClick={() => onClick(ticket._id)}
      className="w-full text-left card p-4 hover:border-dark-600 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">{cat.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary-400">{ticket._id}</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="font-medium text-dark-200 text-sm group-hover:text-dark-50 transition-colors truncate">{ticket.title}</p>
            <p className="text-xs text-dark-500 mt-1">
              {ticket.requester?.name} · {ticket.lastActivity ? formatDistanceToNow(new Date(ticket.lastActivity), { addSuffix: true }) : ''}
              {replies > 0 && ` · ${replies} repl${replies === 1 ? 'y' : 'ies'}`}
              {isOwner && ' · 👤 You'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <TicketStatusBadge status={ticket.status} />
          {ticket.assignedTo && <span className="text-xs text-dark-600">→ {ticket.assignedTo.name}</span>}
        </div>
      </div>
    </motion.button>
  )
}

export default function DiscussionForum() {
  const { user } = useSelector(s => s.auth)
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' })
  const [page, setPage] = useState(1)
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const qc = useQueryClient()

  // ✅ Initialize Socket.io for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket connected for notifications')
    })

    newSocket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      toast.success(notification.title, { duration: 4 })
    })

    newSocket.on('ticket:created', (data) => {
      if (user?.role !== 'user') {
        toast.info(`New ticket: ${data.title}`, { duration: 4 })
        qc.invalidateQueries(['tickets'])
        qc.invalidateQueries(['ticket-stats'])
      }
    })

    newSocket.on('ticket:statusUpdated', (data) => {
      toast.info(`Ticket updated: ${data.newStatus}`, { duration: 4 })
      qc.invalidateQueries(['tickets'])
      qc.invalidateQueries(['ticket', selectedId])
    })

    newSocket.on('ticket:assigned', (data) => {
      if (user?._id === data.assigneeId) {
        toast.success(`You've been assigned: ${data.title}`, { duration: 4 })
      }
    })

    setSocket(newSocket)

    return () => newSocket.disconnect()
  }, [user, selectedId, qc])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', { ...filters, page }],
    queryFn: () => ticketAPI.getAll({ ...filters, page, limit: 15 }),
    keepPreviousData: true,
  })

  const tickets = data?.data?.data || []
  const pagination = data?.data?.pagination

  if (selectedId) return (
    <div>
      <SectionHeader title="Support Tickets" subtitle="Discussion & Issue Resolution" />
      <TicketDetail ticketId={selectedId} onBack={() => setSelectedId(null)} userRole={user?.role} userId={user?._id} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-50 mb-1">Support & Discussion</h1>
          <p className="text-dark-500 text-sm">
            {user?.role === 'admin' ? '👨‍💼 All Tickets' : user?.role === 'organizer' ? '🎯 My & Assigned Tickets' : '👤 My Support Tickets'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
          <button onClick={() => refetch()} className="btn-ghost p-2 rounded-lg text-dark-500 hover:text-dark-200"><RefreshCw size={16} /></button>
          <button onClick={() => setShowCreate(true)} className="btn-primary py-2.5 text-sm flex items-center gap-2"><Plus size={15} />New Ticket</button>
        </div>
      </div>

      <StatsPanel userRole={user?.role} />

      <div className="card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input className="input pl-9 text-sm py-2" placeholder="Search tickets..." value={filters.search} onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1) }} />
          </div>
          <select className="input text-sm py-2 max-w-36" value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input text-sm py-2 max-w-32" value={filters.priority} onChange={e => { setFilters({ ...filters, priority: e.target.value }); setPage(1) }}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="input text-sm py-2 max-w-44" value={filters.category} onChange={e => { setFilters({ ...filters, category: e.target.value }); setPage(1) }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-dark-800" />)}</div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={<MessageSquare size={32} className="text-dark-600" />} title="No tickets found"
          description={filters.search || filters.status ? 'Try adjusting your filters' : "No support tickets yet"}
          action={<button onClick={() => setShowCreate(true)} className="btn-primary">Raise a Ticket</button>} />
      ) : (
        <>
          <div className="space-y-2 mb-5">{tickets.map(t => <TicketRow key={t._id} ticket={t} onClick={setSelectedId} userRole={user?.role} userId={user?._id} />)}</div>
          {pagination && pagination.total > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn-secondary py-2 px-4 text-sm disabled:opacity-50">← Prev</button>
              <span className="flex items-center px-4 text-sm text-dark-400">{page} / {pagination.total}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary py-2 px-4 text-sm disabled:opacity-50">Next →</button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={(t) => setSelectedId(t)} />}
    </div>
  )
}
