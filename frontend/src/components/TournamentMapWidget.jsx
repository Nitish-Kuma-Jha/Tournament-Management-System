import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'

// Uses Leaflet (loaded via CDN in index.html) + OpenStreetMap (completely free, no API key)
export default function TournamentMapWidget({ tournament }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [coords, setCoords] = useState(null)

  const address = tournament?.ground?.address
  const venueName = tournament?.ground?.name || 'Venue'
  const city = address?.city || 'Unknown'
  const fullAddress = [address?.street, address?.city, address?.state].filter(Boolean).join(', ')

  // Geocode using Nominatim (free OpenStreetMap geocoder)
  useEffect(() => {
    if (!fullAddress && !city) return
    const query = encodeURIComponent(fullAddress || city)
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'TournamentApp/1.0' }
    })
      .then(r => r.json())
      .then(data => {
        if (data[0]) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) })
      })
      .catch(() => {})
  }, [fullAddress, city])

  // Initialize Leaflet map
  useEffect(() => {
    if (!coords || !mapRef.current) return

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (!window.L) {
        // Add Leaflet CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        // Add Leaflet JS
        await new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.onload = resolve
          document.head.appendChild(script)
        })
      }

      const L = window.L
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([coords.lat, coords.lon], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        html: `<div style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
          <span style="transform: rotate(45deg); font-size: 16px;">🏆</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        className: '',
      })

      L.marker([coords.lat, coords.lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>${venueName}</strong><br/><small>${fullAddress || city}</small>`)
        .openPopup()

      leafletMap.current = map
      setMapReady(true)
    }

    loadLeaflet()
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [coords])

  const openDirections = () => {
    if (coords) {
      window.open(`https://www.openstreetmap.org/directions?to=${coords.lat},${coords.lon}`, '_blank')
    }
  }

  if (!tournament?.ground) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-primary-400" />
          <span className="font-semibold text-dark-200 text-sm">Venue Location</span>
        </div>
        <button
          onClick={openDirections}
          className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          <Navigation size={12} />
          Directions
          <ExternalLink size={10} />
        </button>
      </div>

      {/* Map */}
      <div className="relative h-48 bg-dark-800">
        {!coords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <MapPin size={28} className="text-dark-600" />
            <p className="text-xs text-dark-600">Loading map...</p>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" style={{ zIndex: 1 }} />
      </div>

      {/* Venue info */}
      <div className="p-4">
        <h4 className="font-semibold text-dark-200 text-sm mb-1">{venueName}</h4>
        {fullAddress && <p className="text-xs text-dark-500 flex items-center gap-1.5"><MapPin size={11} />{fullAddress}</p>}
      </div>
    </motion.div>
  )
}
