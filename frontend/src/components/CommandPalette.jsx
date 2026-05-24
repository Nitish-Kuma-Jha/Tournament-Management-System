import { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCommandPaletteOpen } from '../features/ui/uiSlice'
import { motion } from 'framer-motion'
import { Search, Trophy, Users, BarChart3, Settings, ArrowRight } from 'lucide-react'

const commands = [
  { icon: Trophy, label: 'All Tournaments', category: 'Navigate', to: '/tournaments' },
  { icon: Users, label: 'My Teams', category: 'Navigate', to: '/user/teams' },
  { icon: BarChart3, label: 'Analytics', category: 'Navigate', to: '/admin/analytics' },
  { icon: Settings, label: 'Profile Settings', category: 'Navigate', to: '/user/profile' },
  { icon: Trophy, label: 'Create Tournament', category: 'Quick Actions', to: '/organizer/tournaments/create' },
]

export default function CommandPalette() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  const close = useCallback(() => dispatch(setCommandPaletteOpen(false)), [dispatch])
  const execute = (to) => { navigate(to); close() }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowDown') setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
      if (e.key === 'ArrowUp') setActiveIndex(i => Math.max(i - 1, 0))
      if (e.key === 'Enter' && filtered[activeIndex]) execute(filtered[activeIndex].to)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, activeIndex, close])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={close}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.15 }}
        className="w-full max-w-lg card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700/50">
          <Search size={18} className="text-dark-500 flex-shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-dark-100 placeholder-dark-500 outline-none text-sm"
            placeholder="Search commands, pages..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
          />
          <kbd className="text-xs bg-dark-700 text-dark-400 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="py-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-dark-500 text-sm py-8">No results found</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.to} onClick={() => execute(cmd.to)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-primary-500/10 text-primary-300' : 'text-dark-300 hover:bg-dark-800/60'
                }`}
              >
                <cmd.icon size={16} className={i === activeIndex ? 'text-primary-400' : 'text-dark-500'} />
                <div className="flex-1">
                  <span className="text-sm font-medium">{cmd.label}</span>
                  <span className="text-xs text-dark-600 ml-2">{cmd.category}</span>
                </div>
                <ArrowRight size={14} className="text-dark-600" />
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-dark-700/50 flex items-center gap-4 text-xs text-dark-600">
          <span className="flex items-center gap-1"><kbd className="bg-dark-700 px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-dark-700 px-1 py-0.5 rounded">↵</kbd> select</span>
        </div>
      </motion.div>
    </div>
  )
}
