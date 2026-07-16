import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import log from '../lib/i18n/log'
import type { TrackedPoint } from '../lib/gps'

// Mappa reale del percorso (roadmap v2, GPS potenziato 3/3): tile raster
// MapTiler dietro Leaflet. Questo modulo è importato SOLO via React.lazy da
// ActivityEditModal: Leaflet (~150 kB) si scarica alla prima attività GPS
// aperta, non al caricamento dell'app. Se la key manca o si è offline il
// chiamante mostra la sagoma stilizzata (RouteShape) al posto della mappa.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

interface Props {
  points: TrackedPoint[]
  heightPx?: number
}

export default function RouteMap({ points, heightPx = 192 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || points.length < 2) return

    // Lo stile tile segue il tema dell'app (html.light, vedi ThemeContext);
    // scelto al mount: cambiare tema con il modale aperto non ridisegna la
    // mappa, caso limite accettato.
    const isLight = document.documentElement.classList.contains('light')
    const styleId = isLight ? 'streets-v2' : 'streets-v2-dark'
    // Leaflet scrive i colori come attributi SVG, dove var(--red) non viene
    // risolto: si legge il valore calcolato del token al mount.
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#F44352'
    const retina = L.Browser.retina ? '@2x' : ''

    const map = L.map(el, {
      // Niente zoom con la rotellina: la mappa vive dentro un modale che
      // scorre e catturare lo scroll del mouse sarebbe una trappola.
      scrollWheelZoom: false,
    })
    L.tileLayer(
      `https://api.maptiler.com/maps/${styleId}/{z}/{x}/{y}${retina}.png?key=${MAPTILER_KEY}`,
      {
        // Tile MapTiler da 512px: servono tileSize/zoomOffset o lo zoom è sfasato
        tileSize: 512,
        zoomOffset: -1,
        maxZoom: 19,
        crossOrigin: true,
        // Obbligatoria per i termini d'uso MapTiler/OSM
        attribution:
          '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    ).addTo(map)

    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number])
    const line = L.polyline(latlngs, {
      color: accent,
      weight: 4,
      opacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map)
    // Stessa convenzione di RouteShape: partenza piena tenue, arrivo cerchiato
    L.circleMarker(latlngs[0], {
      radius: 5,
      color: accent,
      fillColor: accent,
      fillOpacity: 0.5,
      weight: 2,
    }).addTo(map)
    L.circleMarker(latlngs[latlngs.length - 1], {
      radius: 6,
      color: accent,
      fillColor: '#ffffff',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map)
    map.fitBounds(line.getBounds(), { padding: [24, 24] })

    return () => {
      map.remove()
    }
  }, [points])

  return (
    <div
      ref={containerRef}
      // isolation: i pane interni di Leaflet hanno z-index fino a 700, senza
      // uno stacking context proprio coprirebbero l'header sticky del modale.
      style={{ height: heightPx, isolation: 'isolate' }}
      className="rounded-xl overflow-hidden"
      role="application"
      aria-label={log.map.ariaLabel}
    />
  )
}
