import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tournamentAPI } from '../../services/api'
import TournamentCard from '../../components/TournamentCard'
import { CardSkeleton, EmptyState } from '../../components/ui'
import { Search, Filter, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

const sports = ['all', 'cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'chess', 'esports']
const statuses = ['all', 'registration_open', 'approved', 'ongoing']

export default function TournamentsPublicPage() {
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['public-tournaments', search, sport, status, page],
    queryFn: () => tournamentAPI.getAll({
      ...(search && { search }),
      ...(sport !== 'all' && { sport }),
      ...(status !== 'all' && { status }),
      page, limit: 9,
    }),
    keepPreviousData: true,
  })

  const tournaments = data?.data?.data || []
  const pagination = data?.data?.pagination

  return (
    <div className="page-container">
      {/* Header */}
      <div className="text-center mb-10 pt-4">
        <h1 className="text-4xl font-display font-bold text-dark-50 mb-3">Browse Tournaments</h1>
        <p className="text-dark-500">Find and join the perfect tournament for your team</p>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              className="input pl-10"
              placeholder="Search tournaments..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select className="input max-w-44" value={sport} onChange={e => { setSport(e.target.value); setPage(1) }}>
            {sports.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sports' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="input max-w-52" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy size={32} className="text-dark-600" />}
          title="No tournaments found"
          description="Try adjusting your search or filters to find tournaments"
        />
      ) : (
        <>          <div className="flex items-center justify-between mb-6">
            <p className="text-dark-500 text-sm">{pagination?.totalItems || 0} tournaments found</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tournaments.map((t) => (
              <motion.div key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {console.log(t._id)}
                <TournamentCard tournament={t} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn-secondary py-2 px-4 text-sm disabled:opacity-50">← Prev</button>
              <span className="flex items-center px-4 text-sm text-dark-400">{page} / {pagination.total}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary py-2 px-4 text-sm disabled:opacity-50">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
