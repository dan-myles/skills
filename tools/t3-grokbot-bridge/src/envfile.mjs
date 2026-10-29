import { chmodSync, openSync, writeSync, closeSync, readFileSync, renameSync, statSync } from "node:fs";

// report.env is also sourced by the legacy bash `report` script, so it stays a
// shell file. Only literal assignments are accepted; anything that would need
// a shell to evaluate is rejected instead of guessed.

export function parseEnvFile(text) {
  const values = new Map();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) throw new Error("unsupported line in env file");
    values.set(match[1], parseShellWord(match[2]));
  }
  return values;
}

function parseShellWord(input) {
  let out = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "'") {
      const end = input.indexOf("'", i + 1);
      if (end < 0) throw new Error("unterminated quote in env file");
      out += input.slice(i + 1, end);
      i = end + 1;
    } else if (ch === '"') {
      i += 1;
      while (i < input.length && input[i] !== '"') {
        if (input[i] === "$" || input[i] === "`") throw new Error("expansion in env file");
        if (input[i] === "\\" && i + 1 < input.length && '"\\$`'.includes(input[i + 1])) i += 1;
        out += input[i];
        i += 1;
      }
      if (input[i] !== '"') throw new Error("unterminated quote in env file");
      i += 1;
    } else if (ch === "\\" && i + 1 < input.length) {
      out += input[i + 1];
      i += 2;
    } else if (/\s/.test(ch)) {
      if (input.slice(i).trim().startsWith("#") || input.slice(i).trim() === "") break;
      throw new Error("unquoted whitespace in env file");
    } else if ("$`;&|<>(){}".includes(ch)) {
      throw new Error("shell syntax in env file");
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

export function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export function readEnvFile(path) {
  return parseEnvFile(readFileSync(path, "utf8"));
}

/** Writes a mode-600 env file atomically. Values are never logged. */
export function writeEnvFile(path, entries) {
  const lines = [];
  for (const [key, value] of entries) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error("invalid variable name");
    if (typeof value !== "string" || value === "" || /[\r\n\0]/.test(value)) {
      throw new Error(`value for ${key} is empty or contains a line break`);
    }
    lines.push(`${key}=${shellQuote(value)}`);
  }
  const temp = `${path}.tmp-${process.pid}`;
  const fd = openSync(temp, "wx", 0o600);
  try {
    writeSync(fd, `${lines.join("\n")}\n`);
  } finally {
    closeSync(fd);
  }
  chmodSync(temp, 0o600);
  renameSync(temp, path);
}

export function fileMode(path) {
  return statSync(path).mode & 0o777;
}
