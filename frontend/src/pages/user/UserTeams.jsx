
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamAPI } from '../../services/api'
import { SectionHeader, PageLoader, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { Users, Plus, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function UserTeams() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', sport: 'cricket', description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamAPI.getMyTeams(),
  })

  const createMutation = useMutation({
    mutationFn: (data) => teamAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] })
      setCreateOpen(false)
      setNewTeam({ name: '', sport: 'cricket', description: '' })
      toast.success('Team created successfully!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create team'),
  })

  const teams = data?.data?.data?.teams || []

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader
        title="My Teams"
        subtitle="Manage your teams and members"
        action={
          <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm py-2">
            <Plus size={16} /> Create Team
          </button>
        }
      />

      {teams.length === 0 ? (
        <EmptyState
          icon={<Users size={32} className="text-dark-600" />}
          title="No teams yet"
          description="Create your first team to start participating in tournaments"
          action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> Create Team</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team) => (
            <motion.div key={team._id} className="card-hover p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {team.logo?.url ? <img src={team.logo.url} alt={team.name} className="w-full h-full object-cover" /> : '⚽'}
                </div>
                <div>
                  <h3 className="font-semibold text-dark-100">{team.name}</h3>
                  <p className="text-sm text-dark-500 capitalize">{team.sport}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-5 p-3 bg-dark-800/40 rounded-xl">
                <div><div className="font-bold text-dark-100">{team.stats?.tournamentsPlayed || 0}</div><div className="text-xs text-dark-500">Played</div></div>
                <div><div className="font-bold text-green-400">{team.stats?.wins || 0}</div><div className="text-xs text-dark-500">Won</div></div>
                <div><div className="font-bold text-red-400">{team.stats?.losses || 0}</div><div className="text-xs text-dark-500">Lost</div></div>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-2">Members ({team.members?.length || 0})</p>
                <div className="flex -space-x-2">
                  {(team.members || []).slice(0, 5).map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-dark-600 border-2 border-dark-800 flex items-center justify-center text-xs font-bold text-dark-300 overflow-hidden">
                      {m.user?.avatar?.url ? <img src={m.user.avatar.url} className="w-full h-full object-cover" /> : m.user?.name?.[0] || '?'}
                    </div>
                  ))}
                  {(team.members?.length || 0) > 5 && (
                    <div className="w-8 h-8 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-xs text-dark-400">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create team modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Team">
        <div className="space-y-4">
          <div>
            <label className="input-label">Team Name</label>
            <input className="input" placeholder="Enter team name" value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Sport</label>
            <select className="input" value={newTeam.sport} onChange={e => setNewTeam(p => ({ ...p, sport: e.target.value }))}>
              {['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'chess', 'esports', 'other'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Description (Optional)</label>
            <textarea className="input h-20 resize-none" placeholder="Brief team description..." value={newTeam.description} onChange={e => setNewTeam(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createMutation.mutate(newTeam)}
              disabled={createMutation.isPending || !newTeam.name}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
