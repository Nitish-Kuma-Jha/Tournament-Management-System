import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { analyticsAPI, tournamentAPI } from '../../services/api'
import { StatCard, SectionHeader, StatusBadge } from '../../components/ui'
import { Trophy, Users, CalendarDays, Clock, Plus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const CHART_COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6']

export default function OrganizerDashboard() {
  const { user } = useSelector((state) => state.auth)

  const { data: analyticsData } = useQuery({
    queryKey: ['organizer-analytics'],
    queryFn: () => analyticsAPI.organizer({ period: '30' }),
  })

  const { data: tournamentsData } = useQuery({
    queryKey: ['organizer-tournaments-recent'],
    queryFn: () => tournamentAPI.getMyTournaments({ limit: 5 }),
  })

  const analytics = analyticsData?.data?.data
  const recentTournaments = tournamentsData?.data?.data || []

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-50 mb-1">Organizer Dashboard</h1>
          <p className="text-dark-500 text-sm">Manage your tournaments and track registrations.</p>
        </div>
        <Link to="/organizer/tournaments/create" className="btn-primary">
          <Plus size={16} /> New Tournament
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Tournaments', value: analytics?.summary?.totalTournaments || 0, icon: <Trophy size={22} className="text-primary-400" />, color: 'amber' },
          { title: 'Total Registrations', value: analytics?.summary?.totalRegistrations || 0, icon: <Users size={22} className="text-blue-400" />, color: 'blue' },
          { title: 'Active Sports', value: analytics?.sportBreakdown?.length || 0, icon: <CalendarDays size={22} className="text-green-400" />, color: 'green' },
          { title: 'Pending Reviews', value: (analytics?.statusBreakdown?.find((s) => s._id === 'pending')?.count || 0), icon: <Clock size={22} className="text-purple-400" />, color: 'purple' },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card p-6">
          <SectionHeader title="Registration Trend (30 days)" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics?.registrationTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="rgba(245,158,11,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <SectionHeader title="Registration Status" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics?.statusBreakdown || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {(analytics?.statusBreakdown || []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-3">
            {(analytics?.statusBreakdown || []).map((item, i) => (
              <div key={item._id} className="flex items-center gap-1.5 text-xs text-dark-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="capitalize">{item._id}</span> ({item.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent tournaments */}
      <div className="card p-6">
        <SectionHeader
          title="Recent Tournaments"
          action={<Link to="/organizer/tournaments" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <ArrowRight size={12} /></Link>}
        />
        {recentTournaments.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-8">No tournaments yet. <Link to="/organizer/tournaments/create" className="text-primary-400">Create one!</Link></p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Title</th><th>Sport</th><th>Status</th><th>Start Date</th><th>Teams</th></tr>
              </thead>
              <tbody>
                {recentTournaments.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/organizer/tournaments/${t._id}/manage`} className="text-dark-200 hover:text-primary-400 font-medium transition-colors">
                        {t.title}
                      </Link>
                    </td>
                    <td className="capitalize text-dark-400">{t.sport}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-dark-500 text-xs">{format(new Date(t.startDate), 'MMM d, yyyy')}</td>
                    <td className="text-dark-400">{t.registeredTeams?.length || 0}/{t.maxTeams}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
