type LogLevel = 'info' | 'warn' | 'error';

function formatLog(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  if (data !== undefined) {
    const detail = data instanceof Error ? data.stack || data.message : JSON.stringify(data);
    return `${base} — ${detail}`;
  }
  return base;
}

export function log(context: string) {
  return {
    info: (message: string, data?: unknown) => console.log(formatLog('info', context, message, data)),
    warn: (message: string, data?: unknown) => console.warn(formatLog('warn', context, message, data)),
    error: (message: string, data?: unknown) => console.error(formatLog('error', context, message, data)),
  };
}
