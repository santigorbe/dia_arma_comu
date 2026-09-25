import { useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const VENUE_CENTER: [number, number] = [-31.37241553150134, -64.29318416760644];
const tiles = import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const METERS_PER_DEG_LAT = 111320;
const METERS_PER_DEG_LNG = METERS_PER_DEG_LAT * Math.cos((VENUE_CENTER[0] * Math.PI) / 180);

function offset(northMeters: number, eastMeters: number): [number, number] {
  return [VENUE_CENTER[0] + northMeters / METERS_PER_DEG_LAT, VENUE_CENTER[1] + eastMeters / METERS_PER_DEG_LNG];
}

type ReferencePoint = {
  id: number;
  shape: 'square' | 'circle';
  color: string;
  description: string;
  position: [number, number];
};

const REFERENCE_POINTS: ReferencePoint[] = [
  { id: 1, shape: 'square', color: '#c0392b', description: 'Estacionamiento de JEMGE - SUBJEMGE - Pte CSAC y Pte CACI.', position: offset(-7, 40) },
  { id: 2, shape: 'square', color: '#f1c40f', description: 'Grl(s) y otras autoridades e invitados especiales.', position: offset(-17, 40) },
  { id: 3, shape: 'square', color: '#e67e22', description: 'Coroneles y Oficiales Jefes.', position: offset(-28, 40) },
  { id: 4, shape: 'square', color: '#8bc34a', description: 'Estacionamiento de Oficiales Subalternos, Suboficiales, CACI, Ceremonial y resto de invitados.', position: offset(-38, 45) },
  { id: 5, shape: 'square', color: '#26c6da', description: 'Estacionamiento de omnibus y camiones con invitados e integrantes de fracciones de Elementos ajenos al Cuartel UNION.', position: offset(31, 54) },
  { id: 6, shape: 'square', color: '#00695c', description: 'Estacionamiento para todo el personal Cuartel UNION.', position: offset(-38, 17) },
  { id: 7, shape: 'square', color: '#ca6f1e', description: 'Estacionamiento de catering.', position: offset(103, 24) },
  { id: 8, shape: 'square', color: '#ffffff', description: 'Estacionamiento de prensa.', position: offset(-26, 24) },
  { id: 9, shape: 'circle', color: '#b39ddb', description: 'PM.', position: offset(101, -52) },
  { id: 10, shape: 'square', color: '#9e9e9e', description: 'Lugar de formacion: Plaza de Armas del GA Parac 4.', position: offset(59, -45) },
  { id: 11, shape: 'square', color: '#c5e1a5', description: 'Lugar de Identificacion y encaminamiento de autoridades e invitados especiales.', position: VENUE_CENTER },
  { id: 12, shape: 'square', color: '#cfcfcf', description: 'Helipuerto.', position: offset(59, 161) },
  { id: 13, shape: 'circle', color: '#e91e8c', description: 'Policia y control de transito.', position: offset(-82, -2) }
];

function textColorFor(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1b251b' : '#ffffff';
}

function markerIcon(point: ReferencePoint) {
  const textColor = textColorFor(point.color);
  return L.divIcon({
    className: 'venue-pin',
    html: '<span class="venue-pin-badge venue-pin-' + point.shape + '" style="background:' + point.color + ';color:' + textColor + '">' + point.id + '</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14]
  });
}

function FlyToPoint({ position }: { position: [number, number] | null }) {
  const map = useMap();
  if (position) map.flyTo(position, 17, { duration: 0.6 });
  return null;
}

export function MapPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedPosition = useMemo(() => REFERENCE_POINTS.find((point) => point.id === selectedId)?.position ?? null, [selectedId]);
  const bounds = useMemo<[number, number][]>(() => REFERENCE_POINTS.map((point) => point.position), []);

  return (
    <section className="content-section page" aria-labelledby="map-title">
      <p className="eyebrow">Sede</p>
      <h1 id="map-title">Mapa</h1>
      <p className="map-disclaimer" role="note">
        <strong>Plano de estacionamiento y logistica - Cuartel UNION (GA Parac 4).</strong> Ubicaciones aproximadas
        referenciadas al punto de formacion; no georreferenciadas con precision topografica.
      </p>
      <div className="map-dashboard">
        <div className="map-frame map-frame-dark" aria-label="Mapa satelital del predio con puntos de referencia numerados">
          <MapContainer
            center={VENUE_CENTER}
            zoom={17}
            minZoom={16}
            maxZoom={19}
            scrollWheelZoom={false}
            bounds={bounds}
            boundsOptions={{ padding: [32, 32] }}
          >
            <TileLayer url={tiles} attribution="Tiles &copy; Esri" maxZoom={19} />
            <FlyToPoint position={selectedPosition} />
            {REFERENCE_POINTS.map((point) => (
              <Marker
                key={point.id}
                position={point.position}
                icon={markerIcon(point)}
                eventHandlers={{ click: () => setSelectedId(point.id) }}
              >
                <Popup>
                  <strong>Punto {point.id}</strong>
                  <p>{point.description}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <aside className="map-side-panel" aria-label="Referencias del plano">
          <h2 className="map-side-title">Referencias</h2>
          <ul className="map-legend">
            {REFERENCE_POINTS.map((point) => (
              <li
                key={point.id}
                className={selectedId === point.id ? 'map-legend-row selected' : 'map-legend-row'}
              >
                <button type="button" onClick={() => setSelectedId(point.id)}>
                  <span
                    className={'map-legend-badge map-legend-badge-' + point.shape}
                    style={{ background: point.color, color: textColorFor(point.color) }}
                    aria-hidden="true"
                  >
                    {point.id}
                  </span>
                  <span className="map-legend-text">{point.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
