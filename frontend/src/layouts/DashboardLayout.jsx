import { Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toggleSidebar, setSidebarOpen } from '../features/ui/uiSlice'
import Sidebar from '../components/Sidebar'
import DashboardHeader from '../components/DashboardHeader'
import { useEffect } from 'react'
import CommandPalette from '../components/CommandPalette'

export default function DashboardLayout() {
  const dispatch = useDispatch()
  const { sidebarOpen, commandPaletteOpen } = useSelector((state) => state.ui)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) dispatch(setSidebarOpen(false))
      else dispatch(setSidebarOpen(true))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        dispatch({ type: 'ui/toggleCommandPalette' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
      {commandPaletteOpen && <CommandPalette />}
    </div>
  )
}
