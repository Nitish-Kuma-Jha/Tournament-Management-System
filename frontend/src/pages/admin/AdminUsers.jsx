import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { SectionHeader, PageLoader, StatusBadge, Modal } from '../../components/ui'
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, status, page],
    queryFn: () => adminAPI.getUsers({
      ...(search && { search }),
      ...(role !== 'all' && { role }),
      ...(status !== 'all' && { status }),
      page, limit: 15,
    }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateUserStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User status updated')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id) => adminAPI.verifyDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Document verified and user activated!')
    },
  })

  const users = data?.data?.data || []
  const pagination = data?.data?.pagination

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader title="User Management" subtitle="Manage all platform users" />
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
          <input className="input pl-10" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input max-w-36" value={role} onChange={e => { setRole(e.target.value); setPage(1) }}>
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="organizer">Organizers</option>
          <option value="admin">Admins</option>
        </select>
        <select className="input max-w-36" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Verified</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-primary-400 overflow-hidden flex-shrink-0">
                        {u.avatar?.url ? <img src={u.avatar.url} alt={u.name} className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-dark-200 text-sm">{u.name}</p>
                        <p className="text-xs text-dark-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="capitalize"><span className={`badge text-xs ${u.role === 'admin' ? 'badge-danger' : u.role === 'organizer' ? 'badge-info' : 'badge-success'}`}>{u.role}</span></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td className="text-dark-500 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="text-center">{u.emailVerified ? <span className="text-green-400 text-xs">✓</span> : <span className="text-dark-600 text-xs">—</span>}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedUser(u)} className="btn-ghost text-xs py-1 px-2"><Eye size={12} /></button>
                      {u.status !== 'active' && (
                        <button onClick={() => updateStatusMutation.mutate({ id: u._id, status: 'active' })} className="btn-ghost text-xs py-1 px-2 text-green-400"><CheckCircle size={12} /></button>
                      )}
                      {u.status !== 'suspended' && u.role !== 'admin' && (
                        <button onClick={() => updateStatusMutation.mutate({ id: u._id, status: 'suspended' })} className="btn-ghost text-xs py-1 px-2 text-red-400"><XCircle size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.total > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-dark-700/50">
            <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-50">← Prev</button>
            <span className="flex items-center px-4 text-sm text-dark-400">{page} / {pagination.total}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-50">Next →</button>
          </div>
        )}
      </div>

      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center text-2xl font-bold text-primary-400 overflow-hidden">
                {selectedUser.avatar?.url ? <img src={selectedUser.avatar.url} className="w-full h-full object-cover" /> : selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-dark-100 text-lg">{selectedUser.name}</h3>
                <p className="text-dark-400 text-sm">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Role', selectedUser.role], ['Status', selectedUser.status], ['Email Verified', selectedUser.emailVerified ? 'Yes' : 'No'], ['Joined', format(new Date(selectedUser.createdAt), 'MMM d, yyyy')]].map(([k, v]) => (
                <div key={k} className="bg-dark-800/50 rounded-lg p-3">
                  <p className="text-dark-500 text-xs">{k}</p>
                  <p className="text-dark-200 font-medium capitalize mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>
            {selectedUser.govIdDocument?.url && (
              <div>
                <p className="text-dark-400 text-sm mb-2">Government ID Document</p>
                <a href={selectedUser.govIdDocument.url} target="_blank" className="text-primary-400 text-sm hover:underline">View Document →</a>
                {!selectedUser.govIdDocument.verified && (
                  <button onClick={() => { verifyMutation.mutate(selectedUser._id); setSelectedUser(null) }} className="btn-primary ml-4 text-sm py-1.5">Verify Document</button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
