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
  { time: '09:00', title: 'Example check-in window', location: 'Illustrative arrival desk' },
  { time: '10:30', title: 'Example briefing session', location: 'Illustrative briefing room' },
  { time: '14:00', title: 'Example closing exchange', location: 'Illustrative gathering area' }
];

export const illustrativeMapLocations: IllustrativeMapItem[] = [
  { label: 'Example arrival point', detail: 'Illustrative wayfinding reference' },
  { label: 'Example briefing area', detail: 'Illustrative indoor reference' },
  { label: 'Example support desk', detail: 'Illustrative assistance reference' }
];
