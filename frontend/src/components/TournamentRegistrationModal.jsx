import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Loader2, CheckCircle } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { registrationAPI, teamAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function TournamentRegistrationModal({ tournament, onClose }) {
  const [step, setStep] = useState(1)
  const [useExistingTeam, setUseExistingTeam] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data: teamsRes, isLoading: teamsLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!tournament,
  })
  const teams = teamsRes?.data?.data?.teams || []
  const teamsForSport = teams.filter((t) => t.sport === tournament?.sport)

  const registerMutation = useMutation({
    mutationFn: async ({ tournamentId, teamId }) => registrationAPI.register({ tournamentId, teamId }),
    onSuccess: () => {
      toast.success('Registration submitted successfully! Awaiting organizer approval.')
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament._id] })
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
      setError(err.response?.data?.message || 'Registration failed')
    },
  })

  const createTeamMutation = useMutation({
    mutationFn: (data) => teamAPI.create(data),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create team')
      setError(err.response?.data?.message || 'Failed to create team')
    },
  })

  const validate = () => {
    setError('')
    if (useExistingTeam) {
      if (!selectedTeamId) {
        setError('Please select a team')
        return false
      }
      return true
    }
    if (!newTeamName.trim()) {
      setError('Please enter a team name')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validate()) setStep(2)
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setError('')

    if (useExistingTeam) {
      registerMutation.mutate({ tournamentId: tournament._id, teamId: selectedTeamId })
      return
    }

    try {
      const createRes = await createTeamMutation.mutateAsync({
        name: newTeamName.trim(),
        sport: tournament.sport,
      })
      const newTeam = createRes?.data?.data?.team
      if (!newTeam?._id) {
        setError('Team created but could not get ID')
        return
      }
      registerMutation.mutate({ tournamentId: tournament._id, teamId: newTeam._id })
    } catch {
      // Error already handled in createTeamMutation.onError
    }
  }

  const isSubmitting = registerMutation.isPending || createTeamMutation.isPending

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        >
          <div className="flex items-start justify-between p-6 border-b border-dark-700 shrink-0">
            <div>
              <h2 className="font-display font-bold text-dark-50 text-xl">Register for Tournament</h2>
              <p className="text-dark-400 text-sm mt-0.5 truncate max-w-xs">{tournament?.title}</p>
            </div>
            <button onClick={onClose} className="text-dark-500 hover:text-dark-200 transition-colors ml-4 mt-1">
              <X size={20} />
            </button>
          </div>

          <div className="px-6 pt-4 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 1 ? 'text-primary-400' : 'text-dark-500'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary-500 text-dark-950' : 'bg-dark-700 text-dark-500'}`}>1</div>
                Choose team
              </div>
              <div className="flex-1 h-px bg-dark-700" />
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 2 ? 'text-primary-400' : 'text-dark-500'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary-500 text-dark-950' : 'bg-dark-700 text-dark-500'}`}>2</div>
                Confirm
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
                    <Users size={14} className="text-primary-400" /> Your team
                  </h3>
                  <p className="text-dark-500 text-sm mb-3">
                    Register with an existing {tournament?.sport} team or create a new one. Only team captains can register.
                  </p>

                  {teamsLoading ? (
                    <div className="flex items-center justify-center py-8 text-dark-500">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="teamChoice"
                            checked={useExistingTeam}
                            onChange={() => { setUseExistingTeam(true); setError('') }}
                            className="text-primary-500"
                          />
                          <span className="text-dark-200 text-sm">Use existing team</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="teamChoice"
                            checked={!useExistingTeam}
                            onChange={() => { setUseExistingTeam(false); setError(''); setSelectedTeamId('') }}
                            className="text-primary-500"
                          />
                          <span className="text-dark-200 text-sm">Create new team</span>
                        </label>
                      </div>

                      {useExistingTeam ? (
                        <div>
                          <label className="block text-xs text-dark-400 mb-1">Select team</label>
                          <select
                            className="input w-full"
                            value={selectedTeamId}
                            onChange={(e) => { setSelectedTeamId(e.target.value); setError('') }}
                          >
                            <option value="">— Select a team —</option>
                            {teamsForSport.length === 0 ? (
                              <option value="" disabled>No {tournament?.sport} teams</option>
                            ) : (
                              teamsForSport.map((t) => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                              ))
                            )}
                          </select>
                          {useExistingTeam && teamsForSport.length === 0 && (
                            <p className="text-xs text-amber-400 mt-1">You don&apos;t have a {tournament?.sport} team. Choose &quot;Create new team&quot; and enter a name.</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-dark-400 mb-1">New team name</label>
                          <input
                            type="text"
                            className="input w-full"
                            placeholder="e.g. Warriors FC"
                            value={newTeamName}
                            onChange={(e) => { setNewTeamName(e.target.value); setError('') }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-dark-800/60 rounded-xl p-4 space-y-3 border border-dark-700">
                  <h3 className="text-sm font-semibold text-dark-200">Registration summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-500">Tournament</span>
                      <span className="text-dark-200 font-medium text-right max-w-[200px] truncate">{tournament?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-500">Team</span>
                      <span className="text-dark-200">
                        {useExistingTeam
                          ? teamsForSport.find((t) => t._id === selectedTeamId)?.name || '—'
                          : newTeamName.trim() || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-500">Entry fee</span>
                      <span className={tournament?.entryFee > 0 ? 'text-primary-400 font-medium' : 'text-green-400'}>
                        {tournament?.entryFee > 0 ? `₹${Number(tournament.entryFee).toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-dark-500 text-center">
                  Your registration will be sent for organizer approval. You&apos;ll be notified when it&apos;s reviewed.
                </p>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </motion.div>
            )}
          </div>

          <div className="p-6 border-t border-dark-700 flex gap-3 shrink-0">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex-1 py-3"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex-1 py-3"
                disabled={teamsLoading || (useExistingTeam && (teamsForSport.length === 0 || !selectedTeamId))}
              >
                Review registration →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle size={16} /> Confirm registration</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
