# Design red flags

Check every sketch against these before merging. A red flag is a reason to revise the shape or reject it.

## Shallow module

A large interface that hides little. Measure depth by how much capability and policy sits behind the public surface compared to the surface's size. A small interface over a lot of behavior is the goal.

A deep module isn't a deep call chain. A long chain spreads understanding across layers; a deep module gathers it behind one interface.

Signs:

- Callers call several methods in sequence to do one thing.
- Public options expose internal stages or implementation choices.
- Learning the interface doesn't spare the caller from learning the implementation.

## Leaked knowledge

Several modules depend on the same internal decision: a representation, a policy, or a protocol detail shows up in more than one place, so changing it takes coordinated edits.

Re-exporting transport or wire types is a leak. Parse outside data into domain types behind the interface, and keep storage schemas, framework objects, and protocol details private.

## Split by time

Modules organized by when things run instead of what they know. Separate load, validate, transform, and save stages tend to repeat one representation and its rules at every boundary.

Group code by the knowledge it owns. Methods that run at different times still belong together when they protect the same decisions.

## Pass-through

A method that forwards the same arguments to another method of the same shape. It adds a layer and hides nothing.

Remove it, or move the work to the module that can finish it. Keep a forwarding layer only when it adds policy, translation, or a real abstraction.

## Split ownership

More than one module writes the same state, or keeps its own copy. An agent editing one writer can't see the others, so their rules drift apart.

Give each piece of state one owner. Everyone else reads it or asks the owner to change it.

## Two ways to do one thing

The design allows the same task to be done more than one way. Agents copy whichever they find first, so every way keeps gaining callers.

Keep one. Move the callers off the rest and delete them in the same change.

## Reachable internals

Callers can import a module's internals. An agent takes the shortest path that compiles, so the internals become part of the interface.

Make them unreachable from outside, so an outside import fails the build.

## Hand-kept lists

The same items are listed in two or more places, and adding one means editing every list. An agent that finds one list updates only that one.

Keep one list and derive the rest. If a list can't be derived, make the build fail when they disagree.
