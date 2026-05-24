import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI, registrationAPI } from '../../services/api'
import { PageLoader, StatusBadge, SectionHeader, Spinner } from '../../components/ui'
import { ArrowLeft, Users, Zap, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function TournamentManagePage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: tData, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getOne(id),
  })

  const { data: rData } = useQuery({
    queryKey: ['tournament-registrations', id],
    queryFn: () => registrationAPI.getTournamentRegistrations(id, { limit: 50 }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['tournament-stats', id],
    queryFn: () => tournamentAPI.getStats(id),
  })

  const bracketMutation = useMutation({
    mutationFn: () => tournamentAPI.generateBracket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
      toast.success('Bracket generated!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate bracket'),
  })

  const approveMutation = useMutation({
    mutationFn: (regId) => registrationAPI.approve(regId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations', id] })
      toast.success('Registration approved!')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ regId, reason }) => registrationAPI.reject(regId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations', id] })
      setRejectId(null)
      setRejectReason('')
      toast.success('Registration rejected')
    },
  })

  if (isLoading) return <PageLoader />

  const tournament = tData?.data?.data?.tournament
  const registrations = rData?.data?.data || []
  const stats = statsData?.data?.data

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/organizer/tournaments" className="btn-ghost text-sm"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-display font-bold text-dark-50">{tournament?.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={tournament?.status} />
            <span className="text-dark-500 text-xs capitalize">{tournament?.sport}</span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            ['Total Registrations', stats.totalRegistrations, 'text-dark-100'],
            ['Approved', stats.approvedRegistrations, 'text-green-400'],
            ['Pending', stats.pendingRegistrations, 'text-amber-400'],
            ['Spots Left', stats.spotsLeft, 'text-blue-400'],
          ].map(([label, val, cls]) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${cls}`}>{val}</div>
              <div className="text-xs text-dark-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => bracketMutation.mutate()}
          disabled={bracketMutation.isPending || (tournament?.registeredTeams?.length || 0) < 2}
          className="btn-secondary text-sm py-2"
        >
          {bracketMutation.isPending ? <Spinner size={15} /> : <Zap size={15} />}
          Generate Bracket
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-dark-700/50">
          <h3 className="font-semibold text-dark-100 flex items-center gap-2"><Users size={16} /> Registrations</h3>
        </div>
        {registrations.length === 0 ? (
          <div className="py-12 text-center text-dark-500 text-sm">No registrations yet</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Team</th><th>Registered By</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id}>
                    <td className="font-medium text-dark-100">{reg.team?.name || 'Unknown'}</td>
                    <td className="text-dark-400 text-sm">{reg.registeredBy?.name}</td>
                    <td className="text-dark-500 text-xs">{format(new Date(reg.createdAt), 'MMM d, yyyy')}</td>
                    <td><StatusBadge status={reg.status} /></td>
                    <td>
                      {reg.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => approveMutation.mutate(reg._id)} disabled={approveMutation.isPending} className="btn-ghost text-xs py-1 px-2.5 text-green-400 hover:text-green-300">
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button onClick={() => setRejectId(reg._id)} className="btn-ghost text-xs py-1 px-2.5 text-red-400 hover:text-red-300">
                            <X size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tournament?.bracket && (
        <div className="card p-6 mt-6">
          <SectionHeader title="Tournament Bracket" />
          <div className="bg-dark-800/50 rounded-xl p-4 text-xs text-dark-400 font-mono overflow-x-auto">
            <p className="text-dark-300 mb-2 font-sans text-sm font-medium">
              {tournament.bracket.type?.replace(/_/g, ' ').toUpperCase()} BRACKET
            </p>
            {tournament.bracket.rounds?.map((round, i) => (
              <div key={i} className="mb-4">
                <p className="text-primary-400 font-semibold mb-2 font-sans">Round {i + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  {round.map((match) => (
                    <div key={match.matchNumber} className="bg-dark-700/60 rounded-lg p-2">
                      <p className="text-dark-400 text-xs mb-1">Match {match.matchNumber}</p>
                      <p className={match.result?.winner === match.teamA ? 'text-green-400' : 'text-dark-300'}>{match.teamAName || 'TBD'}</p>
                      <p className="text-dark-600 text-xs text-center my-0.5">vs</p>
                      <p className={match.result?.winner === match.teamB ? 'text-green-400' : 'text-dark-300'}>{match.teamBName || 'TBD'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-semibold text-dark-100 mb-3">Reject Registration</h3>
            <textarea className="input h-24 resize-none mb-4" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => rejectMutation.mutate({ regId: rejectId, reason: rejectReason })} disabled={!rejectReason.trim() || rejectMutation.isPending} className="btn-danger flex-1">
                {rejectMutation.isPending ? <Spinner size={16} /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
