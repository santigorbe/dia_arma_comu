import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faCalendarDays,
  faChampagneGlasses,
  faFlagCheckered,
  faHandshake,
  faLocationDot,
  faMedal,
  faMicrophone,
  faUserGroup
} from '@fortawesome/free-solid-svg-icons';
import { readSchedule, type ScheduleEntry } from './publicApi';
import { usePublicData } from './usePublicData';

type ScheduleCategory = { icon: FontAwesomeIconProps['icon']; label: string; accent: string };

const CATEGORY_META: Record<string, ScheduleCategory> = {
  recepcion: { icon: faHandshake, label: 'Recepción', accent: '#d4a017' },
  apertura: { icon: faBullhorn, label: 'Apertura', accent: '#c0392b' },
  premios: { icon: faMedal, label: 'Premios', accent: '#9b59b6' },
  discurso: { icon: faMicrophone, label: 'Discurso', accent: '#2f80c4' },
  desfile: { icon: faFlagCheckered, label: 'Desfile', accent: '#1f8a70' },
  brindis: { icon: faChampagneGlasses, label: 'Brindis', accent: '#2e9e4f' }
};

const DEFAULT_CATEGORY: ScheduleCategory = { icon: faUserGroup, label: 'Actividad', accent: '#8a8f80' };

function categoryFor(entry: ScheduleEntry): ScheduleCategory {
  return (entry.category && CATEGORY_META[entry.category]) || DEFAULT_CATEGORY;
}

function textColorFor(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1b251b' : '#f0efe4';
}

function isHappeningNow(entry: ScheduleEntry, now: number): boolean {
  const start = new Date(entry.startsAt).getTime();
  const end = new Date(entry.endsAt).getTime();
  return now >= start && now < end;
}

export function SchedulePage() {
  const { state, retry } = usePublicData(useCallback(readSchedule, []));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="content-section page" aria-labelledby="schedule-title">
      <p className="eyebrow">Programa</p>
      <h1 id="schedule-title">Cronograma</h1>
      {state.status === 'loading' && <p role="status">Cargando cronograma…</p>}
      {state.status === 'error' && (
        <div role="alert">
          <p>El cronograma no está disponible en este momento.</p>
          <button className="button secondary" onClick={retry}>Reintentar carga del cronograma</button>
        </div>
      )}
      {state.status === 'ready' && (state.data.entries.length ? (
        <>
          <ol className="schedule-timeline">
            {state.data.entries.map((entry) => {
              const category = categoryFor(entry);
              const iconColor = textColorFor(category.accent);
              const active = isHappeningNow(entry, now);
              return (
                <li key={entry.id} className={active ? 'schedule-timeline-item active' : 'schedule-timeline-item'}>
                  <time className="schedule-time" dateTime={entry.startsAt}>
                    {new Intl.DateTimeFormat('es', { timeStyle: 'short' }).format(new Date(entry.startsAt))}
                  </time>
                  <span className="schedule-icon-col">
                    <span className="schedule-icon" style={{ background: category.accent, color: iconColor }}>
                      <FontAwesomeIcon icon={category.icon} aria-hidden="true" />
                    </span>
                  </span>
                  <div className="schedule-content">
                    <div className="schedule-heading">
                      <h2>{entry.title}</h2>
                      <span className="schedule-badge" style={{ background: `${category.accent}29`, color: category.accent }}>
                        {active && <span className="schedule-live-dot" aria-hidden="true" />}
                        {active ? 'En curso' : category.label}
                      </span>
                    </div>
                    {entry.description && <p>{entry.description}</p>}
                    {entry.location && (
                      <p className="meta">
                        <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Ubicación: {entry.location}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="schedule-disclaimer" role="note">
            <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> En caso de lluvia se mantienen todos los actos, con excepción del desfile.
          </p>
        </>
      ) : (
        <p className="empty-state">Aún no se han publicado entradas en el cronograma.</p>
      ))}
    </section>
  );
}
