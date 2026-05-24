import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar } from '../features/ui/uiSlice'
import { Menu, Bell, Search, Sun, Moon, Command } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toggleTheme, toggleCommandPalette } from '../features/ui/uiSlice'
import NotificationDropdown from './NotificationDropdown'

const getBreadcrumb = (pathname) => {
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    to: '/' + parts.slice(0, i + 1).join('/'),
  }))
}

export default function DashboardHeader() {
  const dispatch = useDispatch()
  const { theme } = useSelector((state) => state.ui)
  const { unreadCount } = useSelector((state) => state.notifications)
  const { user } = useSelector((state) => state.auth)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const breadcrumbs = getBreadcrumb(location.pathname)

  return (
    <header className="h-16 border-b border-dark-700/50 bg-dark-900/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Menu toggle */}
      <button onClick={() => dispatch(toggleSidebar())} className="btn-ghost p-2 flex-shrink-0">
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-2">
            {i > 0 && <span className="text-dark-600">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-dark-200 font-medium' : 'text-dark-500'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Command palette */}
        <button
          onClick={() => dispatch(toggleCommandPalette())}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/60 border border-dark-700/60 text-dark-500 hover:border-dark-600 transition-all text-sm"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="ml-2 text-xs bg-dark-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Command size={10} /> K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button onClick={() => dispatch(toggleTheme())} className="btn-ghost p-2">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="btn-ghost p-2 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 rounded-full text-xs text-dark-950 font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Avatar */}
        <Link to={`/${user?.role}/profile`} className="flex items-center gap-2 pl-2 border-l border-dark-700">
          <div className="w-8 h-8 rounded-full bg-dark-700 ring-2 ring-primary-500/30 overflow-hidden">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-400 font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-dark-200 leading-none">{user?.name}</p>
            <p className="text-xs text-dark-500 capitalize">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
