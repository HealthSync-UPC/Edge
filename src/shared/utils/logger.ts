import chalk from 'chalk';

type Level = 'info' | 'warn' | 'error';

function colorFor(level: Level) {
  switch (level) {
    case 'info': return chalk.blue('[INFO]');
    case 'warn': return chalk.yellow('[WARN]');
    case 'error': return chalk.red('[ERROR]');
  }
}

function timeString() {
  return new Date().toTimeString().split(' ')[0];
}

function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function log(level: Level, message: string, meta?: Record<string, any>) {
  const prefix = `${colorFor(level)} ${timeString()}`;
  const payload: any = { message };

  if (meta) {
    const filtered = { ...meta };
    if (filtered.token) delete filtered.token;
    if (filtered.CLOUD_TOKEN) delete filtered.CLOUD_TOKEN;
    payload.meta = filtered;
  }

  console.log(prefix, safeStringify(payload));
}

export const logger = {
  info: (msg: string, meta?: Record<string, any>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, any>) => log('error', msg, meta),
};
