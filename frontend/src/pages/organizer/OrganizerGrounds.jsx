import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groundAPI } from '../../services/api'
import { SectionHeader, PageLoader, EmptyState, Modal } from '../../components/ui'
import { MapPin, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = {
  name: '', sport: 'cricket', capacity: '', contactPhone: '', contactEmail: '',
  address: { city: '', state: '', country: '', street: '' },
  facilities: ''
}

export default function OrganizerGrounds() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const { data, isLoading } = useQuery({
    queryKey: ['organizer-grounds'],
    queryFn: () => groundAPI.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: () => groundAPI.create({
      ...form,
      capacity: +form.capacity,
      facilities: form.facilities.split(',').map(f => f.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-grounds'] })
      setCreateOpen(false)
      setForm(defaultForm)
      toast.success('Ground added!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ground'),
  })

  const grounds = data?.data?.data || []

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader
        title="My Grounds"
        subtitle="Manage venues for your tournaments"
        action={
          <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm py-2">
            <Plus size={16} /> Add Ground
          </button>
        }
      />

      {grounds.length === 0 ? (
        <EmptyState
          icon={<MapPin size={32} className="text-dark-600" />}
          title="No grounds yet"
          description="Add your sports venues to use in tournaments"
          action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> Add Ground</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {grounds.map((g) => (
            <div key={g._id} className="card-hover p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-dark-700 flex items-center justify-center text-xl flex-shrink-0">🏟️</div>
                <div>
                  <h3 className="font-semibold text-dark-100">{g.name}</h3>
                  <p className="text-sm text-dark-500 capitalize">{g.sport} · {g.address?.city}, {g.address?.country}</p>
                </div>
              </div>
              {g.capacity > 0 && <p className="text-xs text-dark-500 mb-2">Capacity: {g.capacity.toLocaleString()}</p>}
              {g.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {g.facilities.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 bg-dark-700 text-dark-400 rounded-full">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Ground">
        <div className="space-y-4">
          <div>
            <label className="input-label">Ground Name</label>
            <input className="input" placeholder="E.g. City Sports Complex" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Sport</label>
              <select className="input" value={form.sport} onChange={e => setForm(p => ({ ...p, sport: e.target.value }))}>
                {['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'other'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Capacity</label>
              <input type="number" className="input" placeholder="500" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">City</label>
              <input className="input" placeholder="City" value={form.address.city} onChange={e => setForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))} />
            </div>
            <div>
              <label className="input-label">Country</label>
              <input className="input" placeholder="Country" value={form.address.country} onChange={e => setForm(p => ({ ...p, address: { ...p.address, country: e.target.value } }))} />
            </div>
          </div>
          <div>
            <label className="input-label">Facilities (comma separated)</label>
            <input className="input" placeholder="Parking, Floodlights, Cafeteria" value={form.facilities} onChange={e => setForm(p => ({ ...p, facilities: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.name} className="btn-primary flex-1">
              {createMutation.isPending ? 'Adding...' : 'Add Ground'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
