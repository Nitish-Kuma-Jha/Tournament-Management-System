import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-primary-500 ${className}`} />
}

export function Skeleton({ className = '' }) {
  return <div className={`rounded-lg bg-dark-800 shimmer ${className}`} />
}

export function StatCard({ title, value, icon, change, changeType = 'neutral', color = 'amber' }) {
  const colorMap = {
    amber: 'from-primary-500/20 to-primary-600/10 border-primary-500/20 text-primary-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
  }
  return (
    <motion.div className="card p-6" whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} border flex items-center justify-center`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            changeType === 'up' ? 'bg-green-500/15 text-green-400' :
            changeType === 'down' ? 'bg-red-500/15 text-red-400' :
            'bg-dark-700 text-dark-400'
          }`}>
            {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : ''} {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-dark-50 mb-1">{value}</p>
        <p className="text-sm text-dark-500">{title}</p>
      </div>
    </motion.div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-dark-200 mb-2">{title}</h3>
      {description && <p className="text-dark-500 text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}
        className={`relative w-full ${sizeMap[size]} card shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50">
            <h2 className="font-display font-semibold text-dark-50 text-lg">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-md">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )
}

const statusConfig = {
  active: { label: 'Active', class: 'badge-success' },
  pending: { label: 'Pending', class: 'badge-warning' },
  pending_approval: { label: 'Pending Approval', class: 'badge-warning' },
  suspended: { label: 'Suspended', class: 'badge-danger' },
  approved: { label: 'Approved', class: 'badge-success' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  registration_open: { label: 'Registration Open', class: 'badge-info' },
  registration_closed: { label: 'Reg. Closed', class: 'badge-warning' },
  ongoing: { label: 'Ongoing', class: 'badge-success' },
  completed: { label: 'Completed', class: 'badge-purple' },
  cancelled: { label: 'Cancelled', class: 'badge-danger' },
  draft: { label: 'Draft', class: 'badge bg-dark-700 text-dark-400 border border-dark-600' },
  paid: { label: 'Paid', class: 'badge-success' },
  withdrawn: { label: 'Withdrawn', class: 'badge bg-dark-700 text-dark-400' },
  waitlisted: { label: 'Waitlisted', class: 'badge-info' },
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'badge bg-dark-700 text-dark-400' }
  return <span className={config.class}>{config.label}</span>
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm', isDestructive = false, isLoading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${isDestructive ? 'bg-red-500/15' : 'bg-primary-500/15'}`}>
          <span className="text-2xl">{isDestructive ? '⚠️' : '❓'}</span>
        </div>
        <h3 className="font-semibold text-dark-50 text-lg mb-2">{title}</h3>
        <p className="text-dark-400 text-sm mb-6">{description}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} disabled={isLoading} className={isDestructive ? 'btn-danger' : 'btn-primary'}>
            {isLoading ? <Spinner size={16} /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size={32} className="mx-auto mb-4" />
        <p className="text-dark-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 flex-1 ${j === 0 ? 'w-8 h-8 rounded-full' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-dark-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
