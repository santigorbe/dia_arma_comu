import { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faClock, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { illustrativeSchedule } from './illustrativeData';
import { readSchedule } from './publicApi';
import { usePublicData } from './usePublicData';

export function SchedulePage() {
  const { state, retry } = usePublicData(useCallback(readSchedule, []));
  return <section className="content-section page" aria-labelledby="schedule-title"><p className="eyebrow">Programme</p><h1 id="schedule-title">Schedule</h1>
    {state.status === 'loading' && <p role="status">Loading schedule…</p>}{state.status === 'error' && <div role="alert"><p>The schedule is currently unavailable.</p><button className="button secondary" onClick={retry}>Retry loading schedule</button></div>}
    {state.status === 'ready' && (state.data.entries.length ? <ol className="schedule-list">{state.data.entries.map((entry) => <li key={entry.id}><time dateTime={entry.startsAt}><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.startsAt))}</time><div><h2>{entry.title}</h2>{entry.description && <p>{entry.description}</p>}{entry.location && <p className="meta"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Location: {entry.location}</p>}</div></li>)}</ol> : <p className="empty-state">No schedule entries have been published yet.</p>)}
    {state.status === 'ready' && state.data.entries.length > 0 && <section className="illustrative-preview" aria-labelledby="illustrative-schedule-title"><p className="eyebrow">Illustrative / not official</p><h2 id="illustrative-schedule-title">Example schedule preview</h2><p>This sample is separate from published schedule entries and does not describe event operations.</p><ol className="schedule-list illustrative-list">{illustrativeSchedule.map((entry) => <li key={entry.time}><time><FontAwesomeIcon icon={faClock} aria-hidden="true" /> {entry.time}</time><div><h3>{entry.title}</h3><p className="meta"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> {entry.location}</p></div></li>)}</ol></section>}</section>;
}
