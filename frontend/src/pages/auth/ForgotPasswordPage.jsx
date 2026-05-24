
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Mail, ArrowRight } from 'lucide-react'
import { Spinner } from '../../components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authAPI.forgotPassword({ email })
      setSent(true)
      toast.success('OTP sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail size={22} className="text-primary-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-dark-50 mb-1">Reset Password</h2>
          <p className="text-dark-500 text-sm">Enter your email to receive a reset OTP</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-dark-400 text-sm mb-4">OTP sent to <strong className="text-dark-200">{email}</strong>.</p>
            <Link to={`/reset-password?email=${email}`} className="btn-primary w-full py-3">Enter OTP <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
              <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? <Spinner size={18} /> : <>Send OTP <ArrowRight size={18} /></>}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-dark-500 mt-4">
          <Link to="/login" className="text-primary-400 hover:text-primary-300">Back to login</Link>
        </p>
      </motion.div>
    </div>
  )
}
