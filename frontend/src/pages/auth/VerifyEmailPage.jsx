import { useState, createRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Mail, ArrowRight } from 'lucide-react'
import { Spinner } from '../../components/ui'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const userId = params.get('userId') || ''
  const email = params.get('email') || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const refs = Array.from({ length: 6 }, () => createRef())

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[i] = val.slice(-1)
    setOtp(newOtp)
    if (val && i < 5) refs[i + 1].current?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus()
  }

  const handleSubmit = async () => {
    const code = otp.join('')
    if (code.length < 6) { toast.error('Enter the complete 6-digit OTP'); return }
    setIsLoading(true)
    try {
      await authAPI.verifyEmail({ userId, otp: code })
      toast.success('Email verified! Your account is pending approval.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await authAPI.resendOTP({ email })
      toast.success('New OTP sent!')
    } catch { toast.error('Failed to resend OTP') }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail size={28} className="text-primary-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-dark-50 mb-2">Verify your email</h2>
        <p className="text-dark-400 text-sm mb-6">Enter the 6-digit OTP sent to <strong className="text-dark-200">{email}</strong></p>
        <div className="flex gap-2 justify-center mb-6">
          {otp.map((digit, i) => (
            <input
              key={i} ref={refs[i]}
              className="w-11 h-12 text-center text-xl font-bold bg-dark-800/60 border border-dark-600/60 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/60 transition-all"
              maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
          ))}
        </div>
        <button onClick={handleSubmit} disabled={isLoading} className="btn-primary w-full py-3 mb-4">
          {isLoading ? <Spinner size={18} /> : <>Verify Email <ArrowRight size={18} /></>}
        </button>
        <button onClick={handleResend} className="text-sm text-primary-400 hover:text-primary-300">Didn't receive? Resend OTP</button>
      </motion.div>
    </div>
  )
}
