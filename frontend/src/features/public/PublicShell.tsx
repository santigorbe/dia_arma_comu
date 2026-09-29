import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCalendarCheck, faHouse, faLocationDot, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Outlet, useLocation } from 'react-router';
import { RegistrationModal } from './RegistrationModal';

const dismissedRegistrationKey = 'communications_day_registration_dismissed';

export type PublicShellContext = { openRegistration: (opener?: HTMLElement | null) => void };

export function PublicShell() {
  const { pathname } = useLocation();
  const isRegistrationPage = pathname.replace(/\/+$/, '') === '/register';
  const [menuOpen, setMenuOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const registrationPrompted = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const registrationOpener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isRegistrationPage || registrationPrompted.current) return;
    registrationPrompted.current = true;
    try {
      if (window.localStorage.getItem(dismissedRegistrationKey)) return;
    } catch {
      // Storage restrictions must not prevent opening or closing the dialog.
    }
    setRegistrationOpen(true);
  }, [isRegistrationPage]);

  const closeRegistration = useCallback(() => {
    setRegistrationOpen(false);
    try {
      window.localStorage.setItem(dismissedRegistrationKey, 'true');
    } catch {
      // Dismissal still applies to this mounted shell when persistence is denied.
    }
  }, []);
  const openRegistration = useCallback((opener?: HTMLElement | null) => {
    if (isRegistrationPage) {
      document.querySelector<HTMLInputElement>('#main-content input[name="fullName"]')?.focus();
      return;
    }
    registrationOpener.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setRegistrationOpen(true);
  }, [isRegistrationPage]);
  const completeRegistration = useCallback(() => {
    setRegistrationOpen(false);
    setRegistrationSuccess(true);
  }, []);

  useEffect(() => {
    if (!registrationSuccess) return;
    const timeout = window.setTimeout(() => setRegistrationSuccess(false), 3_000);
    return () => window.clearTimeout(timeout);
  }, [registrationSuccess]);

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
    {registrationSuccess && <div className="registration-success-popup" role="status" aria-live="polite">El registro fue aceptado. Recibirá la confirmación por correo electrónico.</div>}
    <nav className="mobile-nav" aria-label="Navegación móvil">
      <NavLink to="/" end><FontAwesomeIcon icon={faHouse} aria-hidden="true" /><span>Inicio</span></NavLink>
      <NavLink to="/cronograma"><FontAwesomeIcon icon={faCalendarCheck} aria-hidden="true" /><span>Cronograma</span></NavLink>
      <NavLink to="/mapa"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /><span>Mapa</span></NavLink>
      <button onClick={(event) => openRegistration(event.currentTarget)}><FontAwesomeIcon icon={faUserPlus} aria-hidden="true" /><span>Registrarse</span></button>
    </nav>
    <footer className="site-footer">Información del evento · El contenido es publicado por los operadores del evento.</footer>
    <RegistrationModal open={registrationOpen && !isRegistrationPage} onClose={closeRegistration} onSuccessfulRegistration={completeRegistration} returnFocusRef={registrationOpener} />
  </div>;
}
