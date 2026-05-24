import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Trophy } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-8xl font-display font-extrabold gradient-text mb-4"
        >
          404
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl font-display font-bold text-dark-100 mb-3">Page Not Found</h1>
          <p className="text-dark-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/" className="btn-primary">
              <Home size={18} /> Go Home
            </Link>
            <Link to="/tournaments" className="btn-secondary">
              <Trophy size={18} /> Browse Tournaments
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
