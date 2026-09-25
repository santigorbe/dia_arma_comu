import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { readContent } from './publicApi';
import { usePublicData } from './usePublicData';

const heroVideo = '/Trailer Programa Nuestro Ejército - Asalto y Maniobra [dVQsrJ4X4Rw].mp4';

export function HomePage() {
  const load = useCallback(readContent, []);
  const { state, retry } = usePublicData(load);
  const hero = state.status === 'ready' ? state.data.entries.find((entry) => entry.key === 'hero') ?? state.data.entries[0] : undefined;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const updateMotionPreference = () => setReduceMotion(query.matches);
    updateMotionPreference();
    query.addEventListener('change', updateMotionPreference);
    return () => query.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reduceMotion) videoRef.current?.pause();
  }, [reduceMotion]);

  return <>
    <section className="hero" aria-labelledby="hero-title" style={{ backgroundImage: 'url(/strikers.jpg)' }}>
      <video ref={videoRef} className="hero-video" autoPlay={!reduceMotion} muted loop playsInline poster="/strikers.jpg" aria-hidden="true" tabIndex={-1}>
        <source src={heroVideo} type="video/mp4" />
      </video>
      <div className="hero-content">
        <p className="hero-badge">84° ANIVERSARIO · SAN GABRIEL ARCÁNGEL</p>
        <h1 id="hero-title">Celebración del Día del Arma de Comunicaciones</h1>
        <p className="hero-subtitle">y del Sistema de Computación de Datos</p>
        <p className="hero-label">
          <span className="hero-label-item"><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> 2 DE OCTUBRE DE 2026 · 11:00 HS</span>
          <span className="hero-label-item"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> GUARNICIÓN EJÉRCITO “CÓRDOBA”</span>
        </p>
        {state.status === 'loading' && <p role="status">Cargando el contenido publicado del evento…</p>}
        {state.status === 'error' && <div role="alert"><p>El contenido publicado del evento no está disponible en este momento.</p><button className="button secondary" onClick={retry}>Reintentar carga del contenido</button></div>}
        {state.status === 'ready' && <p className="hero-copy">{hero?.body ?? 'El contenido publicado del evento aparecerá aquí cuando esté disponible.'}</p>}
        <div className="cta-row"><Link to="/cronograma" className="button primary"><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> VER CRONOGRAMA</Link><Link to="/mapa" className="button secondary"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> VER MAPA OPERATIVO</Link></div>
      </div>
    </section>
    <section className="content-section overview-section" aria-labelledby="overview-title"><div className="section-heading"><div><p className="eyebrow">Informe</p><h2 id="overview-title">Resumen del evento</h2></div><figure className="context-emblem"><img src="/logo_ciber.png" alt="Emblema cibernético contextual provisto para esta página; no es el logotipo del evento." /><figcaption>Emblema contextual</figcaption></figure></div>{state.status === 'ready' && state.data.entries.filter((entry) => entry !== hero).map((entry) => <article className="info-card" key={entry.key}><h3>{entry.title}</h3><p>{entry.body}</p></article>)}</section>
  </>;
}
