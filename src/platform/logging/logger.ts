type Level = 'info' | 'warn' | 'error';

function log(level: Level, tag: string, message: string, data?: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${tag}]`;
  // eslint-disable-next-line no-console
  const fn = level === 'info' ? console.log : console[level];
  if (data !== undefined) {
    fn(prefix, message, data);
  } else {
    fn(prefix, message);
  }
}

export const logger = {
  info:  (tag: string, msg: string, data?: unknown) => log('info',  tag, msg, data),
  warn:  (tag: string, msg: string, data?: unknown) => log('warn',  tag, msg, data),
  error: (tag: string, msg: string, data?: unknown) => log('error', tag, msg, data),
};
