import { FormEvent, useState } from 'react';
import { apiRequest, type ApiError } from '../../lib/apiClient';
import { useVisit } from '../visits/VisitProvider';

const activeConsentVersion = import.meta.env.VITE_ACTIVE_CONSENT_VERSION ?? 'consent-local-placeholder';
const activeConsentText = import.meta.env.VITE_CONSENT_TEXT ?? 'Texto local de consentimiento no definitivo. Los operadores deben proporcionar la redacción aprobada del consentimiento antes de su uso en producción.';

type RegistrationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; participantId: string }
  | { status: 'error' | 'conflict' | 'stale_consent'; message: string; activeConsentVersion?: string };

export function RegisterPage({ embedded = false }: { embedded?: boolean }) {
  const visit = useVisit();
  const [state, setState] = useState<RegistrationState>({ status: 'idle' });
  const [consentVersion, setConsentVersion] = useState(activeConsentVersion);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visit.visitId) {
      setState({ status: 'error', message: 'La visita anónima debe inicializarse antes del registro.' });
      return;
    }

    const form = new FormData(event.currentTarget);
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
          unitOrOrganization: optionalString(form.get('unitOrOrganization')),
          consent: { accepted: true, version: consentVersion }
        })
      });
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
          Unidad u organización
          <input name="unitOrOrganization" maxLength={120} />
        </label>
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
