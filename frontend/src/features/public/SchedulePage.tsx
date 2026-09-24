import { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { readSchedule } from './publicApi';
import { usePublicData } from './usePublicData';

export function SchedulePage() {
  const { state, retry } = usePublicData(useCallback(readSchedule, []));
  return <section className="content-section page" aria-labelledby="schedule-title"><p className="eyebrow">Programa</p><h1 id="schedule-title">Cronograma</h1>
    {state.status === 'loading' && <p role="status">Cargando cronograma…</p>}{state.status === 'error' && <div role="alert"><p>El cronograma no está disponible en este momento.</p><button className="button secondary" onClick={retry}>Reintentar carga del cronograma</button></div>}
    {state.status === 'ready' && (state.data.entries.length ? <ol className="schedule-list">{state.data.entries.map((entry) => <li key={entry.id}><time dateTime={entry.startsAt}><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> {new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.startsAt))}</time><div><h2>{entry.title}</h2>{entry.description && <p>{entry.description}</p>}{entry.location && <p className="meta"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Ubicación: {entry.location}</p>}</div></li>)}</ol> : <p className="empty-state">Aún no se han publicado entradas en el cronograma.</p>)}
    </section>;
}
