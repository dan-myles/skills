# Rationale template

The prose that goes with the type sketch. One page, sentence-case headings. Replace each note with real content.

## Problem

One paragraph: what we're trying to do, and what about the current system or its constraints makes the shape non-obvious. Name the constraints the design must honor (types it has to work with, callers it can't break, rules from the repo) so the reader sees what you saw.

## Usage

Write this before the type sketch. Show what a caller reads first and two or three real call sites: what they import, what they call, what comes back. The sketch is derived from this, and the two must agree. When they don't, fix the sketch.

## Shape

The design. Data structures first, then how data moves through the signatures. Name the decisions that carry the weight. Say which rules live in types, where validation happens, and what the system deliberately doesn't do. Judge interface depth: what the public surface hides, what it exposes, and why it's no bigger than it needs to be.

## Synthesis decision

Filled in at the merge. Which sketch became the base and why, what came from the other one, what was rejected and why, and the judge's verdict.

## Tradeoffs

One bullet each, as "we accept X in exchange for Y". Include anything a reader might mistake for an oversight, like something that looks premature or too simple.

## Alternatives

At least one other whole shape, with one line on why it lost. Judge it on interface depth, not just on being easier to build: what it would expose to callers and what it would hide. Two or three when there were real contenders. One is fine when the constraints forced the answer; then say "this was the only workable shape because...". Don't list flavors of the same shape.

## Open questions and risks

What the user needs to decide, and risks to know before building. Write them as questions so the user's answer settles them.

## First step

One sentence: the first thing to build once the sketch is approved.
