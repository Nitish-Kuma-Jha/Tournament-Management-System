
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { SectionHeader, PageLoader } from '../../components/ui'
import { format } from 'date-fns'

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action],
    queryFn: () => adminAPI.getAuditLogs({ page, limit: 20, ...(action && { action }) }),
  })

  const logs = data?.data?.data || []
  const pagination = data?.data?.pagination

  return (
    <div>
      <SectionHeader title="Audit Logs" subtitle="Track all system activity" />
      <div className="flex gap-3 mb-6">
        <input className="input max-w-64" placeholder="Filter by action..." value={action} onChange={e => { setAction(e.target.value); setPage(1) }} />
      </div>
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Actor</th><th>Action</th><th>Resource</th><th>Status</th><th>IP</th><th>Time</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-dark-500">Loading...</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <p className="text-dark-200 text-sm font-medium">{log.actor?.name || 'System'}</p>
                    <p className="text-xs text-dark-500 capitalize">{log.actorRole}</p>
                  </td>
                  <td><span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">{log.action}</span></td>
                  <td className="text-dark-400 text-sm">{log.resource}</td>
                  <td><span className={`badge text-xs ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>{log.status}</span></td>
                  <td className="font-mono text-xs text-dark-600">{log.ip}</td>
                  <td className="text-dark-500 text-xs">{format(new Date(log.createdAt), 'MMM d, HH:mm')}</td>
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
    </div>
  )
}
