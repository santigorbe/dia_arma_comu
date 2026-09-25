import { FormEvent, useState } from 'react';
import { apiRequest, type ApiError } from '../../lib/apiClient';
import { useVisit } from '../visits/VisitProvider';

const MILITARY_RANKS: Array<{ name: string; code: string }> = [
  { name: 'Teniente General', code: 'TG' },
  { name: 'General de División', code: 'GD' },
  { name: 'General de Brigada', code: 'GB' },
  { name: 'Coronel Mayor', code: 'CY' },
  { name: 'Coronel', code: 'CR' },
  { name: 'Teniente Coronel', code: 'TC' },
  { name: 'Mayor', code: 'MY' },
  { name: 'Capitán', code: 'CT' },
  { name: 'Teniente Primero', code: 'TP' },
  { name: 'Teniente', code: 'TT' },
  { name: 'Subteniente', code: 'ST' },
  { name: 'Suboficial Mayor', code: 'SM' },
  { name: 'Suboficial Principal', code: 'SP' },
  { name: 'Sargento Ayudante', code: 'SA' },
  { name: 'Sargento Primero', code: 'SI' },
  { name: 'Sargento', code: 'SG' },
  { name: 'Cabo Primero', code: 'CI' },
  { name: 'Cabo', code: 'CB' },
  { name: 'Soldado Voluntario de 1ra', code: 'VP' },
  { name: 'Soldado Voluntario de 2da', code: 'VS' },
  { name: 'Soldado Voluntario "En Comisión"', code: 'VS "EC"' }
];

const SERVICE_STATUSES: Array<{ value: 'actividad' | 'retiro'; label: string }> = [
  { value: 'actividad', label: 'En actividad' },
  { value: 'retiro', label: 'Retiro' }
];

const UNIT_GROUPS: Array<{ label: string; units: string[] }> = [
  {
    label: 'Comisión y Dirección General',
    units: [
      'Comisión del Arma de Comunicaciones e Informática "Arcángel San Gabriel"',
      'Dirección General de Comunicaciones, Informática y Ciberdefensa (DGCICD)',
      'DGCICD / Dirección de Informática',
      'DGCICD / Dirección de Comunicaciones y Guerra Electrónica',
      'DGCICD / Dirección de Ciberdefensa',
      'DGCICD / División Material',
      'DGCICD / División Presupuesto',
      'DGCICD / División Control de Gestión',
      'DGCICD / División Personal',
      'DGCICD / División Jurídica',
      'Comando Conjunto de Ciberdefensa'
    ]
  },
  {
    label: 'Batallones y Agrupaciones',
    units: [
      'Batallón de Comunicaciones 141',
      'Batallón de Comunicaciones 121',
      'Batallón de Comunicaciones 181',
      'Batallón de Comunicaciones 602',
      'Batallón de Comunicaciones Satelital 601',
      'Batallón de Guerra Electrónica y Ciberdefensa 601',
      'Batallón de Mantenimiento de Comunicaciones 601',
      'Batallón de Inteligencia 141',
      'Agrupación de Comunicaciones 601 "Tcnl Higinio Vallejos"',
      'Escuadrón de Comunicaciones Blindado 1',
      'Escuadrón de Comunicaciones Blindado 2',
      'BAL "Salta"'
    ]
  },
  {
    label: 'Compañías de Comunicaciones',
    units: [
      'Compañía de Comunicaciones Paracaidista 4',
      'Compañía de Comunicaciones de Monte 3',
      'Compañía de Comunicaciones de Monte 12',
      'Compañía de Comunicaciones de Montaña 5',
      'Compañía de Comunicaciones de Montaña 6',
      'Compañía de Comunicaciones de Montaña 8',
      'Compañía de Comunicaciones Mecanizada 9',
      'Compañía de Comunicaciones Mecanizada 10',
      'Compañía de Comunicaciones Mecanizada 11',
      'CMN / Compañía de Comunicaciones',
      'ESESC / Compañía de Comunicaciones'
    ]
  },
  {
    label: 'Institutos y Escuelas',
    units: [
      'Colegio Militar de la Nación',
      'Escuela Superior de Guerra del Ejército',
      'Escuela de Suboficiales de Ejército "Sargento Cabral"',
      'Escuela de Comunicaciones "Tte Grl Julio Alberto Lagos"',
      'Liceo Militar General Araoz Lamadrid'
    ]
  },
  {
    label: 'Otras dependencias',
    units: [
      'Ministerio de Defensa',
      'Secretaría General del Ejército',
      'Comando de la 2ª División de Ejército',
      'Comando de la Brigada Aerotransportada IV',
      'Dirección General de Inteligencia',
      'Dirección General de Salud'
    ]
  }
];

const OTHER_UNIT_VALUE = '__otro__';

const activeConsentVersion = import.meta.env.VITE_ACTIVE_CONSENT_VERSION ?? 'consent-local-placeholder';
const activeConsentText = import.meta.env.VITE_CONSENT_TEXT ?? 'Texto local de consentimiento no definitivo. Los operadores deben proporcionar la redacción aprobada del consentimiento antes de su uso en producción.';

type RegistrationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; participantId: string }
  | { status: 'error' | 'conflict' | 'stale_consent'; message: string; activeConsentVersion?: string };

export function RegisterPage({ embedded = false, onSuccessfulRegistration }: { embedded?: boolean; onSuccessfulRegistration?: () => void }) {
  const visit = useVisit();
  const [state, setState] = useState<RegistrationState>({ status: 'idle' });
  const [consentVersion, setConsentVersion] = useState(activeConsentVersion);
  const [personnelType, setPersonnelType] = useState<'militar' | 'civil'>('civil');
  const [unit, setUnit] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!visit.visitId) {
      setState({ status: 'error', message: 'La visita anónima debe inicializarse antes del registro.' });
      return;
    }

    const form = new FormData(formElement);
    const accepted = form.get('consent') === 'on';
    if (!accepted) {
      setState({ status: 'error', message: 'El consentimiento es obligatorio antes del registro.' });
      return;
    }

    setState({ status: 'loading' });
    try {
      const response = await apiRequest<{ participantId: string }>('/api/public/registrations', {
        method: 'POST',
        body: JSON.stringify({
          requestIdempotencyKey: crypto.randomUUID(),
          visitId: visit.visitId,
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: optionalString(form.get('phone')),
          unitOrOrganization: unit === OTHER_UNIT_VALUE ? optionalString(form.get('otherUnit')) : optionalString(unit),
          personnelType,
          militaryRank: personnelType === 'militar' ? optionalString(form.get('militaryRank')) : undefined,
          serviceStatus: personnelType === 'militar' ? optionalString(form.get('serviceStatus')) : undefined,
          consent: { accepted: true, version: consentVersion }
        })
      });
      if (onSuccessfulRegistration) {
        formElement.reset();
        setPersonnelType('civil');
        setUnit('');
        setState({ status: 'idle' });
        onSuccessfulRegistration();
        return;
      }
      setState({ status: 'success', participantId: response.participantId });
    } catch (error) {
      if (!navigator.onLine) {
        setState({ status: 'error', message: 'El registro requiere conexión a internet y no se encoló. Reconéctese y vuelva a enviar el formulario.' });
        return;
      }
      const apiError = error as ApiError;
      const body = apiError.body as { error?: string; details?: unknown; activeConsentVersion?: string } | undefined;
      if (body?.error === 'stale_consent_version') {
        const nextVersion = body.activeConsentVersion ?? consentVersion;
        setConsentVersion(nextVersion);
        setState({ status: 'stale_consent', message: 'El consentimiento cambió. Revise la versión activa y vuelva a enviar el formulario.', activeConsentVersion: nextVersion });
        return;
      }
      if (body?.error === 'participant_conflict') {
        setState({ status: 'conflict', message: 'Ya existe un registro para esta identidad del evento con datos diferentes.' });
        return;
      }
      setState({ status: 'error', message: body?.error === 'validation_failed' ? 'Revise los campos del registro marcados.' : 'El registro no pudo completarse. Inténtelo de nuevo.' });
    }
  }

  const Container = 'section';
  return (
    <Container className={`public-register ${embedded ? 'public-register-embedded' : ''}`}>
      <div className="register-heading"><p className="eyebrow">Registro público</p><h1 id={embedded ? 'registration-title' : undefined}>Regístrese para participar del evento</h1></div>
      <p className="registration-notice">Esta copia local no es definitiva. El contenido institucional y la redacción aprobada del consentimiento son provistos por los operadores.</p>
      {visit.status === 'error' && <StatusMessage tone="error" message={visit.error ?? 'No se pudo inicializar la visita.'} />}
      {state.status !== 'idle' && state.status !== 'loading' && <StatusMessage tone={state.status === 'success' ? 'success' : 'error'} message={state.status === 'success' ? 'El registro se aceptó con el consentimiento validado por el sistema.' : state.message} />}
      <form className="registration-form" onSubmit={submit} noValidate>
        <label>
          Nombre completo
          <input name="fullName" required minLength={2} maxLength={120} />
        </label>
        <label>
          Correo electrónico
          <input name="email" type="email" required />
        </label>
        <label>
          Teléfono
          <input name="phone" maxLength={40} />
        </label>
        <label>
          Personal
          <select
            name="personnelType"
            required
            value={personnelType}
            onChange={(event) => setPersonnelType(event.target.value as 'militar' | 'civil')}
          >
            <option value="civil">Civil</option>
            <option value="militar">Militar</option>
          </select>
        </label>
        {personnelType === 'militar' && (
          <div className="registration-field-row">
            <label>
              Grado
              <select name="militaryRank" required defaultValue="">
                <option value="" disabled>
                  Seleccione un grado
                </option>
                {MILITARY_RANKS.map((rank) => (
                  <option key={rank.code} value={`${rank.name} (${rank.code})`}>
                    {rank.name} ({rank.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Situación
              <select name="serviceStatus" required defaultValue="">
                <option value="" disabled>
                  Seleccione una opción
                </option>
                {SERVICE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label>
          Unidad / Elemento
          <select name="unit" value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="">No corresponde / prefiero no indicar</option>
            {UNIT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.units.map((unitName) => (
                  <option key={unitName} value={unitName}>
                    {unitName}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={OTHER_UNIT_VALUE}>Otra (indicar)</option>
          </select>
        </label>
        {unit === OTHER_UNIT_VALUE && (
          <label>
            Indique su unidad u organización
            <input name="otherUnit" required maxLength={120} />
          </label>
        )}
        <section className="consent-panel">
          <h2>Versión del consentimiento {consentVersion}</h2>
          <p>{activeConsentText}</p>
          <label className="consent-checkbox">
            <input name="consent" type="checkbox" />
            <span>Afirmo mi consentimiento a esta versión activa.</span>
          </label>
        </section>
        <button disabled={state.status === 'loading' || visit.status !== 'ready'} className="registration-submit">
          {state.status === 'loading' ? 'Enviando…' : 'Enviar registro'}
        </button>
      </form>
      </Container>
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : undefined;
}

function StatusMessage({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return <div role="status" className={`registration-status ${tone}`}>{message}</div>;
}
