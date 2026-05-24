
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
import { SectionHeader, PageLoader } from '../../components/ui'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316']

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30')

  const { data, isLoading } = useQuery({
    queryKey: ['platform-analytics', period],
    queryFn: () => analyticsAPI.platform({ period }),
  })

  if (isLoading) return <PageLoader />

  const analytics = data?.data?.data

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Platform Analytics</h1>
          <p className="text-dark-500 text-sm mt-1">Comprehensive platform performance metrics</p>
        </div>
        <select className="input max-w-36" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <SectionHeader title="User Growth" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="rgba(245,158,11,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <SectionHeader title="Tournament Creation" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.tournamentGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <SectionHeader title="Sport Distribution" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analytics?.sportDistribution || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}>
                {(analytics?.sportDistribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <SectionHeader title="Registration Status" />
          <div className="space-y-3 mt-2">
            {(analytics?.registrationStats || []).map((item, i) => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-dark-300">{item._id}</span>
                    <span className="font-medium text-dark-200">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full">
                    <div className="h-full rounded-full" style={{ background: COLORS[i % COLORS.length], width: `${Math.min(100, (item.count / Math.max(...(analytics?.registrationStats || []).map((s) => s.count), 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
