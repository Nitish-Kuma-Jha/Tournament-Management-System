import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUser } from '../../features/auth/authSlice'
import { userAPI } from '../../services/api'
import { SectionHeader } from '../../components/ui'
import { Camera, Save, Shield, Key, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserProfile() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    city: '',
    country: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await userAPI.updateProfile({ name: form.name, phone: form.phone, address: { city: form.city, country: form.country } })
      dispatch(updateUser(res.data.data.user))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setIsSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    if (!e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('avatar', e.target.files[0])
    try {
      const res = await userAPI.uploadAvatar(formData)
      dispatch(updateUser(res.data.data.user))
      toast.success('Avatar updated!')
    } catch { toast.error('Failed to upload avatar') }
  }

  return (
    <div className="max-w-2xl">
      <SectionHeader title="Profile Settings" subtitle="Manage your account information" />

      {/* Avatar */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-dark-700 overflow-hidden ring-4 ring-dark-600">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-400">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
              <Camera size={14} className="text-dark-950" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h3 className="font-semibold text-dark-100 text-lg">{user?.name}</h3>
            <p className="text-dark-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge text-xs capitalize ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'organizer' ? 'badge-info' : 'badge-success'}`}>{user?.role}</span>
              <span className={`badge text-xs capitalize ${user?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{user?.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-dark-100 mb-5 flex items-center gap-2"><Shield size={16} className="text-primary-400" /> Personal Information</h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="input-label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">City</label>
              <input className="input" placeholder="Your city" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Country</label>
              <input className="input" placeholder="Your country" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="btn-primary">
            <Save size={16} />{isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Document upload */}
      <div className="card p-6">
        <h3 className="font-semibold text-dark-100 mb-2 flex items-center gap-2"><Upload size={16} className="text-primary-400" /> Identity Verification</h3>
        <p className="text-dark-500 text-sm mb-4">Upload a government-issued ID for account verification</p>
        <label className="flex items-center justify-center gap-3 border-2 border-dashed border-dark-600/60 rounded-xl p-8 cursor-pointer hover:border-primary-500/50 transition-all group">
          <Upload size={24} className="text-dark-500 group-hover:text-primary-400 transition-colors" />
          <div>
            <p className="text-dark-300 text-sm font-medium">Click to upload document</p>
            <p className="text-dark-600 text-xs">JPG, PNG or PDF, max 10MB</p>
          </div>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => {
            if (!e.target.files?.[0]) return
            const fd = new FormData()
            fd.append('document', e.target.files[0])
            try {
              await userAPI.uploadDocument(fd)
              toast.success('Document uploaded for review!')
            } catch { toast.error('Upload failed') }
          }} />
        </label>
      </div>
    </div>
  )
}
