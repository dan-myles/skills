"""Render a Dispatch board from its Beads graph as a self-contained, themed issue-card board."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import html
import json
from pathlib import Path
import re
from string import Template
import sys
from urllib.parse import urlsplit

SECTIONS = ('Now', 'Backlog', 'What landed', 'Watch and links')
NOTES = (
    'Every open Cooper, running, idle or waiting, and its next checkpoint.',
    'Waiting for review, access, a decision or a place in the queue.',
    'Merged work and accepted findings. Deployment is recorded separately.',
    'Risks, provenance and coordination links.',
)
LINK = re.compile(r'\[([^\]]+)\]\(([^)]+)\)|<(t3-thread://[^>]+)>|((?:https?://|t3-thread://)[^\s<>]+)')
ASSETS = Path(__file__).resolve().parents[1] / 'assets'


def esc(value):
    return html.escape(str(value), quote=True)


def headings(text):
    fenced = False
    fence = ''
    length = 0
    for line in text.splitlines():
        marker = re.match(r'^\s*(`{3,}|~{3,})', line)
        if marker:
            if not fenced:
                fence, length, fenced = marker[1][0], len(marker[1]), True
            elif marker[1][0] == fence and len(marker[1]) >= length and not line.strip().strip(fence):
                fenced = False
            yield None, line
        elif not fenced and re.match(r'^#{1,3} ', line):
            level, title = line.split(' ', 1)
            yield len(level), title.strip()
        else:
            yield None, line


def field(body, name):
    fence = None
    for line in body.splitlines():
        marker = re.match(r'^\s*(`{3,}|~{3,})', line)
        if marker:
            if fence is None:
                fence = marker[1]
            elif marker[1][0] == fence[0] and len(marker[1]) >= len(fence) and not line.strip().strip(fence[0]):
                fence = None
            continue
        if fence is None and line.startswith('- ' + name + ':'):
            return line.split(':', 1)[1].strip()
    return ''


def link_target(url, root):
    url = url.strip()
    if any(ord(c) < 32 for c in url) or url.startswith('//') or '\\' in url:
        return None
    parsed = urlsplit(url)
    if parsed.scheme:
        return url if parsed.scheme in ('https', 'http', 't3-thread') and parsed.netloc else None
    return str((root / url).resolve()) if url else None


def links(value, root):
    for match in LINK.finditer(value):
        raw = match[2] or match[3] or match[4]
        if not (match[2] or match[3]):
            raw = raw.rstrip('.,;')
        target = link_target(raw, root)
        if target:
            label = match[1] or (
                'Worker' if raw.startswith('t3-thread:') else
                'PR #' + raw.rstrip('/').rsplit('/', 1)[-1] if '/pull/' in raw else
                'Linear' if urlsplit(raw).hostname == 'linear.app' else
                'Source' if 'slack.com' in (urlsplit(raw).hostname or '') else raw
            )
            yield match, target, label


def rich(value, root):
    output, end = [], 0
    for match, target, label in links(value, root):
        output.append(esc(value[end:match.start()]))
        output.append(f'<a href="{esc(target)}">{esc(label)}</a>')
        end = match.end()
    output.append(esc(value[end:]))
    return ''.join(output)


def parse(text):
    sections, ids, current, card = [], set(), None, None
    title, stamp, metadata = 'Dispatch board', '', []
    for level, line in headings(text):
        if level == 1:
            title = line
        elif level == 2:
            if line not in SECTIONS:
                raise ValueError(f'Unknown board section: {line}. Expected the four standard sections.')
            current = {'title': line, 'cards': [], 'notes': []}
            sections.append(current)
            card = None
        elif level == 3:
            if current is None:
                raise ValueError('Issue heading appears before a board section.')
            ident, separator, label = line.partition(': ')
            if not separator or not ident.strip() or not label.strip():
                raise ValueError('Use issue headings in the form ### I001: Issue title.')
            if ident in ids:
                raise ValueError(f'Duplicate issue ID: {ident}')
            ids.add(ident)
            card = {'id': ident, 'title': label, 'lines': []}
            current['cards'].append(card)
        elif current is not None:
            (card['lines'] if card is not None else current['notes']).append(line)
        elif line.startswith('Updated:'):
            stamp = line.split(':', 1)[1].strip()
        elif line.strip():
            metadata.append(line)
    if tuple(s['title'] for s in sections) != SECTIONS:
        raise ValueError('Include Now, Backlog, What landed, Watch and links exactly once, in that order.')
    return title, stamp, metadata, sections


def illustration(raw):
    if not raw:
        return ''
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError('Illustration must be an object.')
    kind = data['type']
    if kind == 'buttons':
        before, after = data['before'], data['after']
        body = (f'<div class="compare"><div><small>Before</small><div class="mock-button muted-button">{esc(before)}</div></div>'
                f'<div class="connector" aria-hidden="true">→</div><div><small>After</small><div class="mock-button">{esc(after)}</div></div></div>')
    elif kind == 'screens':
        screens = data['screens']
        if not isinstance(screens, list) or not 2 <= len(screens) <= 3:
            raise ValueError('screens illustration needs 2-3 screens.')
        parts = []
        for screen in screens:
            if not isinstance(screen, dict):
                raise ValueError('Each screen must be an object.')
            parts.append('<div class="phone"><div class="island" aria-hidden="true"></div>'
                         f'<b>{esc(screen["title"])}</b><div class="mock-card">{esc(screen.get("body", ""))}</div>'
                         + (f'<div class="mock-button">{esc(screen["button"])}</div>' if screen.get('button') else '') + '</div>')
        body = '<div class="phones">' + '<div class="connector" aria-hidden="true">→</div>'.join(parts) + '</div>'
    elif kind == 'gesture':
        body = (f'<div class="gesture"><div class="mock-card">{esc(data["from"])}'
                f'<div class="swipe">{esc(data["gesture"])}</div></div><div class="connector" aria-hidden="true">→</div>'
                f'<div class="destination">{esc(data["to"])}<small>{esc(data.get("note", ""))}</small></div></div>')
    else:
        raise ValueError(f'Unknown illustration type: {kind}')
    return '<div class="illustration"><div class="sketch-label">Schematic · ' + esc(data.get('label', kind)) + '</div>' + body + '</div>'


def render(text, root, project='Repository'):
    title, stamp, metadata, sections = parse(text)
    warnings, panel_html = [], []
    active_workers, verified_workers, open_workers, external, missing_runtime = set(), set(), set(), 0, 0
    if not stamp:
        warnings.append('Board has no Updated timestamp.')
    listing = next((m for m in metadata if m.startswith('Live list:')), '')
    listing_gap = listing.startswith('Live list: unknown')
    if listing_gap:
        warnings.append(listing.removeprefix('Live list: ').replace('unknown · ', '').replace('unknown at ', 'list at ') + '.')
    for index, section in enumerate(sections):
        cards = []
        for card in section['cards']:
            body = '\n'.join(card['lines'])
            summary = field(body, 'Summary')
            visual = [part.replace('\\|', '|').strip() for part in re.split(r'(?<!\\)\|', field(body, 'Visual')) if part.strip()]
            if not summary:
                warnings.append(f'{card["id"]}: add a one-sentence Summary.')
            if not 2 <= len(visual) <= 4:
                warnings.append(f'{card["id"]}: add a Visual with 2-4 evidence-based steps.')
                visual = []
            execution = re.search(r'(?:^|[;\s])execution: ([^;\n]+)', field(body, 'State'))
            state = execution[1].rstrip('.') if execution else field(body, 'State').split(';', 1)[0]
            gate = field(body, 'Gate') or field(body, 'Gates')
            verified = field(body, 'Verified')
            runtime = field(body, 'Runtime').lower()
            worker_links = [thread_key(target) for _, target, _ in links(field(body, 'Worker') or field(body, 'Owner'), root) if target.startswith('t3-thread://')]
            if field(body, 'Recheck'):
                warnings.append(f'{card["id"]}: {field(body, "Recheck")}')
            coordination = field(body, 'Coordination').lower() == 'external'
            if index == 0 and not coordination:
                open_workers.update(worker_links or ([card['id']] if 'uncertain launch' in field(body, 'State') else []))
            if coordination:
                external += 1
            elif runtime in ('running', 'starting', 'preparing') and not worker_links:
                missing_runtime += 1
                warnings.append(f'{card["id"]}: active runtime has no exact worker link; total active count unknown.')
            elif worker_links:
                if runtime and verified:
                    verified_workers.update(worker_links)
                    if runtime in ('running', 'starting', 'preparing'):
                        active_workers.update(worker_links)
                        if index != 0:
                            warnings.append(f'{card["id"]}: active worker is outside Now; reconcile board placement.')
                else:
                    missing_runtime += 1
                    warnings.append(f'{card["id"]}: worker runtime/Verified missing; reconcile before presentation.')
            freshness = ('External coordination · ' if coordination else '') + 'Last verified: ' + (verified or 'not recorded')
            if runtime:
                freshness += ' · runtime: ' + runtime

            try:
                sketch = illustration(field(body, 'Illustration'))
            except (ValueError, KeyError, TypeError) as error:
                warnings.append(f'{card["id"]}: invalid Illustration ({type(error).__name__}).')
                sketch = '<p class="notice">Illustration needs review; see the issue evidence.</p>'
            steps = '<span class="arrow" aria-hidden="true">→</span>'.join(
                f'<div class="step"><span class="step-number">{i + 1:02}</span><span>{esc(step)}</span></div>' for i, step in enumerate(visual))
            flow = ('<div class="diagram-label">Issue schematic</div><div class="flow" role="group" aria-label="Issue cause/effect or before/after schematic">'
                    + steps + '</div>') if visual else '<p class="notice">Issue schematic not recorded.</p>'
            seen, anchors = set(), []
            for _, target, label in links(body, root):
                if target not in seen:
                    seen.add(target)
                    anchors.append(f'<a class="link" href="{esc(target)}">{esc(label)} ↗</a>')
            evidence = ''.join('<p>' + rich(line.removeprefix('- '), root) + '</p>' for line in card['lines']
                               if line.strip() and not line.startswith(('- Summary:', '- Visual:', '- Illustration:')))
            cards.append(f'<article class="issue" data-search="{esc((card["id"] + " " + card["title"] + " " + body).lower())}">'
                         f'<div class="card-top"><span class="issue-id">{esc(card["id"])}</span><span class="status">{esc(state or "Status not recorded")}</span></div>'
                         f'<h2>{esc(card["title"])}</h2><p class="description">{esc(summary or "Outcome not recorded.")}</p>'
                         + f'<p class="freshness">{esc(freshness)}</p>'
                         + (f'<p class="gate">Gate: {rich(gate, root)}</p>' if gate else '') + sketch + flow
                         + '<div class="card-bottom"><div class="links">' + ''.join(anchors)
                         + '</div><details><summary>Evidence &amp; coordination</summary><div class="evidence">' + evidence + '</div></details></div></article>')
        notes = ''.join('<p>' + rich(line, root) + '</p>' for line in section['notes'] if line.strip())
        panel_html.append(f'<section class="panel tone-{index}" role="tabpanel" tabindex="0" aria-labelledby="tab-{index}" id="panel-{index}"'
                          + (' hidden' if index else '') + f'><div class="section-note">{esc(NOTES[index])}</div><div class="issue-grid">'
                          + ''.join(cards) + '</div><p class="empty" hidden>No matching issues in this view.</p>'
                          + ('<details class="section-meta"><summary>Section notes</summary>' + notes + '</details>' if notes else '') + '</section>')
    counts = [len(section['cards']) for section in sections]
    metrics = ''.join(f'<button class="metric" data-target="{i}" aria-label="Show {esc(name)}, {counts[i]} issues"><span class="metric-count">{counts[i]}</span><span>{esc(name)}</span></button>' for i, name in enumerate(SECTIONS))
    tabs = ''.join(f'<button role="tab" aria-selected="{str(i == 0).lower()}" tabindex="{0 if i == 0 else -1}" aria-controls="panel-{i}" id="tab-{i}" data-target="{i}" data-label="{esc(name)}">{esc(name)}<span>{counts[i]}</span></button>' for i, name in enumerate(SECTIONS))
    segments = ''.join(f'<span style="flex:{count}" class="segment segment-{i}" title="{esc(SECTIONS[i])}: {count}"></span>' for i, count in enumerate(counts) if count)
    digest = hashlib.sha256(text.encode()).hexdigest()
    provenance = ' · '.join(metadata) if metadata else 'Ownership details are on the Dispatch root issue.'
    page = Template((ASSETS / 'board.html').read_text()).substitute(
        title=esc(title), project=esc(project), css=(ASSETS / 'board.css').read_text(), js=(ASSETS / 'board.js').read_text(),
        stamp=esc(stamp or 'Timestamp not recorded'), warnings=('<p class="notice">Board has missing presentation fields; see renderer warnings.</p>' if warnings else ''),
        metrics=metrics, tabs=tabs, segments=segments, panels=''.join(panel_html),
        runtime_summary=esc(f'{len(open_workers)} open Cooper{"" if len(open_workers) == 1 else "s"} · {"at least " if missing_runtime or listing_gap else ""}{len(active_workers)} running now' + (', total unknown' if listing_gap else '') + f' / {len(verified_workers)} reconciled owners · {sum(counts)} issue cards · {external} external coordination cards'
                            + (f' · {missing_runtime} worker cards still need reconciliation; total active count unknown' if missing_runtime else '')),
        distribution_label=esc('; '.join(f'{name}: {counts[i]}' for i, name in enumerate(SECTIONS))),
        provenance=esc(provenance) + '<br>Markdown SHA-256: ' + digest[:12])
    return page, {'cards': sum(counts), 'sections': dict(zip(SECTIONS, counts)), 'markdownSha256': digest, 'openWorkers': len(open_workers), 'activeWorkers': len(active_workers), 'activeIsLowerBound': bool(missing_runtime or listing_gap), 'liveListComplete': None if not listing else not listing_gap, 'reconciledOwners': len(verified_workers), 'externalCoordinationCards': external, 'unreconciledWorkerCards': missing_runtime, 'warnings': warnings}


HIDDEN_TYPES = ('gate', 'event', 'message', 'molecule')
ACTIVE = ('running', 'starting', 'preparing')
LIVE = ACTIVE + ('queued', 'waiting')


def line(value):
    return ' '.join(str(value).split())


def parse_time(value):
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    except ValueError:
        return None


def descendants(issues, root):
    children = {}
    for issue in issues:
        if issue.get('parent'):
            children.setdefault(issue['parent'], []).append(issue)
    found, frontier = [], [root]
    while frontier:
        for child in children.get(frontier.pop(), []):
            found.append(child)
            frontier.append(child['id'])
    return found


def thread_key(value):
    """Exact thread ID from a t3.thread value or a t3-thread:// link."""
    value = str(value or '').strip().strip('<>')
    return value.rsplit('/', 1)[-1] if value.startswith('t3-thread:') else value


def final_listing(live):
    """The last project-wide thread list in the live file: (threads, complete, time, note).

    threads is None when no list was captured. The coordinator is removed, and a thread
    repeated across pages counts once. The list is complete only when its last page has no
    next cursor, nothing failed, it covered every live status, and it held `total` threads."""
    listing = live.get('listing') if isinstance(live.get('listing'), dict) else {}
    snapshots = listing.get('snapshots') or []
    if not snapshots:
        return None, False, '', 'not captured'
    snap = snapshots[-1]
    pages = snap.get('pages') or []
    threads = {}
    for page in pages:
        for thread in page.get('threads') or []:
            key = thread_key(thread.get('threadId'))
            if key:
                threads.setdefault(key, thread)
    totals = {page.get('total') for page in pages} - {None}
    statuses = set(snap.get('statuses') or LIVE)
    problems = ([str(snap['error'])] if snap.get('error') else []) + (['no pages'] if not pages else [])
    if pages and pages[-1].get('nextCursor') is not None:
        problems.append('more pages not read')
    if len(totals) > 1 or (totals and len(threads) < max(totals)):
        problems.append(f'read {len(threads)} of {max(totals)} threads')
    if not set(ACTIVE) <= statuses:
        problems.append('statuses filter omits running states')
    threads.pop(thread_key(listing.get('coordinator')), None)
    return threads, not problems, line(snap.get('at', '')), '; '.join(problems)


def worker_of(issue):
    meta = issue.get('metadata') or {}
    return meta.get('t3.thread') or meta.get('t3.link') or ''


def current_issues(issues):
    """Map each worker to the one issue it currently works, so a reused worker gets one card."""
    def rank(issue):
        when = parse_time(issue.get('updated_at') or issue.get('closed_at') or issue.get('created_at') or '')
        return issue.get('status') != 'closed', when.timestamp() if when else 0
    best = {}
    for issue in issues:
        key = worker_of(issue)
        if key and (key not in best or rank(issue) > rank(best[key])):
            best[key] = issue
    return {key: issue['id'] for key, issue in best.items()}


def beads_markdown(issues, root_id, live=None, landed_days=14, now=None):
    """Convert `bd list --all --include-gates --json` output and live T3 evidence into the board format."""
    live = live or {}
    observed = live.get('workers', {})
    now = now or datetime.now(timezone.utc)
    threads, complete, listed_at, gap = final_listing(live)
    if issues is None:
        root, mine, by_id = {'title': 'Live Coopers (Beads unavailable)'}, [], {}
    else:
        by_id = {issue['id']: issue for issue in issues}
        root = by_id.get(root_id)
        if root is None:
            raise ValueError(f'Root issue {root_id} is not in the Beads export.')
        mine = descendants(issues, root_id)
    matched = set()
    blocked, missing = {}, {}
    for issue in mine:
        for dep in issue.get('dependencies') or []:
            target = by_id.get(dep.get('depends_on_id'))
            if dep.get('type') != 'blocks':
                continue
            if target is None:
                missing.setdefault(issue['id'], []).append(dep.get('depends_on_id'))
            elif target.get('status') != 'closed':
                blocked.setdefault(issue['id'], []).append(target)
    blocking = {target['id'] for targets in blocked.values() for target in targets}
    current = current_issues([i for i in mine if i.get('issue_type') not in HIDDEN_TYPES and 'dropped' not in (i.get('labels') or [])])
    sections = {name: [] for name in SECTIONS}
    for issue in mine:
        kind, status, labels = issue.get('issue_type'), issue.get('status'), set(issue.get('labels') or [])
        meta = issue.get('metadata') or {}
        if kind in HIDDEN_TYPES or 'dropped' in labels:
            continue
        if kind == 'decision' and (status == 'closed' or issue['id'] in blocking):
            continue
        worker = worker_of(issue)
        moved = current.get(worker) if worker and current.get(worker) != issue['id'] else ''
        evidence = {} if moved else observed.get(issue['id'], {})
        runtime = line(evidence.get('runtime', '')).lower()
        verified, recheck = evidence.get('verified', ''), ''
        listed = threads.get(thread_key(worker)) if threads is not None and worker and not moved else None
        if listed is not None:
            matched.add(thread_key(worker))
            final = line(listed.get('status', '')).lower()
            if final != runtime:
                recheck = f'final list at {listed_at} shows {final}; worker read showed {runtime or "nothing"}. Reread its run, pending input and new activity.'
            runtime, verified = final, listed_at
        elif threads is not None and complete and worker and not moved and runtime in LIVE:
            recheck = f'not in the final running list at {listed_at}; worker read showed {runtime}. Reread its run.'
            runtime = 'not running at final check'
        closed = parse_time(issue.get('closed_at', ''))
        settled = (evidence.get('settled') is True or bool(meta.get('t3.settled'))) and listed is None
        uncertain = bool(meta.get('t3.request')) and not meta.get('t3.thread') and status != 'closed'
        open_worker = bool(worker) and not moved and not settled
        if open_worker or uncertain or runtime in LIVE:
            section = 'Now'
        elif status == 'closed':
            if closed and closed < now - timedelta(days=landed_days):
                continue
            section = 'What landed'
        elif labels & {'watch', 'external'}:
            section = 'Watch and links'
        else:
            section = 'Backlog'
        gates = [f'{t["id"]} {t["title"]}' + (' (needs Dan)' if 'human' in (t.get('labels') or []) else '')
                 for t in blocked.get(issue['id'], [])]
        gates += [f'{target} (not in export; include gates)' for target in missing.get(issue['id'], [])]
        fields = [('Summary', meta.get('board.summary') or (issue.get('description') or '').split('. ')[0]),
                  ('Visual', meta.get('board.visual', '')),
                  ('State', '; '.join(filter(None, [f'execution: {runtime}' if open_worker and runtime else '', status,
                                                    'uncertain launch' if uncertain else '', ', '.join(sorted(labels))]))),
                  ('Recheck', recheck),
                  ('Gate', '; '.join(gates)),
                  ('Owner', issue.get('assignee', '')),
                  ('Worker' if open_worker else 'Thread',
                   f'[{meta.get("t3.title") or "Worker"}]({meta["t3.link"]})' if meta.get('t3.link') else ''),
                  ('Worker state', 'moved to ' + moved if moved else 'settled' if worker and settled
                   else 'open, ' + (runtime or 'runtime not reconciled') if open_worker else ''),
                  ('Runtime', runtime), ('Verified', verified), ('Run', evidence.get('run', '')),
                  ('Pending input', evidence.get('pendingInput', '')), ('Evidence', evidence.get('evidence', '')),
                  ('PR', ' '.join(str(meta.get('pr.url') or '').split(','))), ('Head', meta.get('pr.head', '')),
                  ('Merge', meta.get('merge.sha', '')), ('Source', meta.get('source.url', '')),
                  ('External', issue.get('external_ref', '')), ('Acceptance', issue.get('acceptance_criteria', '')),
                  ('Closed', issue.get('close_reason', '')),
                  ('Coordination', 'external' if 'external' in labels else ''),
                  ('Illustration', meta['board.illustration'] if isinstance(meta.get('board.illustration'), str)
                   else json.dumps(meta['board.illustration']) if meta.get('board.illustration') else '')]
        body = [f'- {name}: {line(value)}' for name, value in fields if line(value)]
        order = -closed.timestamp() if section == 'What landed' and closed else issue.get('priority', 2)
        sections[section].append((order, f'### {issue["id"]}: {line(issue["title"])}\n' + '\n'.join(body)))
    elsewhere = {thread_key(worker_of(i)): i['id'] for i in (issues or []) if worker_of(i)}
    ignored = 0
    for key, thread in (threads or {}).items():
        status, title = line(thread.get('status', '')).lower(), line(thread.get('title', '')) or key
        if key in matched or (thread.get('settled') and status not in LIVE):
            continue
        link = line(thread.get('link', '')).strip('<>') or f't3-thread://v1/{key}'
        entry = next((e for e in observed.values() if thread_key(e.get('thread') or e.get('link')) == key), {})
        if key in elsewhere:
            body = [('Summary', f'Running Cooper owned by {elsewhere[key]}, outside this root.'),
                    ('Visual', 'Project thread list | Cooper on another root | Its coordinator tracks it'),
                    ('State', f'execution: {status}'), ('Thread', f'[{title}]({link})'), ('Coordination', 'external')]
            target = 'Watch and links'
        elif title.lower().startswith('cooper'):
            note = 'No issue in this graph tracks it.' if issues is not None else 'Beads is unavailable, so no issue is shown.'
            body = [('Summary', f'Cooper found in the project thread list. {note}'),
                    ('Visual', 'Project thread list | Cooper ' + status + ' | Reconcile its ownership'),
                    ('State', f'execution: {status}' + ('; untracked' if issues is not None else '')),
                    ('Worker', f'[{title}]({link})'), ('Runtime', status), ('Verified', listed_at),
                    ('Pending input', entry.get('pendingInput', '')), ('Evidence', entry.get('evidence', ''))]
            target = 'Now'
        else:
            ignored += 1
            continue
        card = 'T3-' + hashlib.sha1(key.encode()).hexdigest()[:8]
        sections[target].append((0, f'### {card}: {title}\n' + '\n'.join(f'- {n}: {line(v)}' for n, v in body if line(v))))
    coordinator = thread_key((live.get('listing') or {}).get('coordinator'))
    for ident, entry in observed.items() if issues is None else ():
        key = thread_key(entry.get('thread') or entry.get('link'))
        if not key or key == coordinator or key in (threads or {}) or entry.get('settled') is True:
            continue
        runtime = line(entry.get('runtime', '')).lower()
        body = [('Summary', 'Known Cooper, not in the final running list. Beads is unavailable, so no issue is shown.'),
                ('Visual', f'Worker read | Cooper {runtime or "not reconciled"} | Reconcile its ownership'),
                ('State', f'execution: {runtime}' if runtime else ''),
                ('Worker', f'[{line(entry.get("title", "")) or "Worker"}](t3-thread://v1/{key})' if not entry.get('link') else
                 f'[{line(entry.get("title", "")) or "Worker"}]({line(entry["link"]).strip("<>")})'),
                ('Runtime', runtime), ('Verified', entry.get('verified', '')),
                ('Pending input', entry.get('pendingInput', '')), ('Evidence', entry.get('evidence', ''))]
        card = 'T3-' + hashlib.sha1(key.encode()).hexdigest()[:8]
        sections['Now'].append((1, f'### {card}: {line(entry.get("title", "")) or ident}\n' + '\n'.join(f'- {n}: {line(v)}' for n, v in body if line(v))))
    if threads is None:
        listing = 'Live list: unknown · project thread list not captured; running count is a lower bound'
    elif complete:
        listing = f'Live list: complete at {listed_at}' + (f' · {ignored} other active threads are not Coopers' if ignored else '')
    else:
        listing = f'Live list: unknown at {listed_at} · {gap}; running count is a lower bound'
    owner = (root.get('metadata') or {}).get('dispatch.owner_link', '')
    stamp = live.get('verified', '')
    where = (f'Beads root {root_id}' + (f' · owner {line(owner)}' if owner else '')) if issues is not None else \
        'Beads graph unavailable · showing live T3 workers only'
    text = [f'# {line(root["title"])}'] + ([f'Updated: {line(stamp)}'] if stamp else []) + [where, listing]
    for name in SECTIONS:
        text.append(f'## {name}')
        text.extend(card for _, card in sorted(sections[name], key=lambda item: item[0]))
    return '\n'.join(text) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('board', type=Path, nargs='?', help='Legacy saved board.md, read-only')
    parser.add_argument('--beads', type=Path, help='Output of `bd list --all --limit 0 --json`')
    parser.add_argument('--root', help='Dispatch root issue ID')
    parser.add_argument('--live', type=Path, help='Live T3 evidence JSON from this pass; alone when Beads is unavailable')
    parser.add_argument('--landed-days', type=int, default=14, help='Show closed work from this many days')
    parser.add_argument('--output', type=Path, required=True, help='Derived HTML; use a temporary path')
    parser.add_argument('--project', default='Repository', help='Shareable project label')
    args = parser.parse_args()
    try:
        if (args.board and (args.beads or args.live)) or bool(args.beads) != bool(args.root) or not (args.board or args.live or args.beads):
            raise ValueError('Pass --beads with --root (and --live), --live alone when Beads is unavailable, or a legacy board.md.')
        if args.beads or args.live:
            live = json.loads(args.live.read_text()) if args.live else {}
            issues = json.loads(args.beads.read_text()) if args.beads else None
            text, root = beads_markdown(issues, args.root, live, args.landed_days), Path.cwd()
        else:
            board = args.board.resolve()
            if args.output.resolve() == board:
                raise ValueError('HTML output must not overwrite the Markdown source.')
            text, root = board.read_text(), board.parent
        page, result = render(text, root, args.project)
        args.output.write_text(page)
        result['output'] = str(args.output.resolve())
        print(json.dumps(result))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f'Board render failed: {error}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
