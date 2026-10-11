---
name: bob-adversarial-review
disable-model-invocation: true
description: "Adversarial review of a change by reviewers on different models, Claude and GPT by default (set in bob-models). All get the same intent, diff, and rubric; Bob merges their findings and sorts each into Act on, Consider, Noted, or Dismissed. Never applies fixes. Use for risky diffs, a contested design, or 'tear this apart'. Manual-only: `/bob-adversarial-review [diff or files]` in Claude Code, `$bob-adversarial-review ...` in Codex. `bob` runs it from its Review step."
---

# Adversarial review

Reviewers on different models get the same prompt. The pressure comes from the models being different, not from giving them personas. What two or more raise is the strongest signal.

The output is a verdict. Don't change any code here. When `bob` called this from its Review step, Bob acts on the verdict there.

## 1. Pick the scope

- The files or diff the user points at, if any.
- On a branch: `git diff <base>...HEAD`, where `<base>` is the branch the PR targets.
- A design sketch before code works too. Its files stand in for the diff.

Write the diff to a file. Reviewers get its path, plus the paths of anything they need to read around it.

## 2. State the intent

Write one paragraph: what the change is for and what it must do. When Bob approved a design earlier in the session, take the intent from it. Otherwise build it from the user's words, commit messages, the PR body, and the code. If you can't state it with confidence, ask before going on.

Reviewers judge the code against this paragraph. They don't question it.

## 3. Run the reviewers

Fill `references/reviewer-prompt.md` with:

1. the intent
2. the diff path and context paths
3. `references/rubric.md`
4. `references/code-quality.md`

Start one reviewer per entry of `bob-adversarial-review.reviewers` in `../bob-models/models.yaml`, labeled A, B, C in order, per `../bob-models/references/delegation.md`. All get the same filled prompt and stay read-only.

Use absolute paths in the prompt, since reviewers start with none of this session. Start them all at once. If one fails, finish with the rest and say so in **Reviewers**.

## 4. Merge

1. Collect every finding from every reviewer.
2. Merge findings that describe the same problem in different words. Note who raised each one.
3. Mark findings two or more reviewers raised on their own. These carry the most weight.
4. Mark findings only one raised. Read them, but weigh them lower.
5. Note where one reviewer says the opposite of another.

## 5. Judge

You're the lead reviewer: a practical senior engineer who has the full session, not a neutral counter of votes. Apply `references/lead-judgment.md`, then put each finding in one bucket:

- **Act on.** A real problem with correctness, security, data, or maintainability, given what the change is for. It would block a real PR.
- **Consider.** A fair point, but it may not be worth its cost right now. The user should see it.
- **Noted.** True, but not worth acting on at this stage.
- **Dismissed.** Wrong, a nitpick, or missing context. Say why in one line.

Each finding names who raised it, its bucket, and a one-line reason for the bucket.

## Output

### Intent
> the paragraph from step 2

### Reviewers
- One line per reviewer: label, model, number of findings. Note any substitute model, and when every reviewer ran on one provider.

### Act on
Each finding: what's wrong, who raised it, why it matters.

### Consider
Each finding: what's wrong, who raised it, the tradeoff.

### Noted
A short list.

### Dismissed
Each finding with the reason.

### Agreement
Where the reviewers agreed and where they split, and what that says about the change.
