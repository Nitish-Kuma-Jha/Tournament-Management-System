import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '../features/auth/authSlice'
import { toggleTheme } from '../features/ui/uiSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sun, Moon, Menu, X, LogIn, LayoutDashboard, Bell } from 'lucide-react'
import { useState } from 'react'
import NotificationDropdown from './NotificationDropdown'

const navLinks = [
  { label: 'Tournaments', to: '/tournaments' },
  { label: 'About', to: '/#about' },
  { label: 'FAQ', to: '/#faq' },
]

export default function Navbar() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { theme } = useSelector((state) => state.ui)
  const { unreadCount } = useSelector((state) => state.notifications)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-dark-700/50 backdrop-blur-md bg-dark-950/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-glow"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Trophy size={16} className="text-dark-950" />
          </motion.div>
          <span className="font-display font-bold text-lg text-dark-50">
            Tournament<span className="text-primary-500">.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${location.pathname === link.to
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/60'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-dark-400" /> : <Moon size={18} className="text-dark-400" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="btn-ghost p-2 rounded-lg relative"
                  aria-label="Notifications"
                >
                  <Bell size={18} className="text-dark-400" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-dark-950 text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
                </AnimatePresence>
              </div>

              <Link to="/dashboard" className="btn-secondary py-2 text-sm">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-dark-700">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-700 ring-2 ring-primary-500/40">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400 font-bold text-sm">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm">
                <LogIn size={16} />
                Login
              </Link>
              <Link to="/register" className="btn-primary py-2 text-sm">
                Get Started
              </Link>
            </div>
          )}

          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-dark-700/50 bg-dark-950 px-4 py-4 space-y-1"
          >
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800/60"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
