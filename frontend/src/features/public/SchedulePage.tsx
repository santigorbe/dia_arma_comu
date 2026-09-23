import { useCallback } from 'react';
import { readSchedule } from './publicApi';
import { usePublicData } from './usePublicData';

export function SchedulePage() {
  const { state, retry } = usePublicData(useCallback(readSchedule, []));
  return <section className="content-section page" aria-labelledby="schedule-title"><p className="eyebrow">Programme</p><h1 id="schedule-title">Schedule</h1>
    {state.status === 'loading' && <p role="status">Loading schedule…</p>}{state.status === 'error' && <div role="alert"><p>The schedule is currently unavailable.</p><button className="button secondary" onClick={retry}>Retry loading schedule</button></div>}
    {state.status === 'ready' && (state.data.entries.length ? <ol className="schedule-list">{state.data.entries.map((entry) => <li key={entry.id}><time dateTime={entry.startsAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.startsAt))}</time><div><h2>{entry.title}</h2>{entry.description && <p>{entry.description}</p>}{entry.location && <p className="meta">Location: {entry.location}</p>}</div></li>)}</ol> : <p className="empty-state">No schedule entries have been published yet.</p>)}</section>;
}
