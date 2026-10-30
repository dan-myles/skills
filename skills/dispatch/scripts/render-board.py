"""Render saved Dispatch Markdown as a self-contained, themed issue-card board."""
import argparse
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
    'Active work and its next checkpoint.',
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
    active_workers, verified_workers, external, missing_runtime = set(), set(), 0, 0
    if not stamp:
        warnings.append('Saved board has no Updated timestamp.')
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
            worker_links = [target for _, target, _ in links(field(body, 'Worker') or field(body, 'Owner'), root) if target.startswith('t3-thread://')]
            coordination = field(body, 'Coordination').lower() == 'external'
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
                sketch = '<p class="notice">Illustration needs review; see saved evidence.</p>'
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
    provenance = ' · '.join(metadata) if metadata else 'Publication and ownership details are in the saved store.'
    page = Template((ASSETS / 'board.html').read_text()).substitute(
        title=esc(title), project=esc(project), css=(ASSETS / 'board.css').read_text(), js=(ASSETS / 'board.js').read_text(),
        stamp=esc(stamp or 'Timestamp not recorded'), warnings=('<p class="notice">Saved board has missing presentation fields; see renderer warnings.</p>' if warnings else ''),
        metrics=metrics, tabs=tabs, segments=segments, panels=''.join(panel_html),
        runtime_summary=esc(f'{"At least " if missing_runtime else ""}{len(active_workers)} verified active workers / {len(verified_workers)} reconciled owners · {sum(counts)} issue cards · {external} external coordination cards'
                            + (f' · {missing_runtime} worker cards still need reconciliation; total active count unknown' if missing_runtime else '')),
        distribution_label=esc('; '.join(f'{name}: {counts[i]}' for i, name in enumerate(SECTIONS))),
        provenance=esc(provenance) + '<br>Markdown SHA-256: ' + digest[:12])
    return page, {'cards': sum(counts), 'sections': dict(zip(SECTIONS, counts)), 'markdownSha256': digest, 'activeWorkers': len(active_workers), 'reconciledOwners': len(verified_workers), 'externalCoordinationCards': external, 'unreconciledWorkerCards': missing_runtime, 'warnings': warnings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('board', type=Path, help='Authoritative saved board.md')
    parser.add_argument('--output', type=Path, required=True, help='Derived HTML; use a temporary path for read-only views')
    parser.add_argument('--project', default='Repository', help='Shareable project label')
    args = parser.parse_args()
    try:
        board = args.board.resolve()
        if args.output.resolve() == board:
            raise ValueError('HTML output must not overwrite the Markdown source.')
        page, result = render(board.read_text(), board.parent, args.project)
        args.output.write_text(page)
        result['output'] = str(args.output.resolve())
        print(json.dumps(result))
    except (OSError, ValueError) as error:
        print(f'Board render failed: {error}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
