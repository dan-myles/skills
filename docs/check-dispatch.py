import re
import runpy
import sys
import tempfile
import tomllib
from pathlib import Path
from shutil import copytree

import yaml


ROOT = Path(__file__).resolve().parents[1]
LINKS = runpy.run_path(str(ROOT / 'docs/check-grokbot-links.py'))['links']


def manifest(path):
    return tomllib.loads(path.read_text())


def check(root):
    shared = manifest(root / 'loadout.toml')['skills']
    coding = {**shared, **manifest(root / 'tags/development.toml')['skills']}
    dispatch = {'dispatch', 'dispatch-setup', 'dispatch-decompose', 'dispatch-chase', 'dispatch-digest'}
    assert dispatch <= coding.keys()
    assert not dispatch & shared.keys()
    selected = dispatch | {'cooper', 'cooper-models', 'cooper-how', 'cooper-why', 'cooper-grill', 'cooper-architect', 'cooper-adversarial-review', 'cooper-no-comments', 'cooper-verify', 'cooper-improve', 'grokbot-fleet-control', 'grokbot-gs-crisp-support'}
    failures = []
    checked = set()
    with tempfile.TemporaryDirectory(prefix='dispatch-links-') as temporary:
        deployed = Path(temporary).resolve()
        for name, spec in coding.items():
            copytree(root / spec['source'], deployed / name)
        pending = [deployed / name / 'SKILL.md' for name in selected]
        while pending:
            path = pending.pop()
            if path in checked:
                continue
            checked.add(path)
            for target, skill_relative in LINKS(path.read_text()):
                base = deployed / path.relative_to(deployed).parts[0] if skill_relative else path.parent
                resolved = (base / target).resolve()
                if not resolved.is_relative_to(deployed) or not resolved.exists():
                    failures.append(f'{path.relative_to(deployed)} -> {target}')
                elif resolved.is_file() and resolved.suffix == '.md':
                    pending.append(resolved)
    for name in sorted(selected):
        folder = root / coding[name]['source']
        header = re.match(r'^---\n(.*?)\n---', (folder / 'SKILL.md').read_text(), re.S)
        assert header, name
        metadata = yaml.safe_load(header.group(1))
        assert metadata['name'] == name
        ui = yaml.safe_load((folder / 'agents/openai.yaml').read_text())
        assert '$' + name in ui['interface']['default_prompt'], name
        assert isinstance(metadata['description'], str) and metadata['description']
        if name != 'grokbot-fleet-control':
            assert metadata['disable-model-invocation'] is True, name
            assert ui['policy']['allow_implicit_invocation'] is False, name
    for failure in sorted(set(failures)):
        print('FAIL', failure)
    print(f'coding skills: {len(coding)}; shared bot skills: {len(shared)}')
    print(f'checked {len(selected)} skill headers/UI files and {len(checked)} reachable instruction files')
    print(f'unavailable relative references: {len(set(failures))}')
    return bool(failures)


if __name__ == '__main__':
    sys.exit(check(Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT))
