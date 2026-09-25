import type { PublicScheduleEntry } from '../public/publicRepository.js';
import type { RegistrationConfirmationEmail } from './emailProvider.js';

export function renderRegistrationConfirmation(recipient: string, schedule: PublicScheduleEntry[]): RegistrationConfirmationEmail {
  const scheduleSummary = schedule.length
    ? schedule.map((entry) => `- ${entry.title}: ${new Date(entry.startsAt).toLocaleString('es-AR')} (${entry.location ?? 'Ubicación por confirmar'})`).join('\n')
    : '- El cronograma publicado aún no contiene actividades.';
  return {
    to: recipient,
    subject: 'Confirmación de registro — Día del Arma de Comunicaciones',
    text: `Su registro fue aceptado.\n\nCronograma publicado al momento de esta confirmación:\n${scheduleSummary}`
  };
}
