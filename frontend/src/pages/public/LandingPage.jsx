import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Trophy, ChevronRight, Users, Calendar, BarChart3, Shield, Zap, Star, ArrowRight, Sparkles, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { tournamentAPI } from '../../services/api'
import TournamentCard from '../../components/TournamentCard'
import WeatherWidget from '../../components/WeatherWidget'
import { CardSkeleton } from '../../components/ui'
import { useState, useEffect, useRef } from 'react'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

const stats = [
  { label: 'Tournaments Hosted', value: '2,400+', icon: Trophy },
  { label: 'Active Teams', value: '15,000+', icon: Users },
  { label: 'Matches Played', value: '50,000+', icon: Calendar },
  { label: 'Sports Supported', value: '10+', icon: BarChart3 },
]

const features = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Real-time updates, live scores, and instant notifications keep everyone in the loop.' },
  { icon: Shield, title: 'Enterprise Secure', desc: 'Bank-grade security with JWT authentication, rate limiting, and document verification.' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Comprehensive dashboards for organizers and admins with actionable insights.' },
  { icon: Trophy, title: 'Auto Brackets', desc: 'Intelligent bracket generation supporting multiple formats: single/double elimination, round robin.' },
]

const sports = ['🏏 Cricket', '⚽ Football', '🏀 Basketball', '🎾 Tennis', '🏸 Badminton', '🏐 Volleyball', '♟️ Chess', '🎮 Esports']

// ─── International Athletes Showcase ────────────────────────────────────────
const ATHLETES = [
  {
    id: 1,
    name: 'Virat Kohli',
    sport: 'Cricket',
    country: '🇮🇳 India',
    emoji: '🏏',
    title: 'King of Cricket',
    stats: [{ label: 'Test Average', value: '48.7' }, { label: 'ODI Centuries', value: '50' }, { label: 'World Cups', value: '2' }],
    color: '#3b82f6',
    accent: '#60a5fa',
    bg: 'from-blue-600/30 via-blue-900/20 to-dark-950',
    pattern: 'cricket',
    quote: '"Self-belief and hard work will always earn you success."',
    achievements: ['ICC Test Cricketer of the Year 2018', 'Most ODI centuries as captain', 'Fastest to 8000 ODI runs'],
  },
  {
    id: 2,
    name: 'Cristiano Ronaldo',
    sport: 'Football',
    country: '🇵🇹 Portugal',
    emoji: '⚽',
    title: 'CR7 – The GOAT',
    stats: [{ label: 'Club Goals', value: '910+' }, { label: 'Ballon d\'Or', value: '5' }, { label: 'Int\'l Goals', value: '130+' }],
    color: '#ef4444',
    accent: '#f87171',
    bg: 'from-red-600/30 via-red-900/20 to-dark-950',
    pattern: 'football',
    quote: '"Your love for what you do and willingness to push yourself where others aren\'t willing to go is what makes the difference."',
    achievements: ['5× Ballon d\'Or', 'All-time international top scorer', 'Champions League 5× winner'],
  },
  {
    id: 3,
    name: 'Lionel Messi',
    sport: 'Football',
    country: '🇦🇷 Argentina',
    emoji: '🌟',
    title: 'La Pulga – The Flea',
    stats: [{ label: 'Club Goals', value: '850+' }, { label: 'Ballon d\'Or', value: '8' }, { label: 'World Cup', value: '1' }],
    color: '#f59e0b',
    accent: '#fbbf24',
    bg: 'from-amber-600/30 via-amber-900/20 to-dark-950',
    pattern: 'football',
    quote: '"I start early and I stay late, day after day, year after year, it took me 17 years to become an overnight success."',
    achievements: ['8× Ballon d\'Or (record)', '2022 FIFA World Cup winner', 'Copa America champion 2021'],
  },
  {
    id: 4,
    name: 'Serena Williams',
    sport: 'Tennis',
    country: '🇺🇸 USA',
    emoji: '🎾',
    title: 'Queen of the Court',
    stats: [{ label: 'Grand Slams', value: '23' }, { label: 'WTA Titles', value: '73' }, { label: 'Olympic Gold', value: '4' }],
    color: '#a855f7',
    accent: '#c084fc',
    bg: 'from-purple-600/30 via-purple-900/20 to-dark-950',
    pattern: 'tennis',
    quote: '"I really think a champion is defined not by their wins but by how they can recover when they fall."',
    achievements: ['23 Grand Slam singles titles', '4× Olympic Gold medalist', 'Year-end No. 1 for 5 consecutive years'],
  },
  {
    id: 5,
    name: 'LeBron James',
    sport: 'Basketball',
    country: '🇺🇸 USA',
    emoji: '🏀',
    title: 'King James',
    stats: [{ label: 'NBA Points', value: '40K+' }, { label: 'NBA Titles', value: '4' }, { label: 'MVP Awards', value: '4' }],
    color: '#f97316',
    accent: '#fb923c',
    bg: 'from-orange-600/30 via-orange-900/20 to-dark-950',
    pattern: 'basketball',
    quote: '"Strive for greatness."',
    achievements: ['NBA All-time leading scorer', '4× NBA Champion (3 teams)', '4× NBA Finals MVP'],
  },
  {
    id: 6,
    name: 'Neeraj Chopra',
    sport: 'Athletics',
    country: '🇮🇳 India',
    emoji: '🥇',
    title: 'Golden Boy of India',
    stats: [{ label: 'Olympic Gold', value: '2' }, { label: 'World Record', value: '89.94m' }, { label: 'World Title', value: '2023' }],
    color: '#22c55e',
    accent: '#4ade80',
    bg: 'from-green-600/30 via-green-900/20 to-dark-950',
    pattern: 'athletics',
    quote: '"I never think about winning a gold medal. I think about throwing well."',
    achievements: ['2× Olympic Gold medalist', 'World Athletics Champion 2023', 'India\'s only individual Olympic gold x2'],
  },
]

function SportPattern({ type, color }) {
  const shapes = {
    cricket: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
        <ellipse cx="100" cy="100" rx="30" ry="80" stroke={color} strokeWidth="3" fill="none" />
        <line x1="70" y1="30" x2="130" y2="170" stroke={color} strokeWidth="2" />
        <circle cx="100" cy="100" r="60" stroke={color} strokeWidth="1" fill="none" />
        {[0,30,60,90,120,150].map(a => (
          <line key={a} x1="100" y1="40" x2="100" y2="160" stroke={color} strokeWidth="1"
            transform={`rotate(${a} 100 100)`} />
        ))}
      </svg>
    ),
    football: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
        <circle cx="100" cy="100" r="70" stroke={color} strokeWidth="3" fill="none" />
        <polygon points="100,30 120,70 100,50 80,70" stroke={color} strokeWidth="2" fill="none" />
        {[0,72,144,216,288].map((a, i) => (
          <polygon key={i} points="100,100 120,130 80,130" stroke={color} strokeWidth="1.5" fill="none"
            transform={`rotate(${a} 100 100)`} />
        ))}
      </svg>
    ),
    tennis: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
        <circle cx="100" cy="100" r="65" stroke={color} strokeWidth="3" fill="none" />
        <path d="M 35,100 Q 100,40 165,100" stroke={color} strokeWidth="2" fill="none" />
        <path d="M 35,100 Q 100,160 165,100" stroke={color} strokeWidth="2" fill="none" />
        <line x1="35" y1="100" x2="165" y2="100" stroke={color} strokeWidth="1" />
      </svg>
    ),
    basketball: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
        <circle cx="100" cy="100" r="65" stroke={color} strokeWidth="3" fill="none" />
        <line x1="35" y1="100" x2="165" y2="100" stroke={color} strokeWidth="2" />
        <line x1="100" y1="35" x2="100" y2="165" stroke={color} strokeWidth="2" />
        <path d="M 60,35 Q 100,100 60,165" stroke={color} strokeWidth="2" fill="none" />
        <path d="M 140,35 Q 100,100 140,165" stroke={color} strokeWidth="2" fill="none" />
      </svg>
    ),
    athletics: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
        {[0,30,60,90].map((r, i) => (
          <ellipse key={i} cx="100" cy="100" rx="20" ry="70" stroke={color} strokeWidth="2" fill="none"
            transform={`rotate(${r} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="8" stroke={color} strokeWidth="3" fill="none" />
      </svg>
    ),
  }
  return shapes[type] || shapes.football
}

function AthleteCard({ athlete, isActive }) {
  return (
    <motion.div
      key={athlete.id}
      initial={{ opacity: 0, scale: 0.95, x: 60 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -60 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`absolute inset-0 bg-gradient-to-br ${athlete.bg} rounded-2xl overflow-hidden`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-64 h-64"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <SportPattern type={athlete.pattern} color={athlete.color} />
        </motion.div>
        {/* Glowing orb */}
        <motion.div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: athlete.color }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Particle dots */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ background: athlete.accent, left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <div className="relative h-full flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        {/* Left: Giant emoji + sport badge */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-28 h-28 md:w-36 md:h-36 rounded-3xl flex items-center justify-center border-2 relative overflow-hidden"
            style={{ borderColor: `${athlete.color}50`, background: `${athlete.color}15` }}
          >
            <span className="text-6xl md:text-7xl">{athlete.emoji}</span>
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ background: `radial-gradient(circle, ${athlete.color}20, transparent 70%)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 px-3 py-1 rounded-full text-xs font-bold border"
            style={{ color: athlete.accent, borderColor: `${athlete.color}40`, background: `${athlete.color}15` }}
          >
            {athlete.sport}
          </motion.div>
        </div>

        {/* Center: Name & details */}
        <div className="flex-1 text-center md:text-left">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm font-medium mb-1"
            style={{ color: athlete.accent }}
          >
            {athlete.country} · {athlete.title}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-3xl md:text-4xl font-display font-extrabold text-white mb-3 leading-tight"
          >
            {athlete.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-dark-300 italic leading-relaxed mb-4 max-w-md"
          >
            {athlete.quote}
          </motion.p>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
            {athlete.stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center px-4 py-2 rounded-xl border"
                style={{ borderColor: `${athlete.color}30`, background: `${athlete.color}12` }}
              >
                <p className="text-xl font-display font-bold" style={{ color: athlete.accent }}>{s.value}</p>
                <p className="text-xs text-dark-400">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Achievements */}
          <div className="space-y-1">
            {athlete.achievements.slice(0, 2).map((a, i) => (
              <motion.div
                key={a}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-2 text-xs text-dark-400"
              >
                <span style={{ color: athlete.accent }}>✦</span> {a}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AthletesShowcase() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % ATHLETES.length)
    }, 5000)
  }

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  const goTo = (i) => {
    setCurrent(i)
    startTimer()
  }

  const athlete = ATHLETES[current]

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/25 rounded-full px-4 py-1.5 text-sm text-primary-400 font-medium mb-4">
            <Sparkles size={14} /> Inspired by the Greats
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-50 mb-3">
            Champions Are Made on Platforms Like This
          </h2>
          <p className="text-dark-500 max-w-xl mx-auto">
            Every legend started somewhere. Your tournament journey begins here.
          </p>
        </motion.div>

        {/* Main showcase */}
        <div
          className="relative h-64 md:h-72 rounded-2xl overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => { setIsPaused(false); startTimer() }}
        >
          <AnimatePresence mode="wait">
            <AthleteCard key={athlete.id} athlete={athlete} isActive={true} />
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-800/60">
            <motion.div
              className="h-full"
              style={{ background: athlete.color }}
              key={current}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: isPaused ? 0 : 5, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Dot indicators + athlete tabs */}
        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
          {ATHLETES.map((a, i) => (
            <button
              key={a.id}
              onClick={() => goTo(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                current === i
                  ? 'border-opacity-50 text-dark-100 scale-110'
                  : 'border-dark-700 text-dark-500 hover:text-dark-300 hover:border-dark-600'
              }`}
              style={current === i ? {
                borderColor: `${a.color}60`,
                background: `${a.color}15`,
                color: a.accent,
              } : {}}
            >
              <span>{a.emoji}</span>
              <span className="hidden sm:inline">{a.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Call to action below */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-dark-500 text-sm mb-4">
            Join thousands of athletes competing on our platform right now
          </p>
          <Link to="/tournaments" className="btn-primary px-8 py-3">
            Find Your Tournament <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ─── AI Prediction Widget ─────────────────────────────────────────────────────
function AITournamentPredictor() {
  const [sport, setSport] = useState('cricket')
  const [teams, setTeams] = useState(8)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  const predictions = {
    cricket: { format: 'T20 League', duration: `${Math.ceil(teams * 0.7)} days`, matches: teams * (teams - 1) / 2, tip: 'Consider DRS technology for fair play' },
    football: { format: 'Group + Knockout', duration: `${Math.ceil(teams * 0.5)} days`, matches: Math.ceil(teams * 1.5), tip: 'Plan for extra time & penalties in knockouts' },
    basketball: { format: 'Double Elimination', duration: `${Math.ceil(teams * 0.4)} days`, matches: teams * 2, tip: 'Schedule rest days between semifinals' },
    tennis: { format: 'Single Elimination', duration: `${Math.ceil(Math.log2(teams)) + 1} days`, matches: teams - 1, tip: 'Seed top players to maximize quality finals' },
    chess: { format: 'Swiss System', duration: `${Math.ceil(Math.log2(teams))} days`, matches: teams * Math.ceil(Math.log2(teams)) / 2, tip: 'Use Swiss format for fair results with fewer rounds' },
    badminton: { format: 'Round Robin + Finals', duration: `${Math.ceil(teams * 0.6)} days`, matches: teams * (teams - 1) / 2 + 3, tip: 'Group players by seed for balanced groups' },
  }

  const runPrediction = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const p = predictions[sport] || predictions.cricket
    const totalMatches = Math.max(teams - 1, p.matches)
    setPrediction({
      ...p,
      teams,
      sport,
      matches: totalMatches,
      prizePool: `₹${(teams * 1000).toLocaleString()}`,
      bestSlot: ['Morning (9-12)', 'Afternoon (2-6)', 'Evening (5-9)'][Math.floor(Math.random() * 3)],
      attendance: `${(teams * 120 + Math.floor(Math.random() * 500)).toLocaleString()} expected`,
    })
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
          <Sparkles size={16} className="text-primary-400" />
        </div>
        <div>
          <h3 className="font-semibold text-dark-100 text-sm">AI Tournament Planner</h3>
          <p className="text-xs text-dark-500">Get intelligent format recommendations</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs text-dark-500 mb-1.5">Sport</label>
          <select className="input text-sm py-2" value={sport} onChange={e => { setSport(e.target.value); setPrediction(null) }}>
            {['cricket','football','basketball','tennis','chess','badminton'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-dark-500 mb-1.5">Number of Teams: <span className="text-primary-400 font-bold">{teams}</span></label>
          <input
            type="range" min={4} max={32} step={2} value={teams}
            onChange={e => { setTeams(+e.target.value); setPrediction(null) }}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-dark-600 mt-1"><span>4</span><span>32</span></div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={runPrediction}
        disabled={loading}
        className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mb-4"
      >
        {loading ? (
          <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>⚙️</motion.span> Analyzing...</>
        ) : (
          <><Sparkles size={14} /> Generate AI Plan</>
        )}
      </motion.button>

      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Recommended Format', value: prediction.format },
                { label: 'Total Matches', value: prediction.matches },
                { label: 'Estimated Duration', value: prediction.duration },
                { label: 'Suggested Prize Pool', value: prediction.prizePool },
                { label: 'Best Time Slot', value: prediction.bestSlot },
                { label: 'Attendance', value: prediction.attendance },
              ].map(({ label, value }) => (
                <div key={label} className="bg-dark-800/50 rounded-lg p-2.5">
                  <p className="text-xs text-dark-500 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-dark-100">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 flex items-start gap-2">
              <Sparkles size={13} className="text-primary-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-dark-300"><strong className="text-primary-400">AI Tip:</strong> {prediction.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Live Activity Feed ───────────────────────────────────────────────────────
const LIVE_EVENTS = [
  { id: 1, icon: '🏆', text: 'New tournament "IPL Stars Cup" just opened registration', time: '2m ago', type: 'new' },
  { id: 2, icon: '✅', text: 'Team "Thunder FC" approved for City Football League', time: '5m ago', type: 'approved' },
  { id: 3, icon: '⚡', text: 'Bracket generated for "Summer Basketball Open 2025"', time: '12m ago', type: 'bracket' },
  { id: 4, icon: '🎯', text: '47 teams registered for "National Chess Championship"', time: '18m ago', type: 'reg' },
  { id: 5, icon: '🥇', text: 'Finals result: "Warriors" defeated "Titans" 3-1', time: '25m ago', type: 'result' },
  { id: 6, icon: '🏏', text: '"Delhi Strikers" won the T20 Corporate League 2025', time: '1h ago', type: 'winner' },
]

function LiveActivityFeed() {
  const [visible, setVisible] = useState(LIVE_EVENTS.slice(0, 4))
  const [idx, setIdx] = useState(4)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(prev => {
        const next = [...LIVE_EVENTS.slice(idx % LIVE_EVENTS.length, (idx % LIVE_EVENTS.length) + 1), ...prev.slice(0, 3)]
        setIdx(i => i + 1)
        return next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [idx])

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <h3 className="font-semibold text-dark-100 text-sm">Live Activity</h3>
        <span className="ml-auto text-xs text-green-400 font-medium">LIVE</span>
      </div>
      <div className="space-y-2 overflow-hidden" style={{ height: '200px' }}>
        <AnimatePresence initial={false}>
          {visible.map((event, i) => (
            <motion.div
              key={event.id + '-' + i}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-dark-800/40 border border-dark-700/30"
            >
              <span className="text-base flex-shrink-0">{event.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-dark-300 leading-snug line-clamp-2">{event.text}</p>
                <p className="text-xs text-dark-600 mt-0.5">{event.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['featured-tournaments'],
    queryFn: () => tournamentAPI.getAll({ featured: 'true', limit: 3 }),
  })

  const tournaments = tournamentsData?.data?.data || []

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/6 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-500/5 to-transparent" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left: Hero text */}
            <div className="lg:col-span-2">
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/25 rounded-full px-4 py-1.5 text-sm text-primary-400 font-medium mb-8">
                  <Star size={14} className="text-primary-400" fill="currentColor" />
                  Trusted by 10,000+ sports organizations
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-display font-extrabold text-dark-50 leading-tight mb-6">
                  The Ultimate{' '}
                  <span className="gradient-text">Sports Tournament</span>
                  <br />Management Platform
                </motion.h1>

                <motion.p variants={fadeUp} className="text-lg text-dark-400 max-w-xl mb-10 leading-relaxed">
                  Organize, manage, and track sports tournaments with enterprise-grade tools.
                  From registration to bracket generation to live scores — everything in one place.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
                  <Link to="/register" className="btn-primary text-base px-8 py-3.5">
                    Start Organizing Free <ArrowRight size={18} />
                  </Link>
                  <Link to="/tournaments" className="btn-secondary text-base px-8 py-3.5">
                    Browse Tournaments <ChevronRight size={18} />
                  </Link>
                </motion.div>

                {/* Floating sport badges */}
                <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-8">
                  {sports.map((s, i) => (
                    <motion.span
                      key={s}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-3 py-1.5 bg-dark-800/70 border border-dark-700/60 rounded-full text-dark-400 text-xs hover:border-primary-500/40 hover:text-primary-400 transition-all cursor-default"
                    >
                      {s}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* Right: Weather + Live Activity */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <WeatherWidget />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <LiveActivityFeed />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-dark-700/50 bg-dark-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ label, value, icon: Icon }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} className="text-primary-400" />
                </div>
                <div className="text-3xl font-display font-bold text-dark-50 mb-1">{value}</div>
                <div className="text-sm text-dark-500">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Athletes Showcase */}
      <AthletesShowcase />

      {/* Featured Tournaments */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-dark-50 mb-2">Featured Tournaments</h2>
              <p className="text-dark-500">Discover top tournaments happening right now</p>
            </div>
            <Link to="/tournaments" className="btn-secondary text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : tournaments.map((t) => <TournamentCard key={t._id} tournament={t} />)
            }
          </div>
        </div>
      </section>

      {/* AI + Features combined section */}
      <section className="py-20 bg-dark-900/30" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: AI Planner */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/25 rounded-full px-4 py-1.5 text-sm text-primary-400 font-medium mb-4">
                  <Sparkles size={14} /> Powered by AI
                </div>
                <h2 className="text-3xl font-display font-bold text-dark-50 mb-3">Intelligent Tournament Planning</h2>
                <p className="text-dark-500">Our AI analyzes sport type, team count, and venue capacity to recommend the optimal tournament format and schedule.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <AITournamentPredictor />
              </motion.div>
            </div>

            {/* Right: Features */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <h2 className="text-3xl font-display font-bold text-dark-50 mb-3">Everything You Need</h2>
                <p className="text-dark-500">A complete solution for tournament organizers, players, and administrators</p>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="card p-5 hover:border-dark-600/80 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-all">
                      <Icon size={20} className="text-primary-400" />
                    </div>
                    <h3 className="font-semibold text-dark-100 mb-1.5 text-sm">{title}</h3>
                    <p className="text-dark-500 text-xs leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-display font-bold text-dark-50 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How do I register for a tournament?', a: 'Create an account, then browse open tournaments. Click "Register Now" on any active tournament to fill in your details, choose Solo/Duo/Group participation, and upload your ID. The organizer will review and approve.' },
              { q: 'Is it free to use?', a: 'The platform is free for players. Organizers can host free tournaments. Entry fees are set by individual organizers and shown clearly on each tournament card.' },
              { q: 'How does bracket generation work?', a: 'Once registration closes, organizers auto-generate brackets. Our AI supports single elimination, double elimination, and round-robin formats tailored to your team count.' },
              { q: 'What identity verification is required?', a: 'Users upload a government-issued ID during registration. For group/duo participation, each member must upload their ID. This ensures fair play and authentic participation.' },
            ].map(({ q, a }, i) => (
              <details key={i} className="group card">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-dark-200 font-medium hover:text-dark-50 transition-colors">
                  {q}
                  <span className="text-dark-500 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="px-5 pb-5 text-dark-500 text-sm leading-relaxed border-t border-dark-700/50 pt-4">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute top-4 right-4 w-32 h-32 opacity-5"
            >
              <SportPattern type="football" color="#f59e0b" />
            </motion.div>
            <div className="relative">
              <Trophy size={48} className="text-primary-500 mx-auto mb-6" />
              <h2 className="text-3xl font-display font-bold text-dark-50 mb-4">Ready to Get Started?</h2>
              <p className="text-dark-400 mb-8 max-w-lg mx-auto">Join thousands of sports organizations managing their tournaments on our platform.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary text-base px-8 py-3.5">
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <Link to="/tournaments" className="btn-secondary text-base px-8 py-3.5">
                  Explore Tournaments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
