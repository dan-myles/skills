"""Behavior checks for portable board rendering, privacy and truthful counts."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('board', Path(__file__).with_name('render-board.py'))
board = importlib.util.module_from_spec(spec)
spec.loader.exec_module(board)
ROOT = Path('/tmp/dispatch-fixture')
EXAMPLE = (board.ASSETS / 'example-board.md').read_text()

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

if __name__ == '__main__':
    unittest.main()
