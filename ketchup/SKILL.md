---
name: ketchup
description: "Catch the user up on what changed in this chat since their last message, in plain words and small visuals, then list every call waiting on them with what they need to make it from the reply alone. Manual-only: `/ketchup` in Claude Code, `$ketchup` in Codex."
disable-model-invocation: true
---

# Ketchup

The user stepped away. Catch them up on everything that changed in this chat since the last message they wrote before `/ketchup`, so they understand each change and not only where it stands. Then lay out every call that's waiting on them, with enough in the reply to make it without opening anything. Notifications, report-backs, and subagent results aren't their messages. Assume they remember their last message and nothing after it.

Drop the jargon and speak coherently: say it simply and briefly, like one person catching up another. Say what changed for them, not how you did it: "the tests pass", not "CI is green". Leave out hashes, paths, commands, build numbers, and test counts unless they need one to act. Call each PR, branch, thread, or agent by a name they'd recognize, never a label you made up. A fact that needs context gets the context or gets cut.

## Gather

This turn is read-only. Don't change code, start an app or job, or post anything; visuals come only from what you already have.

- Collect your own work since their message, subagent and worker reports, and messages from anyone else in the chat.
- Check the live state of every PR, CI run, thread, or agent this chat touched.
- Check every number you'll show against its source, and say so when you correct one.

An action item is a call or step only the user can take: a product choice, an approval, something that can't be undone, or access you don't have. Include every one still waiting, even one raised before their last message. Work you can still do yourself isn't an action item, and never invent a call to fill the reply. A step nobody asked for and the work doesn't need isn't one either, unless it's irreversible and waiting on them: give that one line and no visual.

One call can cover many items, like a set of PRs waiting to merge. For each item, collect its link, what it changes for users, the evidence behind your pick, its risk, and your pick. Write "unknown" for a fact the call needs that you don't have, and leave out a link you don't have.

## Write

Spend the words on the calls, not the story. What happened stays under 100 words, not counting visuals, and shorter when less happened; work that changed nothing for the user stays out. Each item gets about 30 words, so the reply grows with the items: two need well under 150 words in all, thirty need far more. Never cut or shrink items to hit a count: no "12 PRs need review" in place of the list, and no link in place of an item. A link adds depth, but the reply alone must be enough to decide.

1. **Open** with one short sentence naming what waits on the user, or saying nothing does. If nothing happened and nothing waits, say so and stop.
2. **What happened, visuals first.** Embed the screenshots and videos the work produced, then any diagram that explains a change. Then one short bullet per thing the user asked for: what came of it, and whether it's done, still running, failed, or unchecked. Write each the way you'd say it out loud ("Search was slow because of a missing index", not "Search: done"). Name any bug found and fixed along the way. Each line stays true read alone; never mark something done that still waits on the user, and don't repeat what the action items say.
3. **Under that,** at most three short lines that change what the user knows or must do, then one line naming the work left that you can do yourself.
4. **Action items.** Ask the call the user owns (merge, approve, pick) and give your pick. A step you'd take first, anything that must happen first, and anything that can't be undone all go in the pick. Name the PR, issue, thread, or agent each call is about by number or link, even in a call between options.

Fit the shape to the call:

- **One item:** one bullet with the call, your pick, what it changes for users, the evidence, and its risk, naming the item once.
- **Items sharing a call:** write the call and pick once, then one bullet per item, riskiest first: link and name, what it changes for users, evidence, risk. Name an item's pick only where it differs.
- **Options:** give every option the work weighed, each with what it gets the user, what it costs, and the current state when there is one. The costs are the risk, so no separate risk line. When screenshots above show the options, put each option's gain and cost under its screenshot.

Give every item its risk, even a low one ("Low risk: only the colors change"). Say what waiting costs only when it's more than a delay, like a deadline or lost data.

## Visuals

A visual is a picture: a screenshot, a video, a diagram, a chart, or a generated image. A Markdown table isn't one, even with before and after columns.

Draw when a picture is quicker to grasp than sentences: how a design or system works, a PR stack with each PR's state, a before and after, options side by side. Never draw a status list, the action items, or boxes with nothing connecting them, and never show a fact twice. In T3, build the page, check it with `html_preview`, and publish it with `html_render` before the reply; elsewhere use Mermaid.

Keep each visual readable at a glance: at most six boxes, at most eight words in each, labels in words a person would say ("tests pass", not "Tests: pass"). A fact that needs a sentence belongs in the text or nowhere.

Embed screenshots and videos inline when a change is visible. If a visible change has none, mark its line "No screenshot yet" and say there what changed on screen. Draw only from facts you have: never invent a number, never draw a screen you didn't capture, and link only artifacts that exist.
