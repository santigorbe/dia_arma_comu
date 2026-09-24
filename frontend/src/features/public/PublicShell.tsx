import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCalendarCheck, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Outlet } from 'react-router';
import { RegistrationModal } from './RegistrationModal';

const dismissedRegistrationKey = 'communications_day_registration_dismissed';

export type PublicShellContext = { openRegistration: (opener?: HTMLElement | null) => void };

export function PublicShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const registrationOpener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (window.location.hash === '#register' && !window.localStorage.getItem(dismissedRegistrationKey)) setRegistrationOpen(true);
  }, []);

  const closeRegistration = useCallback(() => {
    window.localStorage.setItem(dismissedRegistrationKey, 'true');
    setRegistrationOpen(false);
  }, []);
  const openRegistration = useCallback((opener?: HTMLElement | null) => {
    registrationOpener.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setRegistrationOpen(true);
  }, []);

  return <div className="public-app">
    <a className="skip-link" href="#main-content">Ir al contenido principal</a>
    <header className="site-header">
      <NavLink to="/" className="brand" aria-label="Página principal del evento"><img className="brand-logo" src="/logo_ciber.png" alt="Logo de Ciberdefensa" /><span className="brand-copy"><span>Ejército Argentino</span><span>COMUNICACIONES E INFORMÁTICA</span></span></NavLink>
      <button ref={menuButton} className="menu-button" aria-label={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} title={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}><FontAwesomeIcon icon={faBars} aria-hidden="true" /></button>
      <nav id="site-navigation" className={menuOpen ? 'site-nav open' : 'site-nav'} aria-label="Navegación principal">
        <NavLink to="/" end onClick={() => setMenuOpen(false)}>Inicio</NavLink>
        <NavLink to="/cronograma" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faCalendarCheck} aria-hidden="true" /> Cronograma</NavLink>
        <NavLink to="/mapa" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Mapa</NavLink>
        <button className="nav-register" onClick={(event) => { setMenuOpen(false); openRegistration(event.currentTarget); }}>Registrarse</button>
      </nav>
    </header>
    <main id="main-content" className="public-main"><Outlet context={{ openRegistration } satisfies PublicShellContext} /></main>
    <nav className="mobile-nav" aria-label="Navegación móvil"><NavLink to="/" end>Inicio</NavLink><NavLink to="/cronograma"><FontAwesomeIcon icon={faCalendarCheck} aria-hidden="true" /> Cronograma</NavLink><NavLink to="/mapa"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Mapa</NavLink><button onClick={(event) => openRegistration(event.currentTarget)}>Registrarse</button></nav>
    <footer className="site-footer">Información del evento · El contenido es publicado por los operadores del evento.</footer>
    <RegistrationModal open={registrationOpen} onClose={closeRegistration} returnFocusRef={registrationOpener} />
  </div>;
}
