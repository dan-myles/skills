# Prototype

The decision is yours, not the code. A prototype is a throwaway tool for making a design call cheaply. The real build goes through Feature.

Prototypes never ship. Nothing from `/tmp/bob-prototype-*` gets copied into the repo, a branch, or a PR. The real build starts fresh in Feature, using the prototype only as a reference for the decision.

This is the one playbook where speed beats polish. Code quality doesn't matter, tests don't either, and there's no plan to agree. The care goes into picking the right design for little cost: offer variations the user didn't ask for, and throw an approach away to try another.

1. Name the decision the prototype exists to make: which layout, which interaction, how dense, or for a behavior question, which timing or approach. No decision means no prototype; sort it as Feature instead.
2. Gather references when the direction is open. Look for prior art and sum it up as a few directions (layouts, palettes, interaction styles), then let the user pick before building. Skip this when the direction is already set.
3. Build it throwaway in `/tmp/bob-prototype-<slug>/`, outside the repo's source. For a visual call, plain HTML, CSS, and JS, or the lightest stack that shows the idea. For a behavior or timing call, the smallest script that answers it. No production framework, no tests, no abstractions.
4. Put alternatives behind one switcher (buttons or keys), each variant labeled, per `exhaust-the-design-space`. Variants differ in kind, not in shade.
5. Look at it the way the user would. For a visual call, screenshot each variant and drive the interaction. For a behavior call, watch the thing you're deciding: log the timing, print the output, watch it render. Here the observation is the test. When the harness can show HTML or a preview inline, show the variants there.
6. Present the variants, the tradeoffs, and your pick. **Checkpoint:** wait for the user to choose. The chosen direction goes to Feature for the real build, through `bob-architect` when it needs a shape.

**Reply:** the variants, the evidence (screenshots for a visual call, the observed output or timing for a behavior one), the tradeoffs, your pick, and the scratch path. Say plainly that the prototype is throwaway. **Show:** the variants behind their switcher, inline when the harness can.
