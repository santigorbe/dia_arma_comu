import { FormEvent, useState } from 'react';
import { apiRequest, type ApiError } from '../../lib/apiClient';
import { useVisit } from '../visits/VisitProvider';

type RegistrationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; participantId: string }
  | { status: 'error' | 'conflict'; message: string };

type RegistrationControlName = 'fullName' | 'email';
type FieldErrors = Partial<Record<RegistrationControlName, string>>;

const CONTROL_ORDER: RegistrationControlName[] = ['fullName', 'email'];
const VALIDATION_MESSAGES: Record<string, Record<string, string>> = {
  fullName: messages(['invalid_type', 'too_small', 'too_big'], 'Ingrese un nombre completo válido.'),
  email: messages(['invalid_type', 'invalid_string', 'too_big'], 'Ingrese un correo electrónico válido.')
};

export function RegisterPage({ embedded = false, onSuccessfulRegistration }: { embedded?: boolean; onSuccessfulRegistration?: () => void }) {
  const visit = useVisit();
  const [state, setState] = useState<RegistrationState>({ status: 'idle' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!visit.visitId) {
      setState({ status: 'error', message: 'La visita anónima debe inicializarse antes del registro.' });
      return;
    }

    const form = new FormData(formElement);
    setFieldErrors({});
    setState({ status: 'loading' });
    try {
      const response = await apiRequest<{ participantId: string }>('/api/public/registrations', {
        method: 'POST',
        body: JSON.stringify({
          requestIdempotencyKey: crypto.randomUUID(),
          visitId: visit.visitId,
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? '')
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
        {visit.status === 'error' && <StatusMessage tone="error" message={visit.error ?? 'No se pudo inicializar la visita.'} />}
        {state.status !== 'idle' && state.status !== 'loading' && <StatusMessage tone={state.status === 'success' ? 'success' : 'error'} message={state.status === 'success' ? 'El registro se aceptó.' : state.message} />}
      
        <button disabled={state.status === 'loading' || visit.status !== 'ready'} className="registration-submit">
          {state.status === 'loading' ? 'Enviando…' : 'Registrarme'}
        </button>
      </form>
      </Container>
  );
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
  const name = field as RegistrationControlName;
  return CONTROL_ORDER.includes(name) && form.elements.namedItem(name) ? name : undefined;
}

function FieldError({ name, errors }: { name: RegistrationControlName; errors: FieldErrors }) {
  return errors[name] ? <span id={`${name}-error`} className="registration-field-error">{errors[name]}</span> : null;
}

function StatusMessage({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return <div role="status" className={`registration-status ${tone}`}>{message}</div>;
}
