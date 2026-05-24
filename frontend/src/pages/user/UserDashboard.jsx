import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { analyticsAPI, tournamentAPI, registrationAPI } from '../../services/api'
import { StatCard, SectionHeader, PageLoader, StatusBadge, CardSkeleton } from '../../components/ui'
import { Trophy, Users, CalendarDays, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import TournamentCard from '../../components/TournamentCard'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }) }

export default function UserDashboard() {
  const { user } = useSelector((state) => state.auth)

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: () => analyticsAPI.user(),
  })

  const { data: registrationsData } = useQuery({
    queryKey: ['user-registrations'],
    queryFn: () => registrationAPI.getMyRegistrations({ limit: 5 }),
  })

  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['open-tournaments'],
    queryFn: () => tournamentAPI.getAll({ status: 'registration_open', limit: 3 }),
  })

  const analytics = analyticsData?.data?.data
  const registrations = registrationsData?.data?.data || []
  const openTournaments = tournamentsData?.data?.data || []

  return (
    <div>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-50 mb-1">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-dark-500 text-sm">Here's your tournament overview.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Registrations', value: analytics?.summary?.totalRegistrations || 0, icon: <Trophy size={22} className="text-primary-400" />, color: 'amber' },
          { title: 'Active Teams', value: analytics?.summary?.totalTeams || 0, icon: <Users size={22} className="text-blue-400" />, color: 'blue' },
          { title: 'Approved', value: analytics?.statusBreakdown?.approved || 0, icon: <CalendarDays size={22} className="text-green-400" />, color: 'green' },
          { title: 'Pending', value: analytics?.statusBreakdown?.pending || 0, icon: <TrendingUp size={22} className="text-purple-400" />, color: 'purple' },
        ].map((stat, i) => (
          <motion.div key={stat.title} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Team stats chart */}
      {analytics?.teamStats?.length > 0 && (
        <div className="card p-6 mb-8">
          <SectionHeader title="Team Performance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.teamStats.map((team) => (
              <div key={team.name} className="bg-dark-800/50 rounded-xl p-4">
                <p className="font-semibold text-dark-100 text-sm mb-1">{team.name}</p>
                <p className="text-xs text-dark-500 capitalize mb-3">{team.sport}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><div className="text-green-400 font-bold text-lg">{team.wins}</div><div className="text-dark-500">Won</div></div>
                  <div><div className="text-red-400 font-bold text-lg">{team.losses}</div><div className="text-dark-500">Lost</div></div>
                  <div><div className="text-primary-400 font-bold text-lg">{team.tournamentsPlayed}</div><div className="text-dark-500">Played</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <SectionHeader title="Recent Registrations" action={<Link to="/user/registrations" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>} />
          {registrations.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-8">No registrations yet</p>
          ) : (
            <div className="space-y-3">
              {registrations.slice(0, 5).map((reg) => (
                <div key={reg._id} className="flex items-center gap-3 p-3 bg-dark-800/40 rounded-xl">
                  <div className="w-9 h-9 bg-dark-700 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🏆</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate">{reg.tournament?.title || 'Unknown'}</p>
                    <p className="text-xs text-dark-500">{reg.team?.name || 'Unknown team'}</p>
                  </div>
                  <StatusBadge status={reg.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeader title="Open Tournaments" action={<Link to="/tournaments" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>} />
          {tournamentsLoading ? (
            <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <div className="space-y-4">
              {openTournaments.slice(0, 2).map((t) => <TournamentCard key={t._id} tournament={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
