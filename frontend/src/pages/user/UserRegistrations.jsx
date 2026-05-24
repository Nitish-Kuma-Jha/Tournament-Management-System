
import { useQuery } from '@tanstack/react-query'
import { registrationAPI } from '../../services/api'
import { SectionHeader, PageLoader, EmptyState, StatusBadge } from '../../components/ui'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function UserRegistrations() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationAPI.getMyRegistrations({ limit: 20 }),
  })

  const registrations = data?.data?.data || []

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader title="My Registrations" subtitle="Track your tournament registration status" />

      {registrations.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={32} className="text-dark-600" />}
          title="No registrations yet"
          description="Browse tournaments and register your team"
          action={<Link to="/tournaments" className="btn-primary">Browse Tournaments</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Team</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id}>
                    <td>
                      <Link to={`/tournaments/${reg.tournament?._id}`} className="text-dark-100 hover:text-primary-400 font-medium transition-colors">
                        {reg.tournament?.title || 'Unknown'}
                      </Link>
                      <p className="text-xs text-dark-500 capitalize">{reg.tournament?.sport}</p>
                    </td>
                    <td className="text-dark-300">{reg.team?.name || 'Unknown'}</td>
                    <td className="text-dark-500 text-xs">{format(new Date(reg.createdAt), 'MMM d, yyyy')}</td>
                    <td><StatusBadge status={reg.status} /></td>
                    <td><StatusBadge status={reg.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
