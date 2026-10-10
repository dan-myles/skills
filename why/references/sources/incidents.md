# Angle: incidents

This isn't a separate source. It's an extra lens for every investigator when the target looks defensive: null checks, retries, timeouts, rate limits, feature flags, resource guards. Code like that is often added after something broke.

In your own source, look for:

- **Git and PRs:** messages like "fix for incident", "add guard", or a revert followed by "re-apply with…"
- **Tickets:** labels such as `incident`, `sev-*`, `postmortem`, `reliability`, and postmortem action items
- **Docs:** postmortems naming the file, feature, or error string
- **Chat:** incident channels around the dates the code was added
- **Telemetry:** formal incident records, and dashboards or monitors created as follow-ups
- **Error tracking:** issues whose first-seen to last-seen window brackets the PR, with traces through the target
- **Product analytics:** user-facing error events that spike during the incident and drop after the fix

When you find an incident, read the full postmortem. Its action items usually map straight to code changes. Evidence is strongest when the same incident shows up across several sources: an incident ID in a ticket, in a postmortem, in a chat thread linking the PR, with error counts dropping afterwards.

Skip this angle for code that doesn't look defensive.
