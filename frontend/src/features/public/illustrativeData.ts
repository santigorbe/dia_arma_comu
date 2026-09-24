export type IllustrativeScheduleItem = {
  time: string;
  title: string;
  location: string;
};

export type IllustrativeMapItem = {
  label: string;
  detail: string;
};

// This data is intentionally isolated from published API response types and routes.
export const illustrativeSchedule: IllustrativeScheduleItem[] = [
  { time: '09:00', title: 'Ventana de acreditación de ejemplo', location: 'Mesa de llegada ilustrativa' },
  { time: '10:30', title: 'Sesión informativa de ejemplo', location: 'Sala de informes ilustrativa' },
  { time: '14:00', title: 'Intercambio de cierre de ejemplo', location: 'Área de encuentro ilustrativa' }
];

export const illustrativeMapLocations: IllustrativeMapItem[] = [
  { label: 'Punto de llegada de ejemplo', detail: 'Referencia ilustrativa de orientación' },
  { label: 'Área de informes de ejemplo', detail: 'Referencia ilustrativa de interior' },
  { label: 'Mesa de asistencia de ejemplo', detail: 'Referencia ilustrativa de asistencia' }
];
