#!/usr/bin/env python3
"""Check Bob's models files against a saved synara_capabilities result.

usage: check_models.py CAPABILITIES_JSON MODELS_YAML [MORE_YAML ...] [--skills-root DIR]

Later YAML files override earlier ones line by line, so pass the built-in default first,
then the user's file, then a repo override. Exits 1 when any entry is invalid.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

PROMPT_ALTERING = {"ultracode", "ultrathink", "ultra"}
MIXED_PANELS = ("bob-adversarial-review.reviewers", "bob-improve.eval-candidates")
OTHER_FAMILY = (("bob.verifier", "threads.bob"), ("bob-no-comments.sicko", "bob.workers"))


def load_yaml(path):
    try:
        import yaml
        return yaml.safe_load(Path(path).read_text())
    except ImportError:
        pass
    if not shutil.which("ruby"):
        sys.exit("needs PyYAML or ruby to parse YAML")
    out = subprocess.run(
        ["ruby", "-ryaml", "-rjson", "-e", "puts JSON.dump(YAML.safe_load(File.read(ARGV[0])))", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def load_capabilities(path):
    data = json.loads(Path(path).read_text())
    if isinstance(data, list):
        data = json.loads(next(part["text"] for part in data if part.get("type") == "text"))
    if isinstance(data, dict) and "providers" not in data and isinstance(data.get("text"), str):
        data = json.loads(data["text"])
    return data


def merged_lines(files):
    lines = {}
    for path in files:
        doc = load_yaml(path) or {}
        for section, entries in doc.items():
            if not isinstance(entries, dict):
                continue
            for name, value in entries.items():
                lines[f"{section}.{name}"] = value
    return lines


def entries_of(value):
    if value == "inherit":
        return []
    return value if isinstance(value, list) else [value]


def allowed_options(caps, provider, model):
    construction = caps.get("targetConstruction", {}).get(provider, {})
    options = (construction.get("optionsByModel") or {}).get(model) or construction.get("providerOptions") or []
    return {o["key"]: o for o in options}


def check_entry(caps, line, entry, errors, warnings, aliases):
    providers = {p["provider"]: p for p in caps.get("providers", [])}
    provider, model = entry.get("provider"), entry.get("model")
    p = providers.get(provider)
    if p is None:
        errors.append(f"{line}: provider {provider!r} is not in the catalog")
        return
    if not p.get("available"):
        errors.append(f"{line}: provider {provider!r} is not available ({p.get('error', 'no reason given')})")
        return
    slugs = {m["slug"]: m for m in p.get("models", [])}
    if model not in slugs:
        errors.append(f"{line}: model {model!r} is not a {provider} slug; listed: {', '.join(slugs)}")
        return
    allowed = allowed_options(caps, provider, model)
    for key, value in (entry.get("options") or {}).items():
        option = allowed.get(key)
        if option is None:
            errors.append(f"{line}: option {key!r} is not offered for {provider}/{model}")
        elif not option.get("allowsCustomValue") and option.get("allowedValues") and value not in option["allowedValues"]:
            errors.append(f"{line}: {key}={value!r} is not offered for {provider}/{model}: {option['allowedValues']}")
        if value in PROMPT_ALTERING:
            warnings.append(f"{line}: {key}={value!r} starts more agents or changes the prompt; Bob skips it")
    resolved = slugs[model].get("resolvedModel")
    if resolved and resolved != model:
        aliases[f"{provider}/{model}"] = resolved


def providers_of(lines, line):
    return [e.get("provider") for e in entries_of(lines.get(line, []))]


def named_lines(skills_root):
    pattern = re.compile(r"`((?:bob|frank)[a-z-]*|threads)\.([a-z][a-z-]*)`")
    found, texts = {}, {}
    for md in Path(skills_root).glob("*/**/*.md"):
        text = md.read_text(errors="ignore")
        texts.setdefault(md.relative_to(skills_root).parts[0], []).append(text)
        for section, name in pattern.findall(text):
            found.setdefault(f"{section}.{name}", md.relative_to(skills_root))
    return found, texts


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("capabilities")
    parser.add_argument("models", nargs="+")
    parser.add_argument("--skills-root")
    args = parser.parse_args()

    caps = load_capabilities(args.capabilities)
    lines = merged_lines(args.models)
    errors, warnings, aliases = [], [], {}

    for line, value in lines.items():
        for entry in entries_of(value):
            check_entry(caps, line, entry, errors, warnings, aliases)

    designers = providers_of(lines, "bob-architect.designers")
    if len(designers) != 2 or len(set(designers)) != 2:
        errors.append(f"bob-architect.designers: needs exactly two entries from different providers, has {designers}")
    for panel in MIXED_PANELS:
        if len(set(providers_of(lines, panel))) < 2:
            warnings.append(f"{panel}: doesn't mix providers")
    for checker, checked in OTHER_FAMILY:
        if set(providers_of(lines, checker)) & set(providers_of(lines, checked)):
            warnings.append(f"{checker}: same provider as {checked}, which it checks")

    if args.skills_root:
        named, texts = named_lines(args.skills_root)
        for line, where in sorted(named.items()):
            if line not in lines:
                errors.append(f"{line}: named in {where} but has no line")
        for line in sorted(lines):
            section, name = line.split(".", 1)
            short = f"`{name}`"
            if line not in named and not any(short in t for t in texts.get(section, [])):
                warnings.append(f"{line}: no skill names this line")

    for alias, resolved in sorted(aliases.items()):
        print(f"NOTE  {alias} resolves to {resolved} today")
    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"{len(lines)} lines, {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
