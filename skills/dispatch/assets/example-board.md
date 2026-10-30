# Example project board
Updated: 2026-10-30 12:00 UTC
Fictional fixture, not live project status. Runtime fields illustrate the data contract.

## Now
### DEMO-1: Make the save action clear
- Summary: A specific button label tells readers what their next action saves.
- Visual: Ambiguous action | Explicit save label | Clear next step
- State: execution: working; acceptance pending
- Worker: [Example worker](t3-thread://v2/example-environment/example-worker)
- Runtime: running
- Verified: 2026-10-30 12:00 UTC
- Run: example-run, running
- Pending input: 0
- Gate: Confirm the proposed wording with the owner before release.
- PR: [Example PR](https://example.com/pull/1)
- Illustration: {"type":"buttons","before":"Continue","after":"Save changes"}

## Backlog
### DEMO-2: Explain what happens next
- Summary: The proposed confirmation screen explains the next step before the user continues.
- Visual: Missing context | Proposed explanation | Review before implementation
- State: awaiting decision
- Gate: Owner has not approved implementation.
- Illustration: {"type":"screens","screens":[{"title":"Before","body":"What happens next?"},{"title":"Proposed","body":"Review the details, then continue.","button":"Continue"}]}

## What landed
### DEMO-3: Record an accepted interaction finding
- Summary: The accepted finding describes a possible gesture without claiming it has shipped.
- Visual: Current tab | Proposed swipe | Adjacent tab
- State: finding accepted, no deployment claimed
- Evidence: [Accepted finding](https://example.com/findings/gesture)
- Verified: 2026-10-30 12:00 UTC
- Illustration: {"type":"gesture","from":"Current tab","gesture":"Swipe left","to":"Next tab","note":"Schematic of proposed behavior"}

## Watch and links
### DEMO-4: Coordinate an external dependency
- Summary: Another project owns the dependency and reports its progress separately.
- Visual: External owner | Dependency report | Local decision
- State: external coordination
- Coordination: external
- Source: [Example dependency](https://example.com/dependency)
