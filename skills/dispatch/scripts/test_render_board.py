"""Behavior checks for board rendering from Beads, privacy and truthful counts."""
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('board', Path(__file__).with_name('render-board.py'))
board = importlib.util.module_from_spec(spec)
spec.loader.exec_module(board)
ROOT = Path('/tmp/dispatch-fixture')
EXAMPLE = (board.ASSETS / 'example-board.md').read_text()
ISSUES = json.loads((board.ASSETS / 'example-beads.json').read_text())
LIVE = json.loads((board.ASSETS / 'example-live.json').read_text())
NOW = datetime(2026, 10, 31, tzinfo=timezone.utc)
STATUSES = ['running', 'starting', 'preparing', 'queued', 'waiting']


def thread(key, status='running', title=None):
    return {'threadId': key, 'title': title or f'cooper: {key}', 'status': status, 'link': f'<t3-thread://v2/env/{key}>'}


def snapshot(*pages, at='final', total=None):
    """One project-wide list; each page is a list of threads, cursors chained in order."""
    count = total if total is not None else len({t['threadId'] for page in pages for t in page})
    return {'at': at, 'statuses': STATUSES, 'pages': [
        {'cursor': i, 'nextCursor': i + 1 if i + 1 < len(pages) else None, 'total': count, 'threads': page}
        for i, page in enumerate(pages)]}


def worker_issue(ident, key, labels=(), status='in_progress'):
    return {'id': ident, 'title': f'Job {ident}', 'status': status, 'issue_type': 'task', 'parent': 'demo-r',
            'labels': list(labels), 'description': 'A worker job.', 'updated_at': '2026-10-30T10:00:00Z',
            'metadata': {'t3.thread': key, 't3.link': f't3-thread://v2/env/{key}', 't3.title': f'cooper: {key}',
                         'board.visual': 'Before | After'}}

class BoardTests(unittest.TestCase):
    def test_fixture_and_illustrations(self):
        page, stats = board.render(EXAMPLE, ROOT)
        self.assertEqual(stats['cards'], 4)
        self.assertEqual(stats['externalCoordinationCards'], 1)
        self.assertEqual(stats['warnings'], [])
        self.assertEqual(page.count('class="illustration"'), 3)
        self.assertIn('role="tablist"', page)

    def test_unique_owners_and_missing_reconciliation(self):
        text = EXAMPLE.replace('t3-thread://v2/example-environment/example-worker', 't3-thread://v2/env/owner')
        text = text.replace('### DEMO-2:', '### DEMO-5: Copy\n- Summary: Copy outcome\n- Visual: Before | After\n- Worker: <t3-thread://v2/env/owner>\n- Runtime: running\n- Verified: 2026-10-30 12:00 UTC\n### DEMO-2:')
        page, stats = board.render(text, ROOT)
        self.assertEqual(stats['activeWorkers'], 1)
        self.assertTrue(any('outside Now' in w for w in stats['warnings']))
        page, stats = board.render(text.replace('- Verified:', '- Old timestamp:'), ROOT)
        self.assertIn('total active count unknown', page)
        self.assertGreater(stats['unreconciledWorkerCards'], 0)

    def test_escape_links_and_invalid_illustration(self):
        text = EXAMPLE.replace('Clear next step', '</script><img src=x onerror=alert(1)>')
        text += '\n- Unsafe: [click](javascript:alert)\n'
        text = text.replace('{"type":"buttons","before":"Continue","after":"Save changes"}', '{"type":"screens","screens":[1,2]}')
        page, stats = board.render(text, ROOT)
        self.assertNotIn('<img src=x', page)
        self.assertNotIn('href="javascript:', page)
        self.assertTrue(any('invalid Illustration' in w for w in stats['warnings']))

    def test_fences_and_structure(self):
        text = EXAMPLE.replace('## Now', '````text\n## Bogus\n```\n### Bogus: Hidden\n````\n## Now')
        self.assertEqual(board.render(text, ROOT)[1]['cards'], 4)
        self.assertEqual(board.field('````\n```\n- Summary: hidden\n````\n- Summary: actual', 'Summary'), 'actual')
        for bad in (EXAMPLE.replace('## Now', '## Later'), EXAMPLE.replace('DEMO-2:', 'DEMO-1:')):
            with self.assertRaises(ValueError):
                board.render(bad, ROOT)

    def test_empty_sections(self):
        text = '# Empty\nUpdated: 2026-10-30 12:00 UTC\n' + '\n'.join('## ' + s for s in board.SECTIONS)
        self.assertEqual(board.render(text, ROOT)[1]['cards'], 0)

class BeadsTests(unittest.TestCase):
    def test_graph_places_cards_by_status_labels_and_live_runtime(self):
        page, stats = board.render(board.beads_markdown(ISSUES, 'demo-r', LIVE, now=NOW), ROOT)
        self.assertEqual(stats['sections'], {'Now': 1, 'Backlog': 1, 'What landed': 1, 'Watch and links': 1})
        self.assertEqual(stats['activeWorkers'], 1)
        self.assertEqual(stats['warnings'], [])
        self.assertEqual(page.count('class="illustration"'), 3)
        self.assertIn('Approve the confirmation copy? (needs Dan)', page)
        self.assertNotIn('Another Dispatch', page)
        self.assertNotIn('Abandoned idea', page)

    def test_without_live_evidence_open_worker_stays_in_now_unreconciled(self):
        page, stats = board.render(board.beads_markdown(ISSUES, 'demo-r', now=NOW), ROOT)
        self.assertEqual(stats['sections']['Now'], 1)
        self.assertEqual(stats['openWorkers'], 1)
        self.assertEqual(stats['activeWorkers'], 0)
        self.assertGreater(stats['unreconciledWorkerCards'], 0)

    def test_idle_or_waiting_workers_stay_in_now_whatever_the_issue_status(self):
        live = {'verified': 'now', 'workers': {
            'demo-r.1': {'runtime': 'completed', 'verified': 'now', 'pendingInput': 0},
            'demo-r.3': {'runtime': 'idle', 'verified': 'now', 'settled': False}},
            'listing': {'coordinator': 'dispatch', 'snapshots': [snapshot([thread('dispatch', title='Dispatch')])]}}
        issues = [dict(i, metadata=dict(i.get('metadata') or {}, **{'t3.thread': 'w3', 't3.link': 't3-thread://v1/w3'}))
                  if i['id'] == 'demo-r.3' else i for i in ISSUES]
        text = board.beads_markdown(issues, 'demo-r', live, now=NOW)
        page, stats = board.render(text, ROOT)
        self.assertEqual(stats['sections']['Now'], 2)
        self.assertEqual(stats['sections']['What landed'], 0)
        self.assertEqual((stats['openWorkers'], stats['activeWorkers']), (2, 0))
        self.assertIn('Worker state: open, completed', text)
        self.assertIn('2 open Coopers · 0 running now', page)

    def test_reused_worker_gets_one_card_on_its_current_issue(self):
        old = {'id': 'demo-r.7', 'title': 'First pass', 'status': 'closed', 'issue_type': 'spike', 'parent': 'demo-r',
               'closed_at': '2026-10-29T10:00:00Z', 'updated_at': '2026-10-29T10:00:00Z', 'description': 'Earlier job.',
               'metadata': {'t3.thread': 'w1', 't3.link': 't3-thread://v2/example-environment/example-worker',
                            'board.visual': 'a | b'}}
        issues = [dict(i, metadata=dict(i['metadata'], **{'t3.thread': 'w1'}), updated_at='2026-10-30T09:00:00Z')
                  if i['id'] == 'demo-r.1' else i for i in ISSUES] + [old]
        live = {'verified': 'now', 'workers': {k: {'runtime': 'idle', 'verified': 'now'} for k in ('demo-r.1', 'demo-r.7')}}
        text = board.beads_markdown(issues, 'demo-r', live, now=NOW)
        page, stats = board.render(text, ROOT)
        self.assertEqual(stats['sections']['Now'], 1)
        self.assertEqual(stats['openWorkers'], 1)
        self.assertIn('Worker state: moved to demo-r.1', text)

    def test_old_landed_work_ages_out_and_unblocked_decision_shows(self):
        issues = [dict(i, dependencies=[]) if i['id'] == 'demo-r.2' else i for i in ISSUES]
        text = board.beads_markdown(issues, 'demo-r', LIVE, landed_days=0, now=NOW)
        self.assertNotIn('demo-r.3:', text)
        self.assertIn('### demo-r.5: Approve the confirmation copy?', text)

    def test_graph_text_cannot_inject_board_structure(self):
        issues = [dict(i, title='Real\n## Now\n### X: injected') if i['id'] == 'demo-r.4' else i for i in ISSUES]
        text = board.beads_markdown(issues, 'demo-r', LIVE, now=NOW)
        self.assertEqual(board.render(text, ROOT)[1]['cards'], 4)

    def test_settled_worker_link_is_not_a_live_owner(self):
        issues = [dict(i, metadata=dict(i['metadata'], **{'t3.link': 't3-thread://v1/done', 't3.settled': '2026-10-29'}))
                  if i['id'] == 'demo-r.3' else i for i in ISSUES]
        page, stats = board.render(board.beads_markdown(issues, 'demo-r', LIVE, now=NOW), ROOT)
        self.assertIn('href="t3-thread://v1/done"', page)
        self.assertEqual(stats['warnings'], [])

    def test_live_runtime_wins_placement(self):
        live = {'verified': 'now', 'workers': {i: {'runtime': 'running', 'verified': 'now'} for i in ('demo-r.3', 'demo-r.4')}}
        issues = [dict(i, metadata=dict(i.get('metadata', {}), **{'t3.link': 't3-thread://v1/' + i['id']}))
                  if i['id'] in ('demo-r.3', 'demo-r.4') else i for i in ISSUES]
        page, stats = board.render(board.beads_markdown(issues, 'demo-r', live, now=NOW), ROOT)
        self.assertEqual(stats['sections']['Now'], 3)
        self.assertEqual(stats['activeWorkers'], 1)
        self.assertFalse(any('outside Now' in w for w in stats['warnings']))

    def test_hidden_gate_and_uncertain_launch_are_visible(self):
        issues = [dict(i, assignee='cooper:demo-r.2-a1', metadata=dict(i['metadata'], **{'t3.request': 'req'}),
                       dependencies=i['dependencies'] + [{'depends_on_id': 'gate-1', 'type': 'blocks'}])
                  if i['id'] == 'demo-r.2' else i for i in ISSUES]
        text = board.beads_markdown(issues, 'demo-r', LIVE, now=NOW)
        self.assertIn('gate-1 (not in export; include gates)', text)
        self.assertIn('uncertain launch', text)
        self.assertIn('- Owner: cooper:demo-r.2-a1', text)

    def test_missing_root_fails(self):
        with self.assertRaises(ValueError):
            board.beads_markdown(ISSUES, 'missing')


class LiveListTests(unittest.TestCase):
    """The final project-wide thread list, refreshed just before rendering, decides who is running."""
    BASE = [i for i in ISSUES if i['id'] not in ('demo-r.1',)]
    JOBS = [worker_issue('demo-r.7', 'bot-pool'), worker_issue('demo-r.8', 'arena-ui'),
            worker_issue('demo-r.9', 'brackets', labels=('merge-ready', 'merge:human'))]

    def live(self, *snapshots, workers=None):
        return {'verified': 'final', 'workers': workers or {}, 'listing': {'coordinator': 'dispatch', 'snapshots': list(snapshots)}}

    def first_reads(self):
        return {'demo-r.7': {'runtime': 'running', 'verified': 'first'},
                'demo-r.8': {'runtime': 'running', 'verified': 'first'},
                'demo-r.9': {'runtime': 'completed', 'verified': 'first', 'evidence': 'final report: awaiting review'}}

    def board(self, live, issues=None):
        text = board.beads_markdown(self.BASE + self.JOBS if issues is None else issues, 'demo-r', live, now=NOW)
        return text, board.render(text, ROOT)

    def test_worker_resumed_between_reads_and_final_list_is_counted_and_placed(self):
        first = snapshot([thread('dispatch', title='Dispatch'), thread('bot-pool'), thread('arena-ui')], at='first')
        final = snapshot([thread('dispatch', title='Dispatch'), thread('brackets'), thread('bot-pool'), thread('arena-ui')])
        text, (page, stats) = self.board(self.live(first, final, workers=self.first_reads()))
        self.assertEqual(stats['activeWorkers'], 3)
        self.assertFalse(stats['activeIsLowerBound'])
        self.assertIn('3 running now', page)
        now = text.split('## Backlog')[0]
        self.assertIn('### demo-r.9:', now)
        self.assertIn('- State: execution: running; in_progress', now)
        self.assertIn('<span class="status">running</span>', page)
        self.assertTrue(any(w.startswith('demo-r.9: final list at final shows running') for w in stats['warnings']))

        reread = dict(self.first_reads(), **{'demo-r.9': {'runtime': 'running', 'verified': 'final', 'pendingInput': 0}})
        text, (page, stats) = self.board(self.live(first, final, workers=reread))
        self.assertEqual(stats['activeWorkers'], 3)
        self.assertFalse(any('final list' in w for w in stats['warnings']))

    def test_entry_list_alone_misses_the_resume(self):
        first = snapshot([thread('bot-pool'), thread('arena-ui')], at='first')
        page, stats = self.board(self.live(first, workers=self.first_reads()))[1]
        self.assertEqual(stats['activeWorkers'], 2)

    def test_worker_that_stopped_before_the_final_list_is_not_counted_running(self):
        final = snapshot([thread('bot-pool')])
        text, (page, stats) = self.board(self.live(final, workers=self.first_reads()))
        self.assertEqual((stats['activeWorkers'], stats['openWorkers']), (1, 3))
        self.assertIn('Runtime: not running at final check', text)

    def test_every_page_is_read_and_repeats_count_once(self):
        final = snapshot([thread('bot-pool'), thread('arena-ui')], [thread('arena-ui'), thread('brackets')])
        page, stats = self.board(self.live(final, workers=self.first_reads()))[1]
        self.assertEqual(stats['activeWorkers'], 3)
        self.assertTrue(stats['liveListComplete'])

    def test_unread_page_or_short_list_makes_the_count_a_lower_bound(self):
        unread = snapshot([thread('bot-pool'), thread('arena-ui')], [thread('brackets')])
        unread['pages'].pop()
        short = snapshot([thread('bot-pool'), thread('arena-ui')], total=3)
        for final, reason in ((unread, 'more pages not read'), (short, 'read 2 of 3 threads')):
            page, stats = self.board(self.live(final, workers=self.first_reads()))[1]
            self.assertTrue(stats['activeIsLowerBound'])
            self.assertFalse(stats['liveListComplete'])
            self.assertIn('at least 2 running now, total unknown', page)
            self.assertTrue(any(reason in w for w in stats['warnings']))

    def test_missing_or_failed_list_is_a_lower_bound_never_zero(self):
        for live in ({'verified': 'final', 'workers': {}},
                     self.live({'at': 'final', 'error': 't3_thread_list failed', 'pages': []})):
            page, stats = self.board(live)[1]
            self.assertTrue(stats['activeIsLowerBound'])
            self.assertIn('at least 0 running now, total unknown', page)

    def test_coordinator_is_excluded_and_one_thread_counts_once(self):
        issues = self.BASE + [worker_issue('demo-r.7', 'bot-pool'),
                              dict(worker_issue('demo-r.8', 'bot-pool'), metadata={'t3.link': 't3-thread://v1/bot-pool', 'board.visual': 'a | b'})]
        final = snapshot([thread('dispatch', title='Dispatch'), thread('bot-pool')], [thread('bot-pool')])
        text, (page, stats) = self.board(self.live(final), issues)
        self.assertEqual((stats['activeWorkers'], stats['openWorkers']), (1, 1))
        self.assertNotIn('Dispatch](', text)
        self.assertNotIn('not Coopers', text)
        self.assertIn('Live list: complete at final\n', text + '\n')

    def test_untracked_running_cooper_shows_in_now_and_other_threads_do_not(self):
        final = snapshot([thread('bot-pool'), thread('arena-ui'), thread('brackets'), thread('stray'),
                          thread('chat', title='Dan asks a question')])
        text, (page, stats) = self.board(self.live(final, workers=self.first_reads()))
        self.assertEqual(stats['activeWorkers'], 4)
        self.assertIn('cooper: stray', text.split('## Backlog')[0])
        self.assertIn('1 other active threads are not Coopers', text)
        self.assertNotIn('Dan asks a question', text)

    def test_cooper_owned_by_another_root_is_external_not_local(self):
        other = dict(worker_issue('other.1', 'theirs'), parent='other')
        final = snapshot([thread('bot-pool'), thread('theirs')])
        text, (page, stats) = self.board(self.live(final), self.BASE + [worker_issue('demo-r.7', 'bot-pool'), other])
        self.assertEqual(stats['activeWorkers'], 1)
        self.assertIn('outside this root', text.split('## Watch and links')[1])

    def test_without_beads_live_workers_still_render_with_the_graph_gap(self):
        final = snapshot([thread('dispatch', title='Dispatch'), thread('bot-pool'), thread('brackets', 'waiting')])
        text = board.beads_markdown(None, None, self.live(final), now=NOW)
        page, stats = board.render(text, ROOT)
        self.assertIn('Beads graph unavailable', text)
        self.assertEqual(stats['sections']['Now'], 2)
        self.assertEqual((stats['openWorkers'], stats['activeWorkers']), (2, 1))

        workers = {'idle-one': {'thread': 'idle-one', 'title': 'cooper: idle one', 'runtime': 'completed', 'verified': 'final'},
                   'gone': {'thread': 'gone', 'runtime': 'completed', 'verified': 'final', 'settled': True}}
        text = board.beads_markdown(None, None, self.live(final, workers=workers), now=NOW)
        page, stats = board.render(text, ROOT)
        self.assertEqual((stats['openWorkers'], stats['activeWorkers']), (3, 1))
        self.assertIn('cooper: idle one', text.split('## Backlog')[0])


if __name__ == '__main__':
    unittest.main()
