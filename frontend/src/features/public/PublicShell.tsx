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
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <NavLink to="/" className="brand" aria-label="Event home"><span className="brand-mark" aria-hidden="true">◆</span><span>Event information</span></NavLink>
      <button ref={menuButton} className="menu-button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}><FontAwesomeIcon icon={faBars} aria-hidden="true" /> Menu</button>
      <nav id="site-navigation" className={menuOpen ? 'site-nav open' : 'site-nav'} aria-label="Primary navigation">
        <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
        <NavLink to="/cronograma" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faCalendarCheck} aria-hidden="true" /> Schedule</NavLink>
        <NavLink to="/mapa" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Map</NavLink>
        <button className="nav-register" onClick={(event) => { setMenuOpen(false); openRegistration(event.currentTarget); }}>Register</button>
      </nav>
    </header>
    <main id="main-content" className="public-main"><Outlet context={{ openRegistration } satisfies PublicShellContext} /></main>
    <nav className="mobile-nav" aria-label="Mobile navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/cronograma"><FontAwesomeIcon icon={faCalendarCheck} aria-hidden="true" /> Schedule</NavLink><NavLink to="/mapa"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Map</NavLink><button onClick={(event) => openRegistration(event.currentTarget)}>Register</button></nav>
    <footer className="site-footer">Event information · Content is published by event operators.</footer>
    <RegistrationModal open={registrationOpen} onClose={closeRegistration} returnFocusRef={registrationOpener} />
  </div>;
}
