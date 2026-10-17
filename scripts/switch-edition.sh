#!/bin/sh
# Switch which edition Claude and Codex load, using each library's skills-manager preset.
# Both apps read the same skill folders, so this flips T3 Code and Synara together.
#
#   scripts/switch-edition.sh synara   deploy this edition, undeploy the T3 one
#   scripts/switch-edition.sh t3       deploy the T3 edition, undeploy this one
#   scripts/switch-edition.sh status   show which edition is live
set -eu

CLI="${SKILLS_MANAGER_CLI:-$HOME/.local/bin/skills-manager-cli}"
T3_ROOT="${T3_SKILLS_ROOT:-$HOME/Developer/personal/skills}"
SYNARA_ROOT="${SYNARA_SKILLS_ROOT:-$HOME/Developer/personal/skills-synara}"
PRESET="${EDITION_PRESET:-Default}"

preset() {
  "$CLI" --skills-root "$1" presets "$2" "$PRESET" --agent claude_code --agent codex >/dev/null
}

switch_to() {
  from=$1 to=$2
  preset "$from" undeploy
  if ! preset "$to" deploy; then
    preset "$from" deploy
    echo "deploy from $to failed; restored $from" >&2
    exit 1
  fi
}

status() {
  for dir in "$HOME/.claude/skills" "$HOME/.codex/skills"; do
    target=$(readlink "$dir/bob" 2>/dev/null || echo "none")
    case "$target" in
      "$SYNARA_ROOT"/*) edition=synara ;;
      "$T3_ROOT"/*) edition=t3 ;;
      *) edition="unknown ($target)" ;;
    esac
    echo "$dir: $edition"
  done
}

case "${1:-status}" in
  synara) switch_to "$T3_ROOT" "$SYNARA_ROOT"; status ;;
  t3) switch_to "$SYNARA_ROOT" "$T3_ROOT"; status ;;
  status) status ;;
  *) echo "usage: $0 [synara|t3|status]" >&2; exit 2 ;;
esac
