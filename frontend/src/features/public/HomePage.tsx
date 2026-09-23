import { useCallback } from 'react';
import { Link, useOutletContext } from 'react-router';
import { readContent } from './publicApi';
import type { PublicShellContext } from './PublicShell';
import { usePublicData } from './usePublicData';

const mediaUrl = import.meta.env.VITE_PUBLIC_HERO_MEDIA_URL;

export function HomePage() {
  const load = useCallback(readContent, []);
  const { state, retry } = usePublicData(load);
  const { openRegistration } = useOutletContext<PublicShellContext>();
  const hero = state.status === 'ready' ? state.data.entries.find((entry) => entry.key === 'hero') ?? state.data.entries[0] : undefined;
  return <>
    <section className="hero" aria-labelledby="hero-title" style={mediaUrl ? { backgroundImage: `linear-gradient(90deg, rgba(31,58,50,.92), rgba(32,37,34,.45)), url(${mediaUrl})` } : undefined}>
      <div className="hero-content">
        <p className="eyebrow">Public event experience</p>
        <h1 id="hero-title">{hero?.title ?? 'Event information'}</h1>
        {state.status === 'loading' && <p role="status">Loading published event content…</p>}
        {state.status === 'error' && <div role="alert"><p>Published event content is currently unavailable.</p><button className="button secondary" onClick={retry}>Retry loading content</button></div>}
        {state.status === 'ready' && <p>{hero?.body ?? 'Published event content will appear here when it is available.'}</p>}
        {!mediaUrl && <p className="asset-placeholder" role="note">Configurable media placeholder: no official institutional video or logo is included.</p>}
        <div className="cta-row"><Link to="/cronograma" className="button primary">View schedule</Link><Link to="/mapa" className="button secondary">View map</Link><button className="button tertiary" onClick={(event) => openRegistration(event.currentTarget)}>Register</button></div>
      </div>
    </section>
    <section className="content-section overview-section" aria-labelledby="overview-title"><div className="section-heading"><p className="eyebrow">Briefing</p><h2 id="overview-title">Event overview</h2></div>{state.status === 'ready' && state.data.entries.filter((entry) => entry !== hero).map((entry) => <article className="info-card" key={entry.key}><h3>{entry.title}</h3><p>{entry.body}</p></article>)}</section>
  </>;
}
