# scripts/make-ai-logs.sh
#!/bin/bash
# Collects outputs from a curated list of cat-scripts and writes them to ai/*.log.
# Update the SCRIPTS array below to change which scripts are run.

set -euo pipefail

# ─── cat-scripts to execute (edit as needed) ────────────────────────────────────
SCRIPTS=(
  "cat-api.sh"
  "cat-context.sh"
  "cat-tree.sh"
  "cat-ui.sh"
)
# ────────────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AI_DIR="$ROOT_DIR/ai"
SCRIPTS_DIR="$ROOT_DIR/scripts"

mkdir -p "$AI_DIR"

for script_name in "${SCRIPTS[@]}"; do
  cat_script="$SCRIPTS_DIR/$script_name"
  if [[ ! -x "$cat_script" ]]; then
    echo "Warning: $script_name not found or not executable; skipping." >&2
    continue
  fi

  base="${script_name#cat-}"          # strip leading 'cat-'
  log_file="$AI_DIR/${base%.sh}.log"  # replace .sh with .log

  echo "Generating $log_file from $script_name..."
  bash "$cat_script" > "$log_file"
done

echo "Logs updated in $AI_DIR."
