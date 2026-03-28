type LogLevel = "info" | "warn" | "error" | "debug";

const format = (level: LogLevel, msg: string, meta?: unknown) => {
  const base = `[GridWatch:${level}] ${msg}`;
  if (!meta) return base;
  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return base;
  }
};

export const logger = {
  info: (msg: string, meta?: unknown) => console.log(format("info", msg, meta)),
  warn: (msg: string, meta?: unknown) => console.warn(format("warn", msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(format("error", msg, meta)),
  debug: (msg: string, meta?: unknown) => console.debug(format("debug", msg, meta))
};

