# Source: product analytics

PostHog, Amplitude, a data warehouse, or whatever holds product events, feature flags, and experiments.

## What's here

What users actually did: feature usage events, client-reported errors, feature-flag and experiment exposure, usage and billing data, and the lineage of derived tables. Telemetry shows how the system behaved. Analytics shows how the product was used, and often where a number came from.

## How to search

**Check before you trust a name.** Event, table, and flag names differ between companies. List or describe them first.

**Bound every query in time**, usually about 30 days either side of the merge. Unbounded queries are slow and noisy.

Patterns that tend to pay off:

1. **Usage over time.** Daily counts of the relevant event around the merge. A jump from zero within a day or two suggests the PR launched the feature. A fall to zero suggests removal.
2. **Where a threshold came from.** The distribution (median, p99, max) of the relevant property in the two weeks before the PR. A p99 matching the code's constant suggests the number came from data.
3. **Flags and experiments.** Exposure by variant for the target's flag around the PR date, and any recorded decision.
4. **Expensive queries** behind a migration or rewrite, when query history is available.

## Strong evidence

- An error event dropping to near zero after a defensive PR shipped
- An experiment record naming the target's flag with a "shipped" decision near the merge

## Traps

- **Logged isn't caused.** An event existing shows someone cared, not that the code exists because of it. Pair it with a commit or PR.
- **New instrumentation looks like adoption.** A jump in volume may just mean logging started. Check for instrumentation PRs.
- **Property drift.** A property may not have existed when the code was written.
- **Retention and refresh lag.** Data before retention is a gap. Very recent data may not be in derived tables yet.
- **Unconfirmed tables.** Reporting from a table you never confirmed exists is a classic mistake.

## Return

Per finding: type (event, flag or experiment, usage, query history), the exact table or insight and the query, the time window, a short numeric summary (counts, percentiles, first and last seen; no raw rows), how its timing lines up with the target, and how strong the link is.
