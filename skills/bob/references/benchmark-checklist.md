# Benchmark checklist

Run this on every performance number before you report it or act on it: a PR's before and after, a regression claim, a Climb harness, a choice between libraries or settings. `../bob-principle-explain-the-number/SKILL.md` says why. Answer each question from a run, not from reading code.

For a quick ballpark the user asked for, one run is enough. Still answer questions 4 and 7, and say it was one run. A choice between options is never a ballpark.

## Before running anything

- Write the claim you expect to make, in the words you'd ship: "export is 30% faster at p50 on the 60k-row dataset". The questions test that sentence.
- Read the measurement script: what it times, what it counts, what it ignores.
- Check machine load (`uptime`) and cores (`nproc`, or `sysctl -n hw.ncpu` on macOS). If something else is busy and you can't stop it, alternate the sides so both see the same noise, and say so.

## The questions

1. **Why isn't it twice as good?** Name the limiter. Profile in a run you don't report, since profilers slow things down: CPU per process, the runtime's profiler (`node --cpu-prof`, `py-spy`, `perf`, Instruments), I/O wait, syscall counts. Map the hot spot to source. Watch the load generator too; if it saturates first, you measured it. When a change didn't move the number, the limiter explains why.
2. **Was each side tuned?** Run every side the way production does: release builds, production flags and env, batching, pools, caches as warm or cold as production sees them, same versions and data. A side on defaults means you compared configurations. A limiter that's a setting (a commit per row, a debug build, a missing index) means that side is untuned; tune it and rerun before picking a winner.
3. **Did it break a limit?** Do the arithmetic. Bytes per second against disk and network bandwidth; operations per second times cost per operation against your cores. Time saved against the time the changed piece took: removing 10% of a run makes it at most about 11% faster. A result past a limit measured something else, like a cache, a no-op, or a bug.
4. **Did anything fail?** Count errors and non-success responses, and check outputs are correct, not just present. Rejections are fast and retries are slow, so both skew the number. If the script doesn't count errors, add the count.
5. **Does it repeat?** At least five runs per side, alternated (A, B, A, B) so warmup and drift don't favor one side. Report the median and the range. A gap smaller than the run-to-run spread is no measurable difference. When it's close, use a rank-sum test or the harness's own statistics.
6. **Does it matter?** Next to any micro result, measure the end-to-end path a user waits on, with realistic sizes and concurrency, and report the micro result as a share of it. A helper that takes 1% of a request can save at most 1%.
7. **Did the work happen?** Confirm the work ran inside the timed region: the request reached the server, the rows got written, the result got used. Lazy code (an unread generator, an unawaited promise, a result the compiler drops) and timeouts all produce numbers for work that never ran.

## Report

- Lead with the verdict: faster, slower, no measurable difference, or inconclusive.
- Give the number with its unit, the run count, the range, and the limiter: "p50 41 ms → 33 ms, median of 7 runs per side, range 32–35 ms after, bound by JSON parsing on one core."
- Call it inconclusive when you can't name the limiter, a side ran untuned, or you couldn't answer 4 and 7. Name the gap.
- The PR body gets one headline number. Runs, range, and limiter evidence go in the details or a linked artifact.
