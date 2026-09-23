import { useCallback, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { readMapPoints } from './publicApi';
import { usePublicData } from './usePublicData';

const tiles = import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function MapPage() {
  const { state, retry } = usePublicData(useCallback(readMapPoints, []));
  const [tileFailed, setTileFailed] = useState(false);
  return <section className="content-section page" aria-labelledby="map-title"><p className="eyebrow">Venue</p><h1 id="map-title">Map</h1>
    {state.status === 'loading' && <p role="status">Loading map points…</p>}{state.status === 'error' && <div role="alert"><p>Map points are currently unavailable.</p><button className="button secondary" onClick={retry}>Retry loading map points</button></div>}
    {state.status === 'ready' && (state.data.points.length ? <><div className="map-frame" aria-label="Interactive event map"><MapContainer center={[state.data.points[0].latitude, state.data.points[0].longitude]} zoom={14} scrollWheelZoom={false}><TileLayer url={tiles} attribution="© OpenStreetMap contributors" eventHandlers={{ tileerror: () => setTileFailed(true) }} />{state.data.points.map((point) => <Marker key={point.id} position={[point.latitude, point.longitude]}><Popup><strong>{point.label}</strong>{point.description && <p>{point.description}</p>}</Popup></Marker>)}</MapContainer></div>{tileFailed && <p role="alert">Map tiles could not load. The accessible location list remains available below.</p>}<h2 className="subsection-title">Locations</h2><ul className="map-list">{state.data.points.map((point) => <li key={point.id}><strong>{point.label}</strong>{point.description && <p>{point.description}</p>}<span className="meta">Coordinates: {point.latitude}, {point.longitude}</span></li>)}</ul></> : <p className="empty-state">No map points have been published yet.</p>)}</section>;
}
