import { FormEvent, useState } from 'react';
import { apiRequest, type ApiError } from '../../lib/apiClient';
import { useVisit } from '../visits/VisitProvider';

const activeConsentVersion = import.meta.env.VITE_ACTIVE_CONSENT_VERSION ?? 'consent-local-placeholder';

type RegistrationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; participantId: string }
  | { status: 'error' | 'conflict' | 'stale_consent'; message: string; activeConsentVersion?: string };

type RegistrationControlName = 'fullName' | 'email' | 'consent';
type FieldErrors = Partial<Record<RegistrationControlName, string>>;

const CONTROL_ORDER: RegistrationControlName[] = ['fullName', 'email', 'consent'];
const VALIDATION_MESSAGES: Record<string, Record<string, string>> = {
  fullName: messages(['invalid_type', 'too_small', 'too_big'], 'Ingrese un nombre completo válido.'),
  email: messages(['invalid_type', 'invalid_string', 'too_big'], 'Ingrese un correo electrónico válido.'),
  'consent.accepted': messages(['invalid_type', 'invalid_literal'], 'Confirme el consentimiento para continuar.'),
  'consent.version': messages(['invalid_type', 'too_small', 'too_big'], 'Revise la versión activa del consentimiento.')
};

export function RegisterPage({ embedded = false, onSuccessfulRegistration }: { embedded?: boolean; onSuccessfulRegistration?: () => void }) {
  const visit = useVisit();
  const [state, setState] = useState<RegistrationState>({ status: 'idle' });
  const [consentVersion, setConsentVersion] = useState(activeConsentVersion);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

    setFieldErrors({});
    setState({ status: 'loading' });
    try {
      const response = await apiRequest<{ participantId: string }>('/api/public/registrations', {
        method: 'POST',
        body: JSON.stringify({
          requestIdempotencyKey: crypto.randomUUID(),
          visitId: visit.visitId,
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? ''),
          consent: { accepted: true, version: consentVersion }
        })
      });
      if (onSuccessfulRegistration) {
        formElement.reset();
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
      const body = apiError.body as { error?: string; details?: unknown } | undefined;
      if (body?.error === 'stale_consent_version') {
        const nextVersion = activeConsentVersionFromDetails(body.details) ?? consentVersion;
        setConsentVersion(nextVersion);
        setState({ status: 'stale_consent', message: 'El consentimiento cambió. Revise la versión activa y vuelva a enviar el formulario.', activeConsentVersion: nextVersion });
        return;
      }
      if (body?.error === 'participant_conflict') {
        setState({ status: 'conflict', message: 'Ya existe un registro para esta identidad del evento con datos diferentes.' });
        return;
      }
      if (body?.error === 'validation_failed') {
        const nextFieldErrors = mapValidationDetails(body.details, formElement);
        const firstInvalidControl = CONTROL_ORDER.find((name) => nextFieldErrors[name]);
        if (firstInvalidControl) {
          setFieldErrors(nextFieldErrors);
          setState({ status: 'error', message: 'Revise los campos indicados a continuación.' });
          const control = formElement.elements.namedItem(firstInvalidControl);
          if (control instanceof HTMLElement) control.focus();
        } else {
          setState({ status: 'error', message: 'No se pudieron validar los datos del registro. Revise la información e inténtelo de nuevo.' });
        }
        return;
      }
      setState({ status: 'error', message: 'El registro no pudo completarse. Inténtelo de nuevo.' });
    }
  }

  function invalidProps(name: RegistrationControlName) {
    return fieldErrors[name]
      ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` }
      : {};
  }

  const Container = 'section';
  return (
    <Container className={`public-register ${embedded ? 'public-register-embedded' : ''}`}>
      <div className="register-heading"><p className="eyebrow">Registro</p><h1 id={embedded ? 'registration-title' : undefined}>Registre su participación en el evento</h1></div>
      {/* <p className="registration-notice">Al completar este formulario, usted acepta recibir un correo con el diploma de participación al finalizar el evento</p> */}
      <form className="registration-form" onSubmit={submit} noValidate>
        <label>
          Nombre completo
          <input name="fullName" required minLength={2} maxLength={120} {...invalidProps('fullName')} />
          <FieldError name="fullName" errors={fieldErrors} />
        </label>
        <label>
          Correo electrónico
          <input name="email" type="email" required {...invalidProps('email')} />
          <FieldError name="email" errors={fieldErrors} />
        </label>
        <section className="consent-panel">
          <h2>Consentimiento</h2>
          <p>Usted acepta recibir un correo con el diploma de participación al finalizar el evento via correo electronico. Sus datos serán utilizados exclusivamente para este propósito.</p>
          <label className="consent-checkbox">
            <input name="consent" type="checkbox" {...invalidProps('consent')} />
            <span>Afirmo mi consentimiento.</span>
          </label>
          <FieldError name="consent" errors={fieldErrors} />
        </section>
      
        {visit.status === 'error' && <StatusMessage tone="error" message={visit.error ?? 'No se pudo inicializar la visita.'} />}
        {state.status !== 'idle' && state.status !== 'loading' && <StatusMessage tone={state.status === 'success' ? 'success' : 'error'} message={state.status === 'success' ? 'El registro se aceptó con el consentimiento validado por el sistema.' : state.message} />}
      
        <button disabled={state.status === 'loading' || visit.status !== 'ready'} className="registration-submit">
          {state.status === 'loading' ? 'Enviando…' : 'Enviar registro'}
        </button>
      </form>
      </Container>
  );
}

function activeConsentVersionFromDetails(details: unknown) {
  if (!details || typeof details !== 'object') return undefined;
  const { activeConsentVersion } = details as { activeConsentVersion?: unknown };
  return typeof activeConsentVersion === 'string' ? activeConsentVersion : undefined;
}

function messages(codes: string[], message: string) {
  return Object.fromEntries(codes.map((code) => [code, message]));
}

function mapValidationDetails(details: unknown, form: HTMLFormElement): FieldErrors {
  if (!Array.isArray(details)) return {};
  const errors: FieldErrors = {};
  for (const detail of details) {
    if (!detail || typeof detail !== 'object') continue;
    const { field, code } = detail as { field?: unknown; code?: unknown };
    if (typeof field !== 'string' || typeof code !== 'string') continue;
    const message = VALIDATION_MESSAGES[field]?.[code];
    const controlName = validationControlName(field, form);
    if (message && controlName && !errors[controlName]) errors[controlName] = message;
  }
  return errors;
}

function validationControlName(field: string, form: HTMLFormElement): RegistrationControlName | undefined {
  if (field === 'consent.accepted' || field === 'consent.version') return 'consent';
  const name = field as RegistrationControlName;
  return CONTROL_ORDER.includes(name) && form.elements.namedItem(name) ? name : undefined;
}

function FieldError({ name, errors }: { name: RegistrationControlName; errors: FieldErrors }) {
  return errors[name] ? <span id={`${name}-error`} className="registration-field-error">{errors[name]}</span> : null;
}

function StatusMessage({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return <div role="status" className={`registration-status ${tone}`}>{message}</div>;
}
