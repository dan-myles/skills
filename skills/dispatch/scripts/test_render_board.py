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
            'demo-r.3': {'runtime': 'idle', 'verified': 'now', 'settled': False}}}
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

if __name__ == '__main__':
    unittest.main()
