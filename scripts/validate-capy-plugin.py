import argparse
import json
import re
from pathlib import Path
from urllib.request import urlopen

import jsonschema
import yaml


def validate(plugin, schema_dir=None):
    files = list(plugin.rglob("*"))
    assert not any(path.is_symlink() for path in files), "plugin contains a symlink"
    files = [path for path in files if path.is_file()]
    assert len(files) <= 2000, "plugin exceeds 2,000 files"
    size = sum(path.stat().st_size for path in files)
    assert size <= 20 * 1024 * 1024, "plugin exceeds 20 MiB"

    for name in ("plugin", "mcp"):
        if schema_dir:
            schema = json.loads((schema_dir / f"{name}.schema.json").read_text())
        else:
            url = (
                "https://raw.githubusercontent.com/agentplugins/"
                f"agent-plugins-spec/main/schemas/1.1.0/{name}.schema.json"
            )
            with urlopen(url, timeout=20) as response:
                schema = json.load(response)
        jsonschema.Draft202012Validator(schema).validate(
            json.loads((plugin / f"{name}.json").read_text())
        )
    assert json.loads((plugin / "mcp.json").read_text())["mcpServers"] == {}, "unexpected server"

    skill_dirs = sorted((plugin / "skills").iterdir())
    names = {path.name for path in skill_dirs}
    assert "bob" in names
    assert all(name == "bob" or name.startswith("bob-") for name in names), "non-Bob skill"
    assert len([name for name in names if name.startswith("bob-principle-")]) == 24
    defaults = yaml.safe_load((plugin / "skills/bob-models/models.example.yaml").read_text())
    for roles in defaults.values():
        for selection in roles.values():
            entries = selection if isinstance(selection, list) else [selection]
            assert entries, "empty model panel"
            for entry in entries:
                assert isinstance(entry, dict), "packaged defaults must select explicit models"
                assert set(entry) <= {"modelId", "reasoningMode", "modes"}, entry
                assert isinstance(entry["modelId"], str) and entry["modelId"], entry
                assert entry.get("reasoningMode") in {
                    "none", "instant", "minimal", "low", "medium", "high", "xhigh", "max"
                }, entry
                assert not entry["modelId"].startswith("anthropic/"), "Claude default bypasses subscription harness"
                modes = entry.get("modes", {})
                assert isinstance(modes, dict) and set(modes) <= {"fast", "pro", "ultrafast", "daybreak"}, entry
                assert all(type(value) is bool for value in modes.values()), entry

    for folder in skill_dirs:
        assert folder.is_dir() and re.fullmatch(r"[a-z0-9-]{1,64}", folder.name), folder
        entry = folder / "SKILL.md"
        text = entry.read_text()
        assert text.startswith("---\n"), entry
        metadata = yaml.safe_load(text.split("---", 2)[1])
        assert metadata["name"] == folder.name, entry
        description = metadata["description"]
        assert isinstance(description, str) and 0 < len(description.strip()) <= 1024, entry
        assert metadata.get("disable-model-invocation") is True, entry

        for path in folder.rglob("*.md"):
            text = path.read_text()
            forbidden = r"\bT3\b|t3_|delegate_task|watch_pull_request|orchestrator_capabilities|providerInstanceId|\.bob-n-frank|\bdispatch\b|\bfrank\b|fleet-control|personal-"
            assert not re.search(forbidden, text, re.I), f"foreign runtime in {path}"
            for target in re.findall(r"`([^`\n]+)`", text):
                if any(char in target for char in ("<", ">", "*", " ", "|")):
                    continue
                if target.startswith(("../", "references/", "playbooks/")) and target.endswith((".md", ".yaml", ".html")):
                    resolved = (folder / target).resolve()
                    assert resolved.is_relative_to((plugin / "skills").resolve()), (path, target)
                    assert resolved.is_file(), f"missing reference in {path}: {target}"
            for group, role in re.findall(r"`(bob(?:-[a-z]+)?)\.([a-z-]+)`", text):
                if group in defaults:
                    assert role in defaults[group], f"missing model role in {path}: {group}.{role}"
        if folder.name.startswith("bob-principle-"):
            trigger = folder.name.removeprefix("bob-principle-")
            assert f"`{trigger}`" in (plugin / "skills/bob/SKILL.md").read_text(), folder

    print(f"PASS: schemas, {len(names)} Bob skills, 24 principles, references, roles, and runtime exclusions")
    print(f"PASS: {len(files)} files, {size:,} bytes; no symlinks or MCP servers")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--plugin", type=Path, default=Path(__file__).resolve().parents[1] / "capy")
    parser.add_argument("--schema-dir", type=Path)
    args = parser.parse_args()
    validate(args.plugin, args.schema_dir)
