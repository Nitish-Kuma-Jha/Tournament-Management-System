
import { useQuery } from '@tanstack/react-query'
import { tournamentAPI } from '../../services/api'
import { SectionHeader, PageLoader, EmptyState, StatusBadge } from '../../components/ui'
import { Trophy, Plus, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function OrganizerTournaments() {
  const { data, isLoading } = useQuery({
    queryKey: ['organizer-all-tournaments'],
    queryFn: () => tournamentAPI.getMyTournaments({ limit: 50 }),
  })

  const tournaments = data?.data?.data || []

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader
        title="My Tournaments"
        subtitle="Manage all your tournament listings"
        action={
          <Link to="/organizer/tournaments/create" className="btn-primary text-sm py-2">
            <Plus size={16} /> Create New
          </Link>
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy size={32} className="text-dark-600" />}
          title="No tournaments yet"
          description="Create your first tournament to start managing registrations"
          action={<Link to="/organizer/tournaments/create" className="btn-primary"><Plus size={16} /> Create Tournament</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Title</th><th>Sport</th><th>Status</th><th>Teams</th><th>Start Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t._id}>
                    <td className="font-medium text-dark-100">{t.title}</td>
                    <td className="capitalize text-dark-400">{t.sport}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-dark-400">{t.registeredTeams?.length || 0}/{t.maxTeams}</td>
                    <td className="text-dark-500 text-xs">{format(new Date(t.startDate), 'MMM d, yyyy')}</td>
                    <td>
                      <Link to={`/organizer/tournaments/${t._id}/manage`} className="btn-ghost text-xs py-1.5 px-3">
                        <Settings size={14} /> Manage
                      </Link>
                    </td>
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
