import { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faLocationDot, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { Link, useOutletContext } from 'react-router';
import { readContent } from './publicApi';
import type { PublicShellContext } from './PublicShell';
import { usePublicData } from './usePublicData';

export function HomePage() {
  const load = useCallback(readContent, []);
  const { state, retry } = usePublicData(load);
  const { openRegistration } = useOutletContext<PublicShellContext>();
  const hero = state.status === 'ready' ? state.data.entries.find((entry) => entry.key === 'hero') ?? state.data.entries[0] : undefined;
  const status = state.status === 'ready' ? 'Published' : state.status === 'error' ? 'Attention' : 'Loading';
  return <>
    <section className="hero" aria-labelledby="hero-title" style={{ backgroundImage: 'url(/strikers.jpg)' }}>
      <div className="hero-content">
        <div className="hero-ledger">
          <div><p className="hero-kicker">Operations briefing</p><p className="hero-record">Date / see schedule</p></div>
          <p className="hero-status">Status / {status}</p>
        </div>
        <h1 id="hero-title">{hero?.title ?? 'Event information'}</h1>
        {state.status === 'loading' && <p role="status">Loading published event content…</p>}
        {state.status === 'error' && <div role="alert"><p>Published event content is currently unavailable.</p><button className="button secondary" onClick={retry}>Retry loading content</button></div>}
        {state.status === 'ready' && <p className="hero-copy">{hero?.body ?? 'Published event content will appear here when it is available.'}</p>}
        <p className="asset-context" role="note">Background photograph supplied for this public information page.</p>
        <div className="cta-row"><Link to="/cronograma" className="button primary"><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> View schedule</Link><Link to="/mapa" className="button secondary"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> View map</Link><button className="button tertiary" onClick={(event) => openRegistration(event.currentTarget)}><FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" /> Register</button></div>
      </div>
    </section>
    <section className="content-section overview-section" aria-labelledby="overview-title"><div className="section-heading"><div><p className="eyebrow">Briefing</p><h2 id="overview-title">Event overview</h2></div><figure className="context-emblem"><img src="/logo_ciber.png" alt="Contextual cyber emblem provided for this page; it is not the event logo." /><figcaption>Contextual emblem</figcaption></figure></div>{state.status === 'ready' && state.data.entries.filter((entry) => entry !== hero).map((entry) => <article className="info-card" key={entry.key}><h3>{entry.title}</h3><p>{entry.body}</p></article>)}</section>
  </>;
}
