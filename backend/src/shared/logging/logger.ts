const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = /password|secret|token|jwt|cookie|authorization|fullName|full_name|email|phone|messageBody|body/i;

export type LogRecord = Record<string, unknown>;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as LogRecord).map(([key, entry]) => [key, SENSITIVE_KEYS.test(key) ? REDACTED : redact(entry)])
    );
  }

  return value;
}

export function createLogger(write: (record: LogRecord) => void = console.info) {
  return {
    info(message: string, record: LogRecord = {}) {
      write({ level: 'info', message, ...redact(record) as LogRecord });
    },
    error(message: string, record: LogRecord = {}) {
      write({ level: 'error', message, ...redact(record) as LogRecord });
    }
  };
}
