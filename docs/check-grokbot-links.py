import argparse
import re
import sys
import tempfile
import tomllib
from pathlib import Path
from shutil import copytree
from urllib.parse import unquote, urlsplit


GENERATED_OUTPUTS = {("personal-taste/references/imagery.md", "assets/credits.json")}


def read_manifest(path):
    with path.open("rb") as stream:
        return tomllib.load(stream)


def links(body):
    body = re.sub(r"^(`{3,}|~{3,}).*?^\1[^\n]*$", "", body, flags=re.M | re.S)
    for target in re.findall(r"\[[^\]]*\]\(([^\s)]+)\)", body):
        if not urlsplit(target).scheme and not target.startswith("#"):
            yield unquote(target.split("#")[0]), False
    for target in re.findall(r"`([^`\n]+)`", body):
        if re.match(r"^(?:\.\./|references/|scripts/|assets/|kit/)", target):
            if not re.search(r"[<>*{}\s]", target):
                yield target, not target.startswith("../")


def check(root):
    base = read_manifest(root / "loadout.toml")
    machine = read_manifest(root / "machines/grokbot.toml")
    skills = dict(base["skills"])
    for tag in base["machines"]["grokbot"]["tags"]:
        skills.update(read_manifest(root / "tags" / f"{tag}.toml").get("skills", {}))
    skills.update(machine.get("skills", {}))
    failures = set()
    checked = set()
    references = set()
    generated = set()
    with tempfile.TemporaryDirectory(prefix="grokbot-links-") as temporary:
        workflows = Path(temporary).resolve()
        for name, spec in skills.items():
            copytree(root / spec["source"], workflows / name)
        pending = list(workflows.glob("*/SKILL.md"))
        while pending:
            file = pending.pop()
            if file in checked:
                continue
            checked.add(file)
            for target, skill_relative in links(file.read_text()):
                if (str(file.relative_to(workflows)), target) in GENERATED_OUTPUTS:
                    generated.add((file.relative_to(workflows), target))
                    continue
                references.add((file.relative_to(workflows), target))
                base_dir = workflows / file.relative_to(workflows).parts[0] if skill_relative else file.parent
                resolved = (base_dir / target).resolve()
                if not resolved.is_relative_to(workflows) or not resolved.exists():
                    failures.add((str(file.relative_to(workflows)), target))
                elif resolved.is_file() and resolved.suffix == ".md":
                    pending.append(resolved)
    print("machine: grokbot")
    print("enabled agents:", ", ".join(machine["agents"]["enabled"]))
    print("selected skills:", len(skills))
    print("instruction files checked:", len(checked))
    print("relative references checked:", len(references))
    print("generated output references skipped:", len(generated))
    print("unavailable relative references:", len(failures))
    for file, target in sorted(failures):
        print(f"FAIL {file} -> {target}")
    return bool(failures)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    sys.exit(check(parser.parse_args().root.resolve()))
