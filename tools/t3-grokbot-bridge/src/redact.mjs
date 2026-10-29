// Text leaving the machine passes through here. Patterns cover credentials an
// agent is likely to echo; they reduce exposure but cannot prove a text is
// secret-free, which is why tool output and request answers are never sent.

const REPLACEMENTS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g, "[redacted private key]"],
  [/\b(authorization|proxy-authorization)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+(\s+[^\s,;]+)?)/gi, "$1: [redacted]"],
  [/\b(bearer|basic|dpop|token)\s+[A-Za-z0-9._~+/=-]{12,}/gi, "$1 [redacted]"],
  [/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, "$1[redacted]@"],
  [/([?&](?:access_token|token|key|api_key|apikey|secret|signature|sig|auth|password|wsTicket)=)[^&#\s]+/gi, "$1[redacted]"],
  [/\b([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY|ACCESS_KEY|AUTH|WEBHOOK)[A-Z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|\S+)/g, "$1=[redacted]"],
  [/\b(sk|pk|rk)-[A-Za-z0-9_-]{16,}/g, "[redacted key]"],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g, "[redacted github token]"],
  [/\b(xox[abprs]-[A-Za-z0-9-]{10,})/g, "[redacted slack token]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[redacted aws key]"],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "[redacted jwt]"],
  [/\b[A-Fa-f0-9]{40,}\b/g, "[redacted hex]"],
  [/[A-Za-z0-9+/_-]{48,}={0,2}/g, "[redacted token]"],
];

export function redact(text) {
  if (typeof text !== "string" || text === "") return text ?? "";
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
  return out;
}

export function excerpt(text, max) {
  const clean = redact(typeof text === "string" ? text : "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function oneLine(text, max) {
  return excerpt(String(text ?? "").replace(/\s+/g, " "), max);
}
