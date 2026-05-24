import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tournamentAPI, groundAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Trophy, Upload } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '../../components/ui'

const steps = ['Basic Info', 'Details', 'Schedule', 'Review']
const sports = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'chess', 'esports', 'other']
const formats = ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league']

const defaultForm = {
  title: '', description: '', sport: 'cricket', format: 'single_elimination',
  maxTeams: 8, minTeams: 2, entryFee: 0,
  prizeMoney: { first: 0, second: 0, third: 0 },
  teamSize: { min: 1, max: 11 },
  registrationDeadline: '', startDate: '', endDate: '',
  ground: '', rules: '', tags: '',
  banner: null,
}

export default function CreateTournamentPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const { data: groundsData } = useQuery({
    queryKey: ['my-grounds'],
    queryFn: () => groundAPI.getAll(),
  })

  const grounds = groundsData?.data?.data || []
  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm(p => ({ ...p, banner: file }))
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'banner' && val) fd.append('banner', val)
        else if (key === 'prizeMoney' || key === 'teamSize') fd.append(key, JSON.stringify(val))
        else if (val !== null && val !== '') fd.append(key, String(val))
      })
      await tournamentAPI.create(fd)
      toast.success('Tournament submitted for approval!')
      navigate('/organizer/tournaments')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create tournament')
    } finally { setIsSubmitting(false) }
  }

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.description.trim() && form.sport
    if (step === 1) return form.maxTeams >= 2 && form.format
    if (step === 2) return form.registrationDeadline && form.startDate && form.endDate
    return true
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-6"><ArrowLeft size={16} /> Back</button>

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center"><Trophy size={20} className="text-primary-400" /></div>
          <div>
            <h2 className="font-display text-xl font-bold text-dark-50">{steps[step]}</h2>
            <p className="text-dark-500 text-xs">Step {step + 1} of {steps.length}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="input-label">Tournament Title *</label>
              <input className="input" placeholder="E.g. Summer Cricket Championship 2025" value={form.title} onChange={update('title')} />
            </div>
            <div>
              <label className="input-label">Description *</label>
              <textarea className="input h-28 resize-none" placeholder="Describe your tournament..." value={form.description} onChange={update('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Sport *</label>
                <select className="input" value={form.sport} onChange={update('sport')}>
                  {sports.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Format *</label>
                <select className="input" value={form.format} onChange={update('format')}>
                  {formats.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">Tournament Banner (Optional)</label>
              <label className="flex items-center justify-center gap-3 border-2 border-dashed border-dark-600/60 rounded-xl p-6 cursor-pointer hover:border-primary-500/50 transition-all group relative overflow-hidden">
                {previewUrl && <img src={previewUrl} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
                <div className="relative z-10 text-center">
                  <Upload size={24} className="text-dark-500 mx-auto mb-2 group-hover:text-primary-400 transition-colors" />
                  <p className="text-sm text-dark-400">{form.banner ? form.banner.name : 'Click to upload banner image'}</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Max Teams *</label>
                <input type="number" className="input" min={2} max={128} value={form.maxTeams} onChange={e => setForm(p => ({ ...p, maxTeams: +e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Entry Fee (₹)</label>
                <input type="number" className="input" min={0} value={form.entryFee} onChange={e => setForm(p => ({ ...p, entryFee: +e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="input-label">Prize Money (₹)</label>
              <div className="grid grid-cols-3 gap-3">
                {['first', 'second', 'third'].map((place, i) => (
                  <div key={place}>
                    <label className="text-xs text-dark-500 mb-1 block">{['🥇 1st', '🥈 2nd', '🥉 3rd'][i]}</label>
                    <input type="number" className="input" min={0} value={form.prizeMoney[place]}
                      onChange={e => setForm(p => ({ ...p, prizeMoney: { ...p.prizeMoney, [place]: +e.target.value } }))} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Ground (Optional)</label>
              <select className="input" value={form.ground} onChange={update('ground')}>
                <option value="">Select a ground</option>
                {grounds.map((g) => <option key={g._id} value={g._id}>{g.name} - {g.address?.city}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Rules (one per line)</label>
              <textarea className="input h-24 resize-none" placeholder="Each line becomes a rule..." value={form.rules} onChange={update('rules')} />
            </div>
            <div>
              <label className="input-label">Tags (comma separated)</label>
              <input className="input" placeholder="friendly, inter-college, open" value={form.tags} onChange={update('tags')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="input-label">Registration Deadline *</label>
              <input type="datetime-local" className="input" value={form.registrationDeadline} onChange={update('registrationDeadline')} />
            </div>
            <div>
              <label className="input-label">Tournament Start Date *</label>
              <input type="datetime-local" className="input" value={form.startDate} onChange={update('startDate')} />
            </div>
            <div>
              <label className="input-label">Tournament End Date *</label>
              <input type="datetime-local" className="input" value={form.endDate} onChange={update('endDate')} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-dark-800/50 rounded-xl p-5 space-y-3 text-sm">
              {[
                ['Title', form.title],
                ['Sport', form.sport],
                ['Format', form.format.replace(/_/g, ' ')],
                ['Max Teams', form.maxTeams],
                ['Entry Fee', form.entryFee > 0 ? `₹${form.entryFee}` : 'Free'],
                ['Registration Deadline', form.registrationDeadline ? new Date(form.registrationDeadline).toLocaleDateString() : '-'],
                ['Start Date', form.startDate ? new Date(form.startDate).toLocaleDateString() : '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-dark-500">{k}</span>
                  <span className="text-dark-200 font-medium capitalize">{String(v)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-dark-500 bg-dark-800/40 rounded-lg p-3">
              After submission, your tournament will be reviewed by an admin before going live.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 py-3">
              <ArrowLeft size={18} /> Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary flex-1 py-3">
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-1 py-3">
              {isSubmitting ? <><Spinner size={18} /> Submitting...</> : <><CheckCircle size={18} /> Submit Tournament</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
