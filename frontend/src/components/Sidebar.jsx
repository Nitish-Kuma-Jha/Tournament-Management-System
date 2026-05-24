import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '../features/auth/authSlice'
import { toggleSidebarCollapsed } from '../features/ui/uiSlice'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, LayoutDashboard, Users, CalendarDays, CreditCard,
  User, LogOut, ChevronLeft, ChevronRight, MapPin,
  BarChart3, ClipboardList, ScrollText, Plus, MessageSquare,
} from 'lucide-react'

const userLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/user' },
  { icon: Users, label: 'My Teams', to: '/user/teams' },
  { icon: CalendarDays, label: 'Registrations', to: '/user/registrations' },
  { icon: CreditCard, label: 'Payments', to: '/user/payments' },
  { icon: MessageSquare, label: 'Support', to: '/user/support' },
  { icon: User, label: 'Profile', to: '/user/profile' },
]

const organizerLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/organizer' },
  { icon: Trophy, label: 'Tournaments', to: '/organizer/tournaments' },
  { icon: MapPin, label: 'Grounds', to: '/organizer/grounds' },
  { icon: MessageSquare, label: 'Support', to: '/organizer/support' },
  { icon: User, label: 'Profile', to: '/organizer/profile' },
]

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
  { icon: Users, label: 'Users', to: '/admin/users' },
  { icon: Trophy, label: 'Tournaments', to: '/admin/tournaments' },
  { icon: ClipboardList, label: 'Approvals', to: '/admin/pending-approvals' },
  { icon: BarChart3, label: 'Analytics', to: '/admin/analytics' },
  { icon: MessageSquare, label: 'Support Tickets', to: '/admin/support' },
  { icon: ScrollText, label: 'Audit Logs', to: '/admin/audit-logs' },
  { icon: User, label: 'Profile', to: '/admin/profile' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui)

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'organizer' ? organizerLinks
    : userLinks

  const roleLabel = user?.role === 'admin' ? 'Admin Panel'
    : user?.role === 'organizer' ? 'Organizer Hub'
    : 'My Dashboard'

  const roleColor = user?.role === 'admin' ? 'text-red-400'
    : user?.role === 'organizer' ? 'text-blue-400'
    : 'text-green-400'

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            fixed md:static inset-y-0 left-0 z-30
            flex flex-col border-r border-dark-700/50 bg-dark-900/95 backdrop-blur-sm
            transition-all duration-300
            ${sidebarCollapsed ? 'w-16' : 'w-64'}
          `}
        >
          {/* Header */}
          <div className={`h-16 flex items-center border-b border-dark-700/50 px-4 gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow">
              <Trophy size={16} className="text-dark-950" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-dark-50 text-sm truncate">Tournament System</p>
                <p className={`text-xs font-medium truncate ${roleColor}`}>{roleLabel}</p>
              </div>
            )}
            <button
              onClick={() => dispatch(toggleSidebarCollapsed())}
              className="hidden md:flex btn-ghost p-1.5 rounded-md ml-auto"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* User info */}
          {!sidebarCollapsed && (
            <div className="px-4 py-3 border-b border-dark-700/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-dark-700 ring-2 ring-primary-500/30 flex-shrink-0 overflow-hidden">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400 font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-100 truncate">{user?.name}</p>
                  <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
            {user?.role === 'organizer' && !sidebarCollapsed && (
              <div className="mb-4 px-2">
                <Link to="/organizer/tournaments/create" className="btn-primary w-full text-sm py-2">
                  <Plus size={16} /> New Tournament
                </Link>
              </div>
            )}

            {links.map(({ icon: Icon, label, to }) => {
              const base = `/${user?.role}`
              const isActive = to === base
                ? location.pathname === to
                : location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  title={sidebarCollapsed ? label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    font-medium text-sm group relative
                    ${isActive
                      ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                      : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/60'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-primary-400' : 'text-dark-500 group-hover:text-dark-300'} />
                  {!sidebarCollapsed && <span>{label}</span>}
                  {isActive && !sidebarCollapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-400"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-dark-700/50">
            <button
              onClick={() => dispatch(logoutUser())}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200
                font-medium text-sm
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed ? 'Logout' : undefined}
            >
              <LogOut size={18} />
              {!sidebarCollapsed && <span>Log Out</span>}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
