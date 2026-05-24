import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Eye, ArrowRight, ArrowLeft, User, Briefcase, ShieldCheck, CheckCircle } from 'lucide-react'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui'

const steps = ['Basic Info', 'Role & Security', 'Review']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [registeredUserId, setRegisteredUserId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'user' })
  const [errors, setErrors] = useState({})

  const updateField = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 0) {
      if (!form.name.trim()) errs.name = 'Name required'
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required'
    }
    if (s === 1) {
      if (!form.password || form.password.length < 8) errs.password = 'Min 8 characters'
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Must include uppercase, lowercase, and number'
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role })
      setRegisteredUserId(res.data.data.userId)
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-10 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-dark-50 mb-3">Registration Successful!</h2>
          <p className="text-dark-400 mb-6">An OTP has been sent to <strong className="text-dark-200">{form.email}</strong>. Please verify your email to activate your account.</p>
          <button onClick={() => navigate(`/verify-email?userId=${registeredUserId}&email=${form.email}`)} className="btn-primary w-full py-3">
            Verify Email <ArrowRight size={18} />
          </button>
          <p className="text-dark-600 text-xs mt-4">After email verification, your account will be reviewed by an admin.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-primary-500 text-dark-950' : i === step ? 'bg-primary-500/20 border-2 border-primary-500 text-primary-400' : 'bg-dark-700 text-dark-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary-500' : 'bg-dark-700'}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
              <Trophy size={18} className="text-dark-950" />
            </div>
            <span className="font-display font-bold text-dark-100">Tournament System</span>
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-dark-50">Create your account</h2>
              <div>
                <label className="input-label">Full Name</label>
                <input className={`input ${errors.name ? 'border-red-500/60' : ''}`} placeholder="Enter your full name" value={form.name} onChange={updateField('name')} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="input-label">Email Address</label>
                <input type="email" className={`input ${errors.email ? 'border-red-500/60' : ''}`} placeholder="youremail@example.com" value={form.email} onChange={updateField('email')} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="input-label">Phone (Optional)</label>
                <input className="input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={updateField('phone')} />
              </div>
              <button onClick={next} className="btn-primary w-full py-3">Continue <ArrowRight size={18} /></button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-dark-50">Account Type & Security</h2>
              <div>
                <label className="input-label mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'user', icon: User, title: 'Player', desc: 'Join tournaments, manage teams' },
                    { value: 'organizer', icon: Briefcase, title: 'Organizer', desc: 'Host & manage tournaments' },
                  ].map(({ value, icon: Icon, title, desc }) => (
                    <button key={value} type="button" onClick={() => setForm(p => ({ ...p, role: value }))}
                      className={`p-4 rounded-xl border text-left transition-all ${form.role === value ? 'border-primary-500/60 bg-primary-500/10' : 'border-dark-600/60 bg-dark-800/40 hover:border-dark-500'}`}>
                      <Icon size={20} className={form.role === value ? 'text-primary-400 mb-2' : 'text-dark-500 mb-2'} />
                      <p className={`font-semibold text-sm ${form.role === value ? 'text-primary-300' : 'text-dark-200'}`}>{title}</p>
                      <p className="text-xs text-dark-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'border-red-500/60' : ''}`} placeholder="Min 8 chars, include A-z, 0-9" value={form.password} onChange={updateField('password')} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"><Eye size={16} /></button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="input-label">Confirm Password</label>
                <input type="password" className={`input ${errors.confirmPassword ? 'border-red-500/60' : ''}`} placeholder="Repeat password" value={form.confirmPassword} onChange={updateField('confirmPassword')} />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="btn-secondary flex-1 py-3"><ArrowLeft size={18} /> Back</button>
                <button onClick={next} className="btn-primary flex-1 py-3">Continue <ArrowRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-dark-50">Review & Submit</h2>
              <div className="bg-dark-800/50 rounded-xl p-5 space-y-3 text-sm">
                {[['Name', form.name], ['Email', form.email], ['Role', form.role === 'user' ? 'Player' : 'Organizer'], ['Phone', form.phone || 'Not provided']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-dark-500">{k}</span>
                    <span className="text-dark-200 font-medium capitalize">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 bg-primary-500/5 border border-primary-500/20 rounded-lg p-4">
                <ShieldCheck size={18} className="text-primary-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-dark-400">Your data is encrypted and protected. After registration, you'll verify your email and an admin will review your account.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="btn-secondary flex-1 py-3"><ArrowLeft size={18} /> Back</button>
                <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 py-3">
                  {isLoading ? <Spinner size={18} /> : <>Create Account <CheckCircle size={18} /></>}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-dark-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
