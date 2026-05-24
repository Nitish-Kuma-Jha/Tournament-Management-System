import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Users, MapPin, Trophy, Flame, ArrowRight } from 'lucide-react'
import { StatusBadge } from './ui'
import { format } from 'date-fns'

const sportEmoji = {
  cricket: '🏏', football: '⚽', basketball: '🏀', tennis: '🎾',
  badminton: '🏸', volleyball: '🏐', kabaddi: '🤸', chess: '♟️', esports: '🎮', other: '🏆',
}

export default function TournamentCard({ tournament }) {
  const registeredCount = tournament.registeredTeams?.length || 0
  const fillPercent = (registeredCount / tournament.maxTeams) * 100
  const isFull = registeredCount >= tournament.maxTeams
  const id =tournament._id
  const daysLeft = Math.ceil((new Date(tournament.registrationDeadline).getTime() - Date.now()) / 86400000)
  const isActive = tournament.status === 'registration_open' && !isFull && daysLeft > 0

  return (
    <Link to={`/tournaments/${id}`}>
      <motion.div
        className={`card-hover overflow-hidden group relative ${isActive ? 'ring-1 ring-primary-500/30' : ''}`}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {/* Active Registration Banner */}
        {isActive && (
          <div className="bg-primary-500/10 border-b border-primary-500/20 px-4 py-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse inline-block" />
              Registration Open
            </span>
            <span className="text-xs text-primary-300 flex items-center gap-1">
              Register Now <ArrowRight size={11} />
            </span>
          </div>
        )}

        {/* Banner */}
        <div className="h-36 bg-gradient-to-br from-dark-800 to-dark-700 relative overflow-hidden">
          {tournament.banner?.url ? (
            <img src={tournament.banner.url} alt={tournament.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-40">{sportEmoji[tournament.sport] || '🏆'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
          {tournament.isFeatured && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary-500/90 text-dark-950 text-xs font-bold px-2.5 py-1 rounded-full">
              <Flame size={12} /> Featured
            </div>
          )}
          <div className="absolute top-3 right-3">
            <StatusBadge status={tournament.status} />
          </div>
          <div className="absolute bottom-3 left-3 text-2xl">{sportEmoji[tournament.sport] || '🏆'}</div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-display font-semibold text-dark-100 text-base mb-1 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {tournament.title}
          </h3>
          <p className="text-xs text-dark-500 capitalize mb-4">{tournament.format.replace(/_/g, ' ')} · {tournament.sport}</p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-dark-400">
              <Calendar size={13} className="text-dark-500" />
              <span>{format(new Date(tournament.startDate), 'MMM d')} – {format(new Date(tournament.endDate), 'MMM d, yyyy')}</span>
            </div>
            {tournament.ground?.name && (
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <MapPin size={13} className="text-dark-500" />
                <span className="truncate">{tournament.ground.name}{tournament.ground.address?.city ? `, ${tournament.ground.address.city}` : ''}</span>
              </div>
            )}
          </div>

          {/* Teams progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-dark-500 mb-1.5">
              <div className="flex items-center gap-1"><Users size={12} />{registeredCount}/{tournament.maxTeams} teams</div>
              {isFull ? <span className="text-red-400 font-medium">Full</span> :
               daysLeft > 0 ? <span className="text-green-400">{daysLeft}d left</span> :
               <span className="text-red-400">Closed</span>}
            </div>
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : fillPercent > 70 ? 'bg-primary-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, fillPercent)}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div>
              {tournament.entryFee > 0 ? (
                <span className="text-sm font-semibold text-dark-200">₹{tournament.entryFee.toLocaleString()}</span>
              ) : (
                <span className="text-sm font-semibold text-green-400">Free Entry</span>
              )}
            </div>
            {tournament.prizeMoney?.first > 0 && (
              <div className="flex items-center gap-1 text-xs text-primary-400">
                <Trophy size={12} />
                <span>₹{(tournament.prizeMoney.first / 1000).toFixed(0)}K Prize</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
