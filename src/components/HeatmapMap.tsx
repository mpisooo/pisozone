import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import heatmapText from '../lib/i18n/heatmap'
import type { RoutePoint } from '../types'

// Heatmap personale (roadmap v4, pilastro 02): stesso motore di RouteMap.tsx
// (tile MapTiler dietro Leaflet), ma per MOLTI percorsi sovrapposti invece di
// uno solo. Niente libreria di "vero" heatmap (leaflet.heat): un tratto
// sottile e semi-trasparente per percorso, disegnato su un unico renderer
// canvas, ottiene lo stesso effetto — dove passano più giri le linee si
// sovrappongono e il colore si accumula verso pieno, esattamente come un
// heatmap "a densità". Zero dipendenze nuove.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

interface Props {
  routes: RoutePoint[][]
  heightPx?: number
}

export default function HeatmapMap({ routes, heightPx = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || routes.length === 0) return

    const isLight = document.documentElement.classList.contains('light')
    const styleId = isLight ? 'streets-v2' : 'streets-v2-dark'
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#F44352'
    const retina = L.Browser.retina ? '@2x' : ''

    // Pagina intera, non un modale che scorre: qui lo zoom con la rotellina
    // ha senso (diverso da RouteMap, che vive dentro ActivityEditModal).
    const map = L.map(el, { renderer: L.canvas({ padding: 0.5 }) })
    L.tileLayer(
      `https://api.maptiler.com/maps/${styleId}/{z}/{x}/{y}${retina}.png?key=${MAPTILER_KEY}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        maxZoom: 19,
        crossOrigin: true,
        attribution:
          '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    ).addTo(map)

    const allLatLngs: [number, number][] = []
    for (const route of routes) {
      const latlngs = route.map((p) => [p.lat, p.lng] as [number, number])
      allLatLngs.push(...latlngs)
      L.polyline(latlngs, {
        color: accent,
        weight: 2.5,
        // Bassa opacità voluta: è l'accumulo di più tratti sovrapposti a
        // creare l'effetto "heat", non il singolo percorso.
        opacity: 0.22,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map)
    }
    map.fitBounds(L.latLngBounds(allLatLngs), { padding: [24, 24] })

    return () => {
      map.remove()
    }
  }, [routes])

  return (
    <div
      ref={containerRef}
      style={{ height: heightPx, isolation: 'isolate' }}
      className="rounded-xl overflow-hidden"
      role="application"
      aria-label={heatmapText.mapAriaLabel}
    />
  )
}
