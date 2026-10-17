#!/bin/sh
# Run this edition in Synara beside the T3 Code edition, with no overlap.
#
#   scripts/synara-runtime.sh enable    build the Synara runtime and switch Synara's Codex to it
#   scripts/synara-runtime.sh disable   put Synara's Codex back on ~/.codex/skills and remove the runtime
#   scripts/synara-runtime.sh status    show what each side loads
#
# T3 Code keeps ~/.claude/skills and ~/.codex/skills (the main-branch edition); this script never touches them.
# Synara's Codex reads skills from its overlay home, ${SYNARA_HOME:-~/.synara-remote}/codex-home-overlay/skills.
# Synara refreshes overlay entries that are symlinks but leaves a real directory alone, so enable makes it one.
# Synara's Claude reads ~/.claude/skills like T3 does, so it launches through bin/claude instead, which drops the
# user skill folder (--setting-sources project,local) and loads this edition as a plugin. Point Synara at it in
# Settings > Providers > Claude > Binary path.
set -eu

EDITION=$(cd "$(dirname "$0")/.." && pwd -P)
RUNTIME="$HOME/.synara-skills"
PLUGIN="$RUNTIME/claude-plugin/synara"
WRAPPER="$RUNTIME/bin/claude"
OVERLAY_SKILLS="${SYNARA_HOME:-$HOME/.synara-remote}/codex-home-overlay/skills"
CODEX_SKILLS="${CODEX_HOME:-$HOME/.codex}/skills"

edition_skills() {
  for dir in "$EDITION"/*/; do
    [ -f "$dir/SKILL.md" ] && basename "$dir"
  done
}

is_edition_skill() {
  [ -f "$EDITION/$1/SKILL.md" ]
}

link_extras() {
  source_dir=$1 target_dir=$2
  [ -d "$source_dir" ] || return 0
  for entry in "$source_dir"/* "$source_dir"/.[!.]*; do
    [ -d "$entry" ] || continue
    name=$(basename "$entry")
    [ "$name" = synced ] && continue
    is_edition_skill "$name" && continue
    ln -sfn "$(cd "$entry" && pwd -P)" "$target_dir/$name"
  done
}

real_claude() {
  IFS=:
  for dir in $PATH; do
    [ "$dir/claude" = "$WRAPPER" ] && continue
    [ -x "$dir/claude" ] && { echo "$dir/claude"; return; }
  done
  echo "claude not found on PATH" >&2
  exit 1
}

build_plugin() {
  rm -rf "$RUNTIME/claude-plugin"
  mkdir -p "$PLUGIN/.claude-plugin" "$PLUGIN/skills"
  printf '{"name":"synara","version":"1.0.0","description":"Synara edition of dan-myles/skills"}\n' > "$PLUGIN/.claude-plugin/plugin.json"
  for skill in $(edition_skills); do
    ln -s "$EDITION/$skill" "$PLUGIN/skills/$skill"
  done
  link_extras "$HOME/.claude/skills" "$PLUGIN/skills"
}

build_wrapper() {
  mkdir -p "$RUNTIME/bin"
  cat > "$WRAPPER" <<EOF
#!/bin/sh
# Synara launches Claude through this file. Sessions (--input-format) load only the Synara edition;
# version probes and one-shot calls pass straight through.
case " \$* " in
  *" --input-format"*) exec "$(real_claude)" "\$@" --setting-sources project,local --plugin-dir "$PLUGIN" ;;
esac
exec "$(real_claude)" "\$@"
EOF
  chmod +x "$WRAPPER"
}

switch_codex() {
  parent=$(dirname "$OVERLAY_SKILLS")
  [ -d "$parent" ] || { echo "no Synara Codex overlay at $parent; start a Synara Codex thread once, then rerun" >&2; exit 1; }
  rm -rf "$OVERLAY_SKILLS"
  mkdir "$OVERLAY_SKILLS"
  for skill in $(edition_skills); do
    ln -s "$EDITION/$skill" "$OVERLAY_SKILLS/$skill"
  done
  link_extras "$CODEX_SKILLS" "$OVERLAY_SKILLS"
}

restore_codex() {
  if [ -d "$OVERLAY_SKILLS" ] && [ ! -L "$OVERLAY_SKILLS" ]; then
    rm -rf "$OVERLAY_SKILLS"
    ln -s "$CODEX_SKILLS" "$OVERLAY_SKILLS"
  fi
}

status() {
  echo "edition:        $EDITION ($(git -C "$EDITION" rev-parse --abbrev-ref HEAD 2>/dev/null) $(git -C "$EDITION" rev-parse --short HEAD 2>/dev/null))"
  if [ -L "$OVERLAY_SKILLS" ]; then
    echo "Synara Codex:   $OVERLAY_SKILLS -> $(readlink "$OVERLAY_SKILLS") (shared with T3)"
  elif [ -d "$OVERLAY_SKILLS" ]; then
    echo "Synara Codex:   $OVERLAY_SKILLS ($(ls -A "$OVERLAY_SKILLS" | wc -l | tr -d ' ') entries, own directory)"
  fi
  if [ -x "$WRAPPER" ]; then
    echo "Synara Claude:  set Settings > Providers > Claude > Binary path to $WRAPPER ($(ls "$PLUGIN/skills" | wc -l | tr -d ' ') skills)"
  else
    echo "Synara Claude:  not built"
  fi
  echo "T3 Claude:      $HOME/.claude/skills"
  echo "T3 Codex:       $CODEX_SKILLS"
}

case "${1:-status}" in
  enable)
    [ "$(git -C "$EDITION" rev-parse --abbrev-ref HEAD)" = synara-edition ] || { echo "$EDITION is not on synara-edition" >&2; exit 1; }
    build_plugin
    build_wrapper
    switch_codex
    status
    ;;
  disable)
    restore_codex
    rm -rf "$RUNTIME"
    echo "Synara Codex is back on $CODEX_SKILLS. Reset Synara's Claude binary path to: claude"
    ;;
  status) status ;;
  *) echo "usage: $0 [enable|disable|status]" >&2; exit 2 ;;
esac
