import { FormEvent, useState } from 'react';
import { apiRequest, type ApiError } from '../../lib/apiClient';
import { useVisit } from '../visits/VisitProvider';

const activeConsentVersion = import.meta.env.VITE_ACTIVE_CONSENT_VERSION ?? 'consent-local-placeholder';
const activeConsentText = import.meta.env.VITE_CONSENT_TEXT ?? 'Non-final local consent text. Operators must provide approved consent wording before production use.';

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
      setState({ status: 'error', message: 'The anonymous visit must initialize before registration.' });
      return;
    }

    const form = new FormData(event.currentTarget);
    const accepted = form.get('consent') === 'on';
    if (!accepted) {
      setState({ status: 'error', message: 'Consent is required before registration.' });
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
        setState({ status: 'error', message: 'Registration needs an internet connection and was not queued. Please reconnect and submit again.' });
        return;
      }
      const apiError = error as ApiError;
      const body = apiError.body as { error?: string; details?: unknown; activeConsentVersion?: string } | undefined;
      if (body?.error === 'stale_consent_version') {
        const nextVersion = body.activeConsentVersion ?? consentVersion;
        setConsentVersion(nextVersion);
        setState({ status: 'stale_consent', message: 'Consent changed. Review the active version and submit again.', activeConsentVersion: nextVersion });
        return;
      }
      if (body?.error === 'participant_conflict') {
        setState({ status: 'conflict', message: 'A registration already exists for this event identity with different data.' });
        return;
      }
      setState({ status: 'error', message: body?.error === 'validation_failed' ? 'Review the highlighted registration fields.' : 'Registration failed safely. Please try again.' });
    }
  }

  const Container = 'section';
  return (
    <Container className={`public-register ${embedded ? 'public-register-embedded' : ''}`}>
      <div className="register-heading"><p className="eyebrow">Public registration</p><h1 id={embedded ? 'registration-title' : undefined}>Register for event participation</h1></div>
      <p className="registration-notice">This local copy is non-final. Institutional content and approved consent wording are operator-supplied.</p>
      {visit.status === 'error' && <StatusMessage tone="error" message={visit.error ?? 'Visit initialization failed.'} />}
      {state.status !== 'idle' && state.status !== 'loading' && <StatusMessage tone={state.status === 'success' ? 'success' : 'error'} message={state.status === 'success' ? 'Registration was accepted with backend-enforced consent.' : state.message} />}
      <form className="registration-form" onSubmit={submit} noValidate>
        <label>
          Full name
          <input name="fullName" required minLength={2} maxLength={120} />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Phone
          <input name="phone" maxLength={40} />
        </label>
        <label>
          Unit or organization
          <input name="unitOrOrganization" maxLength={120} />
        </label>
        <section className="consent-panel">
          <h2>Consent version {consentVersion}</h2>
          <p>{activeConsentText}</p>
          <label className="consent-checkbox">
            <input name="consent" type="checkbox" />
            <span>I affirmatively consent to this active version.</span>
          </label>
        </section>
        <button disabled={state.status === 'loading' || visit.status !== 'ready'} className="registration-submit">
          {state.status === 'loading' ? 'Submitting...' : 'Submit registration'}
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
