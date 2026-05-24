import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, tournamentAPI } from '../../services/api'
import { StatCard, SectionHeader, PageLoader } from '../../components/ui'
import { Users, Trophy, CalendarDays, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats(),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => adminAPI.getPendingApprovals(),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => tournamentAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Tournament approved!')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => tournamentAPI.reject(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      toast.success('Tournament rejected')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id) => adminAPI.verifyDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      toast.success('User verified!')
    },
  })

  if (isLoading) return <PageLoader />

  const stats = data?.data?.data
  const pending = pendingData?.data?.data

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-50 mb-1">Admin Dashboard</h1>
        <p className="text-dark-500 text-sm">Platform overview and management</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Users', value: stats?.users?.total || 0, icon: <Users size={22} className="text-blue-400" />, color: 'blue', change: `${stats?.users?.active} active` },
          { title: 'Organizers', value: stats?.organizers?.total || 0, icon: <Users size={22} className="text-green-400" />, color: 'green' },
          { title: 'Tournaments', value: stats?.tournaments?.total || 0, icon: <Trophy size={22} className="text-primary-400" />, color: 'amber', change: `${stats?.tournaments?.pending} pending` },
          { title: 'Registrations', value: stats?.registrations?.total || 0, icon: <CalendarDays size={22} className="text-purple-400" />, color: 'purple', change: `${stats?.registrations?.pending} pending` },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <SectionHeader title="User Growth (7 days)" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.charts?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <SectionHeader title="Tournaments by Sport" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.charts?.tournamentsBySport || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHeader title="Pending Users" action={<Link to="/admin/users?status=pending" className="text-xs text-primary-400">View all →</Link>} />
          {!pending?.pendingUsers?.length ? (
            <p className="text-dark-500 text-sm text-center py-6">No pending users</p>
          ) : (
            <div className="space-y-3">
              {pending.pendingUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3 p-3 bg-dark-800/40 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate">{u.name}</p>
                    <p className="text-xs text-dark-500 truncate">{u.email}</p>
                  </div>
                  <button onClick={() => verifyMutation.mutate(u._id)} className="btn-ghost text-xs py-1.5 px-3 text-green-400">
                    <CheckCircle size={13} /> Verify
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <SectionHeader title="Pending Tournaments" action={<Link to="/admin/tournaments" className="text-xs text-primary-400">View all →</Link>} />
          {!pending?.pendingTournaments?.length ? (
            <p className="text-dark-500 text-sm text-center py-6">No pending tournaments</p>
          ) : (
            <div className="space-y-3">
              {pending.pendingTournaments.map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-3 bg-dark-800/40 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">🏆</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate">{t.title}</p>
                    <p className="text-xs text-dark-500">{t.organizer?.name} · {t.sport}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => approveMutation.mutate(t._id)} className="btn-ghost text-xs py-1 px-2 text-green-400">✓</button>
                    <button onClick={() => rejectMutation.mutate({ id: t._id, reason: 'Does not meet guidelines' })} className="btn-ghost text-xs py-1 px-2 text-red-400">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
