# Judge prompt

Fill the placeholders. Give the sketches neutral labels (X and Y) that don't reveal which model wrote them.

---

You're judging two design sketches for the same change. You're read-only. Don't edit anything.

## Task

{TASK}

Grounding: {GROUNDING_PATH}

## Sketches

- X: {SKETCH_X_PATH}
- Y: {SKETCH_Y_PATH}

Each folder holds a type sketch and a `rationale.md`. Read both end to end, plus the repo's agent instructions near the change.

## Rubric

{RUBRIC}

## Also check

{RED_FLAGS_PATH} lists design red flags. Note any either sketch has.

## Output

1. A table: one row per rubric criterion, a 1–5 score for X and for Y, and one line on why.
2. Red flags found, per sketch.
3. The base you'd build on, and why in two or three sentences. Pick the one a future maintainer could extend most easily without breaking its rules.
4. One or two things from the other sketch worth bringing into the base, if any.
