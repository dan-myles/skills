// One JSON object per line on stderr. Callers pass ids, counts and status
// labels only; report bodies, message text and credentials are never logged.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger({ level = "info", write = (line) => process.stderr.write(`${line}\n`) } = {}) {
  const min = LEVELS[level] ?? LEVELS.info;
  const emit = (name) => (message, fields = {}) => {
    if (LEVELS[name] < min) return;
    write(JSON.stringify({ at: new Date().toISOString(), level: name, message, ...fields }));
  };
  return { debug: emit("debug"), info: emit("info"), warn: emit("warn"), error: emit("error") };
}
