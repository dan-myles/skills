// Shapes follow T3 v0.1.5-nightly.20261029.3877 (orchestration protocol 2),
// trimmed to the fields the bridge reads.

export const ENV_ID = "env-1";
export const PROJECT = { id: "mcp:proj-crab", title: "gs/crabstock", workspaceRoot: "/repos/crabstock" };
export const OTHER_PROJECT = { id: "proj-other", title: "Side Project", workspaceRoot: "/repos/side" };

export function shellThread(overrides = {}) {
  return {
    id: "thread-1",
    projectId: PROJECT.id,
    title: "Fix ledger rounding",
    createdBy: "agent",
    creationSource: "mcp",
    lineage: { parentThreadId: null, relationshipToParent: null, rootThreadId: "thread-1" },
    status: "idle",
    activityRunStatus: null,
    activeRunId: null,
    latestRunId: null,
    latestRunRequestedAt: null,
    latestRunStartedAt: null,
    latestRunCompletedAt: null,
    blockedOnThreadWait: false,
    lastError: null,
    lastErrorClass: null,
    lastErrorCode: null,
    usageLimitResetAt: null,
    pendingRuntimeRequest: null,
    latestVisibleMessage: null,
    hasActionableProposedPlan: false,
    pendingBackgroundTasks: [],
    pullRequests: [],
    settledOverride: null,
    settledAt: null,
    unsettledAt: null,
    archivedAt: null,
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

export const running = (overrides = {}) =>
  shellThread({
    status: "running",
    activityRunStatus: "running",
    activeRunId: "run-1",
    latestRunId: "run-1",
    latestRunRequestedAt: "2026-10-29T10:01:00.000Z",
    latestRunStartedAt: "2026-10-29T10:01:01.000Z",
    updatedAt: "2026-10-29T10:01:01.000Z",
    ...overrides,
  });

export const completed = (overrides = {}) =>
  running({
    status: "completed",
    activityRunStatus: null,
    activeRunId: null,
    latestRunCompletedAt: "2026-10-29T10:05:00.000Z",
    updatedAt: "2026-10-29T10:05:00.000Z",
    latestVisibleMessage: { id: "msg-final", role: "assistant", text: "Done. PR #94 is green.", updatedAt: "2026-10-29T10:05:00.000Z" },
    ...overrides,
  });

export function turnItem(overrides = {}) {
  return {
    id: "item-1",
    threadId: "thread-1",
    runId: "run-1",
    nodeId: "node-1",
    providerThreadId: null,
    providerTurnId: null,
    nativeItemRef: null,
    parentItemId: null,
    ordinal: 1,
    status: "completed",
    title: null,
    startedAt: "2026-10-29T10:02:00.000Z",
    completedAt: "2026-10-29T10:02:05.000Z",
    updatedAt: "2026-10-29T10:02:05.000Z",
    ...overrides,
  };
}

export function itemEvent(sequence, item) {
  return {
    kind: "event",
    sequence,
    event: { id: `evt-${sequence}`, threadId: item.threadId, runId: item.runId, occurredAt: item.updatedAt, type: "turn-item.updated", payload: item },
  };
}

export function shellSnapshot(sequence, threads, projects = [PROJECT, OTHER_PROJECT]) {
  return { kind: "snapshot", snapshot: { schemaVersion: 1, snapshotSequence: sequence, projects, threads, archivedThreads: [] } };
}

export function threadSnapshot(sequence, turnItems = [], runs = [{ id: "run-1", ordinal: 1 }]) {
  return { kind: "snapshot", snapshotSequence: sequence, projection: { runs, turnItems } };
}

export function testConfig(overrides = {}) {
  return {
    environment: { key: "studio", httpBaseUrl: "http://t3.test", tokenFile: "/dev/null" },
    stateDir: "/tmp/unused",
    targets: { grokbot: { envFile: "/tmp/unused/report.env", urlVar: "CRABSTOCK_DISPATCH_WEBHOOK", authVar: "CRABSTOCK_DISPATCH_AUTH" } },
    projects: [{ key: "crabstock", projectId: PROJECT.id }],
    progress: { flushAfterMs: 30_000, maxFragments: 3 },
    ...overrides,
  };
}
