import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, tournamentAPI, registrationAPI } from '../../services/api'
import { SectionHeader, PageLoader, StatusBadge } from '../../components/ui'
import { CheckCircle, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPendingApprovals() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => adminAPI.getPendingApprovals(),
    refetchInterval: 30000,
  })

  const verifyUser = useMutation({
    mutationFn: (id) => adminAPI.verifyDocument(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pending'] }); toast.success('User verified!') },
  })

  const approveTournament = useMutation({
    mutationFn: (id) => tournamentAPI.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pending'] }); toast.success('Tournament approved!') },
  })

  const approveRegistration = useMutation({
    mutationFn: (id) => registrationAPI.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pending'] }); toast.success('Registration approved!') },
  })

  if (isLoading) return <PageLoader />

  const pending = data?.data?.data

  return (
    <div>
      <SectionHeader title="Pending Approvals" subtitle="Review and approve pending requests" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Users */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={18} className="text-amber-400" />
            <h3 className="font-semibold text-dark-100">Pending Users</h3>
            <span className="badge badge-warning ml-auto">{pending?.pendingUsers?.length || 0}</span>
          </div>
          {!pending?.pendingUsers?.length ? (
            <p className="text-dark-500 text-sm text-center py-8">All clear!</p>
          ) : (
            <div className="space-y-3">
              {pending.pendingUsers.map((u) => (
                <div key={u._id} className="flex items-start gap-3 p-3 bg-dark-800/40 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center font-bold text-primary-400 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-200 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-dark-500 truncate">{u.email}</p>
                    <p className="text-xs text-dark-600 capitalize mt-0.5">{u.role}</p>
                  </div>
                  <button onClick={() => verifyUser.mutate(u._id)} className="btn-ghost p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg flex-shrink-0">
                    <CheckCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournaments */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={18} className="text-blue-400" />
            <h3 className="font-semibold text-dark-100">Pending Tournaments</h3>
            <span className="badge badge-info ml-auto">{pending?.pendingTournaments?.length || 0}</span>
          </div>
          {!pending?.pendingTournaments?.length ? (
            <p className="text-dark-500 text-sm text-center py-8">All clear!</p>
          ) : (
            <div className="space-y-3">
              {pending.pendingTournaments.map((t) => (
                <div key={t._id} className="p-3 bg-dark-800/40 rounded-xl">
                  <p className="font-medium text-dark-200 text-sm mb-0.5">{t.title}</p>
                  <p className="text-xs text-dark-500 capitalize">{t.sport} · {t.organizer?.name}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => approveTournament.mutate(t._id)} className="btn-ghost text-xs py-1 px-3 text-green-400 hover:bg-green-500/10 flex-1 justify-center">
                      <CheckCircle size={13} /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registrations */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={18} className="text-purple-400" />
            <h3 className="font-semibold text-dark-100">Pending Registrations</h3>
            <span className="badge badge-purple ml-auto">{pending?.pendingRegistrations?.length || 0}</span>
          </div>
          {!pending?.pendingRegistrations?.length ? (
            <p className="text-dark-500 text-sm text-center py-8">All clear!</p>
          ) : (
            <div className="space-y-3">
              {pending.pendingRegistrations.map((r) => (
                <div key={r._id} className="p-3 bg-dark-800/40 rounded-xl">
                  <p className="font-medium text-dark-200 text-sm">{r.team?.name}</p>
                  <p className="text-xs text-dark-500 truncate">{r.tournament?.title}</p>
                  <p className="text-xs text-dark-600">{r.registeredBy?.name}</p>
                  <button onClick={() => approveRegistration.mutate(r._id)} className="btn-ghost text-xs py-1 px-3 text-green-400 mt-2 hover:bg-green-500/10 w-full justify-center">
                    <CheckCircle size={13} /> Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
