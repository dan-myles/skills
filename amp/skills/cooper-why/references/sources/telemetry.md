# Source: telemetry

Datadog, Honeycomb, Grafana, an OpenTelemetry backend, or whatever holds metrics, traces, and logs.

## What's here

What actually happened in production, as opposed to what was planned: metrics, monitors and alerts, dashboards, traces and spans, logs, and incident records. A metric or monitor existing at all is evidence that someone thought the number mattered.

## How to search

1. **Find the owning service** and what it depends on.
2. **Dashboards and monitors first.** They show what the team watches. A monitor threshold often answers "why is this capped at N?"
3. **Metrics near the target.** Look for a spike shortly before the change merged and a steady line after it.
4. **Logs, narrowly.** Search by symbol, error string, or feature, within about 30 days either side of the change. Count matches rather than dumping them.
5. **Traces.** Use them for timeouts, retries, slow paths, and behavior across services.
6. **Incidents.** For defensive code, look for incidents shortly before it was added.

## Strong evidence

- A monitor whose threshold matches the limit the code enforces
- A dashboard built by the target's author that tracks what the code guards
- A spike before the merge and stability after
- An incident that names the target, its symbols, or its error strings
- Logs showing the failure the code prevents, dated before the change

## Traps

- **Timing isn't cause.** Other changes may have landed in the same window. Check neighboring PRs.
- **Charts reflect whoever built them.** A chart's name shows what someone cared about, not why a specific line exists.
- **Short retention.** Missing data from the period is a gap, not a "nothing happened".
- **Noise.** Narrow by service, tag, and time, and aggregate.
- **Measured isn't motivated.** Pair telemetry with a commit or PR date before claiming it caused the change.

## Return

Per item: type (dashboard, monitor, metric, log pattern, trace, incident), name, link or ID, owner and dates, the exact condition, query, or quote, and how strongly it connects to the target.
