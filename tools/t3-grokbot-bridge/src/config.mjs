import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export function expandHome(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return resolve(homedir(), path.slice(2));
  return resolve(path);
}

const SUBAGENT_MODES = new Set(["attention", "all", "off"]);

const DEFAULTS = {
  progress: { flushAfterMs: 30_000, maxFragments: 40 },
  detail: { maxThreads: 25, idleGraceMs: 20_000 },
  delivery: { timeoutMs: 15_000 },
  retentionDays: 14,
};

export function loadConfig(path) {
  const raw = JSON.parse(readFileSync(expandHome(path), "utf8"));
  return normalizeConfig(raw);
}

export function normalizeConfig(raw) {
  const fail = (message) => {
    throw new Error(`config: ${message}`);
  };
  const env = raw.environment ?? fail("environment is required");
  if (typeof env.key !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(env.key)) {
    fail("environment.key must be a lowercase slug");
  }
  if (typeof env.httpBaseUrl !== "string") fail("environment.httpBaseUrl is required");
  const httpBaseUrl = new URL(env.httpBaseUrl);
  if (httpBaseUrl.protocol !== "http:" && httpBaseUrl.protocol !== "https:") {
    fail("environment.httpBaseUrl must be http or https");
  }
  if (typeof env.tokenFile !== "string") fail("environment.tokenFile is required");

  const targets = new Map();
  for (const [name, target] of Object.entries(raw.targets ?? {})) {
    if (typeof target.envFile !== "string" || typeof target.urlVar !== "string" || typeof target.authVar !== "string") {
      fail(`targets.${name} needs envFile, urlVar and authVar`);
    }
    targets.set(name, { name, envFile: expandHome(target.envFile), urlVar: target.urlVar, authVar: target.authVar });
  }
  if (targets.size === 0) fail("at least one delivery target is required");

  const defaults = {
    target: raw.defaults?.target ?? [...targets.keys()][0],
    report: raw.defaults?.report ?? true,
    detail: raw.defaults?.detail ?? true,
    subagents: raw.defaults?.subagents ?? "attention",
    userMessageText: raw.defaults?.userMessageText ?? false,
  };
  const projects = (raw.projects ?? []).map((project, index) => {
    if (typeof project.key !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(project.key)) {
      fail(`projects[${index}].key must be a lowercase slug`);
    }
    if (!project.projectId && !project.workspaceRoot && !project.title) {
      fail(`projects[${index}] needs projectId, workspaceRoot or title to match`);
    }
    return {
      key: project.key,
      projectId: project.projectId ?? null,
      workspaceRoot: project.workspaceRoot ? stripSlash(expandHome(project.workspaceRoot)) : null,
      title: project.title ?? null,
      target: project.target ?? defaults.target,
      report: project.report ?? defaults.report,
      detail: project.detail ?? defaults.detail,
      subagents: project.subagents ?? defaults.subagents,
      userMessageText: project.userMessageText ?? defaults.userMessageText,
    };
  });
  for (const route of [defaults, ...projects]) {
    if (!targets.has(route.target)) fail(`unknown target ${route.target}`);
    if (!SUBAGENT_MODES.has(route.subagents)) fail(`subagents must be one of ${[...SUBAGENT_MODES].join(", ")}`);
  }
  const unmatchedProjects = raw.unmatchedProjects ?? "report";
  if (unmatchedProjects !== "report" && unmatchedProjects !== "ignore") {
    fail("unmatchedProjects must be report or ignore");
  }

  return {
    environment: {
      key: env.key,
      label: env.label ?? null,
      httpBaseUrl: stripSlash(httpBaseUrl.toString()),
      tokenFile: expandHome(env.tokenFile),
    },
    stateDir: expandHome(raw.stateDir ?? `~/.crabstock-dispatch/bridge/${env.key}`),
    targets,
    defaults,
    projects,
    unmatchedProjects,
    ignoreThreadIds: new Set(raw.ignoreThreadIds ?? []),
    ignoreProjectIds: new Set(raw.ignoreProjectIds ?? []),
    progress: { ...DEFAULTS.progress, ...raw.progress },
    detail: { ...DEFAULTS.detail, ...raw.detail },
    delivery: { ...DEFAULTS.delivery, ...raw.delivery },
    retentionDays: raw.retentionDays ?? DEFAULTS.retentionDays,
  };
}

function stripSlash(value) {
  return value.length > 1 ? value.replace(/\/+$/, "") : value;
}

function slug(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** The route for a project, or null when the project is not reported. */
export function resolveRoute(config, project) {
  if (config.ignoreProjectIds.has(project.id)) return null;
  const root = project.workspaceRoot ? stripSlash(project.workspaceRoot) : null;
  const title = String(project.title ?? "").toLowerCase();
  const route =
    config.projects.find((p) => p.projectId === project.id) ??
    config.projects.find((p) => p.projectId === null && p.workspaceRoot !== null && p.workspaceRoot === root) ??
    config.projects.find((p) => p.projectId === null && p.workspaceRoot === null && p.title?.toLowerCase() === title);
  if (route) return route.report ? route : null;
  if (config.unmatchedProjects === "ignore" || !config.defaults.report) return null;
  return { ...config.defaults, key: slug(project.title) || project.id, projectId: project.id };
}
