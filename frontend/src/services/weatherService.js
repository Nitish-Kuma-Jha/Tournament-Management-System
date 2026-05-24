// Weather Service - uses Open-Meteo (free, no API key needed) + IP geolocation
const GEO_API = 'https://ipapi.co/json/'
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'

export const WMO_CODES = {
  0: { label: 'Clear Sky', icon: '☀️' },
  1: { label: 'Mainly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Icy Fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  71: { label: 'Light Snow', icon: '🌨️' },
  80: { label: 'Showers', icon: '🌦️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
}

export async function getUserLocation() {
  // Try browser geolocation first
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: 'Your Location' }),
        async () => {
          // Fallback to IP geolocation
          try {
            const res = await fetch(GEO_API)
            const data = await res.json()
            resolve({ lat: data.latitude, lon: data.longitude, city: data.city || 'Your City' })
          } catch {
            resolve({ lat: 31.3260, lon: 75.5762, city: 'Jalandhar' }) // Punjab default
          }
        },
        { timeout: 5000 }
      )
    } else {
      resolve({ lat: 31.3260, lon: 75.5762, city: 'Jalandhar' })
    }
  })
}

export async function getWeather(lat, lon) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,apparent_temperature&hourly=temperature_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  return res.json()
}

export function getSportAdvice(weatherCode, temp) {
  if (weatherCode >= 95) return { advice: 'Thunderstorm — Indoor sports only', color: 'text-red-400', bg: 'bg-red-500/10' }
  if (weatherCode >= 61 && weatherCode <= 82) return { advice: 'Rainy — Consider indoor alternatives', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  if (temp > 38) return { advice: 'Very hot — Stay hydrated, take breaks', color: 'text-orange-400', bg: 'bg-orange-500/10' }
  if (temp > 30) return { advice: 'Warm — Good for most sports', color: 'text-green-400', bg: 'bg-green-500/10' }
  if (temp < 5) return { advice: 'Cold — Warm up thoroughly before play', color: 'text-blue-400', bg: 'bg-blue-500/10' }
  return { advice: 'Perfect conditions for outdoor sports!', color: 'text-green-400', bg: 'bg-green-500/10' }
}
