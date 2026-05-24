import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Lock, CheckCircle } from 'lucide-react'
import { Spinner } from '../../components/ui'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const email = params.get('email') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    setIsLoading(true)
    try {
      await authAPI.resetPassword({ email, otp: form.otp, newPassword: form.newPassword })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-red-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-dark-50 mb-1">Set New Password</h2>
          <p className="text-dark-500 text-sm">Enter the OTP sent to {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">OTP Code</label>
            <input className="input text-center tracking-widest text-xl font-bold" maxLength={6} placeholder="000000" value={form.otp} onChange={e => setForm(p => ({ ...p, otp: e.target.value }))} required />
          </div>
          <div>
            <label className="input-label">New Password</label>
            <input type="password" className="input" placeholder="Min 8 characters" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="input-label">Confirm Password</label>
            <input type="password" className="input" placeholder="Repeat new password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
            {isLoading ? <Spinner size={18} /> : <>Reset Password <CheckCircle size={18} /></>}
          </button>
        </form>
        <p className="text-center text-sm text-dark-500 mt-4">
          <Link to="/login" className="text-primary-400 hover:text-primary-300">Back to login</Link>
        </p>
      </motion.div>
    </div>
  )
}
