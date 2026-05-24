import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Wind, Droplets, Thermometer, ChevronDown, RefreshCw } from 'lucide-react'
import { getUserLocation, getWeather, WMO_CODES, getSportAdvice } from '../services/weatherService'

export default function WeatherWidget({ compact = false }) {
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    try {
      const loc = await getUserLocation()
      setLocation(loc)
      const data = await getWeather(loc.lat, loc.lon)
      setWeather(data)
    } catch (e) {
      setError('Weather unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWeather() }, [])

  if (loading) {
    return (
      <div className={`card ${compact ? 'p-3' : 'p-5'} flex items-center gap-3 animate-pulse`}>
        <div className="w-10 h-10 bg-dark-700 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-dark-700 rounded w-24" />
          <div className="h-2 bg-dark-700 rounded w-16" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`card ${compact ? 'p-3' : 'p-4'} flex items-center gap-2 text-dark-500`}>
        <span className="text-xl">🌡️</span>
        <span className="text-xs">{error}</span>
        <button onClick={fetchWeather} className="ml-auto text-primary-400 hover:text-primary-300">
          <RefreshCw size={12} />
        </button>
      </div>
    )
  }

  const current = weather?.current
  const daily = weather?.daily
  const code = current?.weathercode
  const wmo = WMO_CODES[code] || WMO_CODES[0]
  const temp = Math.round(current?.temperature_2m)
  const feelsLike = Math.round(current?.apparent_temperature)
  const humidity = current?.relative_humidity_2m
  const wind = Math.round(current?.wind_speed_10m)
  const advice = getSportAdvice(code, temp)

  const forecast = daily?.time?.slice(1, 5).map((date, i) => ({
    date: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
    max: Math.round(daily.temperature_2m_max[i + 1]),
    min: Math.round(daily.temperature_2m_min[i + 1]),
    icon: (WMO_CODES[daily.weathercode[i + 1]] || WMO_CODES[0]).icon,
  }))

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{wmo.icon}</span>
        <span className="text-dark-200 font-medium">{temp}°C</span>
        <span className="text-dark-500 flex items-center gap-1"><MapPin size={11} />{location?.city}</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Main weather */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-dark-500 mb-1">
              <MapPin size={11} />
              <span>{location?.city}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-display font-bold text-dark-50">{temp}°</span>
              <div className="pb-1">
                <div className="text-4xl">{wmo.icon}</div>
              </div>
            </div>
            <p className="text-sm text-dark-400 mt-1">{wmo.label}</p>
          </div>
          <button onClick={fetchWeather} className="text-dark-600 hover:text-dark-400 transition-colors mt-1">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Thermometer, label: 'Feels', value: `${feelsLike}°C` },
            { icon: Droplets, label: 'Humidity', value: `${humidity}%` },
            { icon: Wind, label: 'Wind', value: `${wind}km/h` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-dark-800/50 rounded-xl p-2.5 text-center">
              <Icon size={13} className="text-dark-500 mx-auto mb-1" />
              <p className="text-dark-100 font-semibold text-sm">{value}</p>
              <p className="text-dark-600 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Sport advice */}
        <div className={`${advice.bg} rounded-xl p-3 flex items-center gap-2`}>
          <span className="text-base">🏅</span>
          <p className={`text-xs font-medium ${advice.color}`}>{advice.advice}</p>
        </div>
      </div>

      {/* Forecast toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-dark-700/50 text-xs text-dark-500 hover:text-dark-300 hover:bg-dark-800/30 transition-all"
      >
        <span>5-Day Forecast</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && forecast && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 grid grid-cols-4 gap-2">
              {forecast.map((day) => (
                <div key={day.date} className="text-center p-2 bg-dark-800/40 rounded-lg">
                  <p className="text-xs text-dark-500 mb-1">{day.date}</p>
                  <span className="text-xl">{day.icon}</span>
                  <p className="text-xs font-semibold text-dark-100 mt-1">{day.max}°</p>
                  <p className="text-xs text-dark-600">{day.min}°</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
