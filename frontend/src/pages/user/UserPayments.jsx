import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userAPI } from '../../services/api'
import { SectionHeader, PageLoader, EmptyState, StatusBadge } from '../../components/ui'
import { CreditCard, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

export default function UserPayments() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => userAPI.getPayments({ limit: 50 }),
  })

  const payments = data?.data?.data || []

  const filtered = payments.filter((p) => {
    const matchSearch = !search || p.tournament?.title?.toLowerCase().includes(search.toLowerCase()) || p.transactionId?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader title="Payment History" subtitle="Your tournament payment records" />

      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Total Paid</p>
              <p className="font-bold text-dark-100">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <DollarSign size={18} className="text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Total Transactions</p>
              <p className="font-bold text-dark-100">{payments.length}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
              <TrendingDown size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Pending</p>
              <p className="font-bold text-dark-100">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              className="input pl-9 text-sm py-2"
              placeholder="Search by tournament or transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input text-sm py-2 max-w-40"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={32} className="text-dark-600" />}
          title="No payments yet"
          description="Your payment history will appear here after tournament registrations"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={32} className="text-dark-600" />}
          title="No results found"
          description="Try adjusting your search or filter"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Txn ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="text-dark-200 font-medium">{p.tournament?.title || 'Unknown'}</td>
                    <td className="font-semibold text-dark-100">₹{p.amount.toLocaleString()}</td>
                    <td className="text-dark-400 capitalize">{p.paymentMethod || '-'}</td>
                    <td className="text-dark-500 text-xs">{format(new Date(p.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="font-mono text-xs text-dark-600">{p.transactionId || '-'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
