"""Check every declared skill: relative links resolve, and Cooper/Dispatch headers match their folders.

Run: uv run --with pyyaml python -I docs/check-skills.py
"""
import re
import sys
import tempfile
import tomllib
from pathlib import Path
from shutil import copytree
from urllib.parse import unquote, urlsplit

import yaml

ROOT = Path(__file__).resolve().parents[1]
GENERATED_OUTPUTS = {("personal-taste/references/imagery.md", "assets/credits.json")}


def links(body):
    body = re.sub(r"^(`{3,}|~{3,}).*?^\1[^\n]*$", "", body, flags=re.M | re.S)
    for target in re.findall(r"\[[^\]]*\]\(([^\s)]+)\)", body):
        if not urlsplit(target).scheme and not target.startswith("#"):
            yield unquote(target.split("#")[0]), False
    for target in re.findall(r"`([^`\n]+)`", body):
        if re.match(r"^(?:\.\./|references/|scripts/|assets/|kit/)", target) and not re.search(r"[<>*{}\s]", target):
            yield target, not target.startswith("../")


def declared(root):
    skills = {}
    for manifest in [root / "loadout.toml", *sorted((root / "tags").glob("*.toml"))]:
        skills.update(tomllib.loads(manifest.read_text()).get("skills", {}))
    return skills


def check(root):
    skills = declared(root)
    failures, checked = set(), set()
    with tempfile.TemporaryDirectory(prefix="skill-links-") as temporary:
        deployed = Path(temporary).resolve()
        for name, spec in skills.items():
            copytree(root / spec["source"], deployed / name)
        pending = list(deployed.glob("*/SKILL.md"))
        while pending:
            path = pending.pop()
            if path in checked:
                continue
            checked.add(path)
            relative = path.relative_to(deployed)
            for target, skill_relative in links(path.read_text()):
                if (str(relative), target) in GENERATED_OUTPUTS:
                    continue
                base = deployed / relative.parts[0] if skill_relative else path.parent
                resolved = (base / target).resolve()
                if not resolved.is_relative_to(deployed) or not resolved.exists():
                    failures.add(f"{relative} -> {target}")
                elif resolved.is_file() and resolved.suffix == ".md":
                    pending.append(resolved)
    manual = sorted(n for n in skills if n == "cooper" or n.startswith(("cooper-", "dispatch")))
    for name in manual:
        folder = root / skills[name]["source"]
        header = yaml.safe_load(re.match(r"^---\n(.*?)\n---", (folder / "SKILL.md").read_text(), re.S).group(1))
        ui = yaml.safe_load((folder / "agents/openai.yaml").read_text())
        assert header["name"] == name, name
        assert "$" + name in ui["interface"]["default_prompt"], name
        assert header["disable-model-invocation"] is True, name
        assert ui["policy"]["allow_implicit_invocation"] is False, name
    for failure in sorted(failures):
        print("FAIL", failure)
    print(f"declared skills: {len(skills)}; instruction files checked: {len(checked)}; manual-only headers checked: {len(manual)}")
    print(f"unavailable relative references: {len(failures)}")
    return bool(failures)


if __name__ == "__main__":
    sys.exit(check(Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT))
