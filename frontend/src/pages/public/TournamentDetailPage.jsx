import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tournamentAPI, registrationAPI } from '../../services/api'
import { PageLoader, StatusBadge } from '../../components/ui'
import { Calendar, Users, MapPin, Trophy, ArrowLeft, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import TournamentRegistrationModal from '../../components/TournamentRegistrationModal'
import TournamentMapWidget from '../../components/TournamentMapWidget'

const sportEmoji = {
  cricket: '🏏', football: '⚽', basketball: '🏀', tennis: '🎾',
  badminton: '🏸', volleyball: '🏐', kabaddi: '🤸', chess: '♟️', esports: '🎮', other: '🏆',
}

export default function TournamentDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getOne(id),
    enabled: !!id,
  })

  const { data: myRegData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationAPI.getMyRegistrations({ limit: 100 }),
    enabled: !!id && isAuthenticated && !!user,
  })
  const myRegistrations = myRegData?.data?.data ?? []
  const myRegistration = myRegistrations.find(
    (r) => (r.tournament?._id ?? r.tournament) === id
  )

  if (isLoading) return <div className="page-container"><PageLoader /></div>

  const tournament = data?.data?.data?.tournament
  if (!tournament) return <div className="page-container text-center py-20 text-dark-500">Tournament not found</div>

  const registeredCount = tournament.registeredTeams?.length || 0
  const fillPercent = (registeredCount / tournament.maxTeams) * 100
  const deadlinePassed = new Date(tournament.registrationDeadline) < new Date()
  const isRegistrationOpen = tournament.status === 'registration_open' && !deadlinePassed

  return (
    <div className="page-container max-w-5xl">
      <Link to="/tournaments" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-300 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Tournaments
      </Link>

      {/* Banner */}
      <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden bg-dark-800 mb-8">
        {tournament.banner?.url ? (
          <img src={tournament.banner.url} alt={tournament.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">
            {sportEmoji[tournament.sport] || '🏆'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={tournament.status} />
            <span className="text-dark-300 text-sm capitalize">{tournament.sport} · {tournament.format.replace(/_/g, ' ')}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-dark-50">{tournament.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-dark-100 mb-3">About this Tournament</h2>
            <p className="text-dark-400 text-sm leading-relaxed">{tournament.description}</p>
          </div>

          {tournament.rules?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-dark-100 mb-3">Rules & Guidelines</h2>
              <ul className="space-y-2">
                {tournament.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark-400">
                    <span className="text-primary-500 mt-0.5">{i + 1}.</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tournament.prizeMoney?.first > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-primary-400" /> Prize Pool
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[['🥇 1st', tournament.prizeMoney.first], ['🥈 2nd', tournament.prizeMoney.second], ['🥉 3rd', tournament.prizeMoney.third]].map(([label, amount]) => (
                  <div key={label} className="text-center p-3 bg-dark-800/50 rounded-xl">
                    <p className="text-sm text-dark-400 mb-1">{label}</p>
                    <p className="font-bold text-dark-100">₹{(amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-dark-100 mb-4">Registration</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-dark-500 flex items-center gap-2"><Users size={14} /> Teams</span>
                <span className="text-dark-200 font-medium">{registeredCount} / {tournament.maxTeams}</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${Math.min(100, fillPercent)}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-500 flex items-center gap-2"><Calendar size={14} /> Deadline</span>
                <span className={`font-medium ${deadlinePassed ? 'text-red-400' : 'text-green-400'}`}>
                  {format(new Date(tournament.registrationDeadline), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">Entry Fee</span>
                <span className="font-semibold text-dark-200">
                  {tournament.entryFee > 0 ? `₹${tournament.entryFee.toLocaleString()}` : 'Free'}
                </span>
              </div>
            </div>

            {myRegistration ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
                  <CheckCircle size={18} />
                  Already registered
                </div>
                <p className="text-dark-400 text-xs">
                  {myRegistration.team?.name && (
                    <span className="block">Team: {myRegistration.team.name}</span>
                  )}
                  Status:{' '}
                  <span className={myRegistration.status === 'approved' ? 'text-green-400' : 'text-amber-400'}>
                    {myRegistration.status === 'approved' ? 'Approved' : myRegistration.status === 'pending' ? 'Pending approval' : myRegistration.status}
                  </span>
                </p>
                <Link to="/user/registrations" className="text-xs text-primary-400 hover:text-primary-300">
                  View my registrations →
                </Link>
              </div>
            ) : isAuthenticated && user?.role === 'user' && isRegistrationOpen ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRegistrationModal(true)}
                className="btn-primary w-full py-3 text-sm"
              >
                Register Now 🏆
              </motion.button>
            ) : !isAuthenticated ? (
              <Link to="/login" className="btn-primary w-full py-3 text-sm block text-center">
                Login to Register
              </Link>
            ) : (
              <p className="text-center text-dark-500 text-sm">
                {deadlinePassed ? 'Registration closed' : 
                 tournament.status !== 'registration_open' ? 'Registration not open yet' : 
                 'Not available'}
              </p>
            )}
          </div>

          <div className="card p-6 space-y-3">
            <h3 className="font-semibold text-dark-100 mb-1">Tournament Info</h3>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Calendar size={14} className="text-dark-500" />
              <span>{format(new Date(tournament.startDate), 'MMM d')} – {format(new Date(tournament.endDate), 'MMM d, yyyy')}</span>
            </div>
            {tournament.ground && (
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <MapPin size={14} className="text-dark-500" />
                <span>{tournament.ground.name}{tournament.ground.address?.city ? `, ${tournament.ground.address.city}` : ''}</span>
              </div>
            )}
            {tournament.organizer && (
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <span className="text-dark-500">By</span>
                <span className="text-dark-200">{tournament.organizer.name}</span>
              </div>
            )}
          </div>

          {/* Map Widget */}
          {tournament.ground && <TournamentMapWidget tournament={tournament} />}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <TournamentRegistrationModal
          tournament={tournament}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
    </div>
  )
}
