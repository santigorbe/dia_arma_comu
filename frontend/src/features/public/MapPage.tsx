import { useCallback, useEffect, useState } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { readMapPoints } from './publicApi';
import { usePublicData } from './usePublicData';

const tiles = import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function FitMapToPoints({ points }: { points: { latitude: number; longitude: number }[] }) {
  const map = useMap();
  useEffect(() => {
    const bounds: LatLngBoundsExpression = points.map((point) => [point.latitude, point.longitude]);
    if (points.length === 1) map.setView(bounds[0] as [number, number], 15);
    else map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export function MapPage() {
  const { state, retry } = usePublicData(useCallback(readMapPoints, []));
  const [tileFailed, setTileFailed] = useState(false);
  return <section className="content-section page" aria-labelledby="map-title"><p className="eyebrow">Sede</p><h1 id="map-title">Mapa</h1>
    {state.status === 'loading' && <p role="status">Cargando puntos del mapa…</p>}{state.status === 'error' && <div role="alert"><p>Los puntos del mapa no están disponibles en este momento.</p><button className="button secondary" onClick={retry}>Reintentar carga de puntos del mapa</button></div>}
    {state.status === 'ready' && (state.data.points.length ? <><p className="map-disclaimer" role="note"><strong>Datos ilustrativos / no oficiales.</strong> Los puntos y sus coordenadas son deliberadamente aproximados y no representan ubicaciones institucionales oficiales.</p><div className="map-frame" aria-label="Mapa interactivo con puntos ilustrativos del evento"><MapContainer center={[state.data.points[0].latitude, state.data.points[0].longitude]} zoom={14} scrollWheelZoom={false}><FitMapToPoints points={state.data.points} /><TileLayer url={tiles} attribution="© OpenStreetMap contributors" eventHandlers={{ tileerror: () => setTileFailed(true) }} />{state.data.points.map((point) => <Marker key={point.id} position={[point.latitude, point.longitude]}><Popup><strong>{point.label}</strong><p>Datos ilustrativos / no oficiales.</p>{point.description && <p>{point.description}</p>}</Popup></Marker>)}</MapContainer></div>{tileFailed && <p role="alert">No se pudieron cargar los mosaicos del mapa. La lista accesible de ubicaciones sigue disponible más abajo.</p>}<h2 className="subsection-title">Ubicaciones ilustrativas</h2><ul className="map-list">{state.data.points.map((point) => <li key={point.id}><strong>{point.label}</strong>{point.description && <p>{point.description}</p>}<span className="meta">Referencia aproximada de demostración · no oficial</span></li>)}</ul></> : <p className="empty-state">Aún no se han publicado puntos en el mapa.</p>)}
  </section>;
}
