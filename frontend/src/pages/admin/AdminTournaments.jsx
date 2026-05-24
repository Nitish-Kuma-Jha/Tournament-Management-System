import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI } from '../../services/api'
import { SectionHeader, PageLoader, StatusBadge } from '../../components/ui'
import { Search, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function AdminTournaments() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tournaments', search, status, page],
    queryFn: () => tournamentAPI.getAll({
      ...(search && { search }),
      ...(status !== 'all' && { status }),
      page, limit: 15,
    }),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => tournamentAPI.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] }); toast.success('Tournament approved!') },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => tournamentAPI.reject(id, { reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] }); setRejectId(null); setRejectReason(''); toast.success('Tournament rejected') },
  })

  const tournaments = data?.data?.data || []
  const pagination = data?.data?.pagination

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader title="Tournament Management" />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
          <input className="input pl-10" placeholder="Search tournaments..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input max-w-48" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="all">All Status</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="registration_open">Registration Open</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Organizer</th><th>Sport</th><th>Status</th><th>Teams</th><th>Start</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t._id}>
                  <td><Link to={`/tournaments/${t._id}`} className="font-medium text-dark-200 hover:text-primary-400 transition-colors text-sm">{t.title}</Link></td>
                  <td className="text-dark-400 text-sm">{t.organizer?.name}</td>
                  <td className="capitalize text-dark-400 text-sm">{t.sport}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-dark-400 text-sm">{t.registeredTeams?.length || 0}/{t.maxTeams}</td>
                  <td className="text-dark-500 text-xs">{format(new Date(t.startDate), 'MMM d, yyyy')}</td>
                  <td>
                    {t.status === 'pending_approval' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => approveMutation.mutate(t._id)} className="btn-ghost text-xs py-1 px-2.5 text-green-400"><CheckCircle size={13} /> Approve</button>
                        <button onClick={() => setRejectId(t._id)} className="btn-ghost text-xs py-1 px-2.5 text-red-400"><X size={13} /> Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination?.total > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-dark-700/50">
            <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-50">← Prev</button>
            <span className="flex items-center px-4 text-sm text-dark-400">{page} / {pagination.total}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-50">Next →</button>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-semibold text-dark-100 mb-3">Reject Tournament</h3>
            <textarea className="input h-24 resize-none mb-4" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })} disabled={!rejectReason.trim()} className="btn-danger flex-1">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
