#!/usr/bin/env bash
# Leads for the ocd code pass; run at repo root.
set -u

MAX_SHOWN=25
MAX_LINES=200
SKIP_RE='(^|/)(dist|build|vendor|generated|__generated__|migrations)/|\.d\.ts$|\.min\.js$'
CODE_RE='\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|go|rb|rs|java|kt|swift|php|cs)$'
JS_RE='\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte)$'
TS_RE='\.(ts|tsx)$'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ocd: not a git repository" >&2
  exit 1
fi

code_files() {
  git ls-files -co --exclude-standard | grep -Ev "$SKIP_RE" | grep -E "$CODE_RE"
}

search() {
  local pattern="$1" only="${2:-$CODE_RE}"

  code_files | grep -E "$only" | tr '\n' '\0' | xargs -0 grep -nE "$pattern" 2>/dev/null
}

report() {
  local label="$1" output count

  output=$(cat)
  count=$(printf '%s' "$output" | grep -c '')

  if [ "$count" -eq 0 ]; then
    return 0
  fi

  echo "== $label ($count)"
  printf '%s\n' "$output" | head -n "$MAX_SHOWN"

  if [ "$count" -gt "$MAX_SHOWN" ]; then
    echo "... $((count - MAX_SHOWN)) more"
  fi
}

long_files() {
  code_files | while IFS= read -r file; do
    if [ -f "$file" ] && [ "$(wc -l <"$file")" -gt "$MAX_LINES" ]; then
      echo "$file: $(wc -l <"$file" | tr -d ' ') lines"
    fi
  done
}

run_audit() {
  code_files | grep -Ei '(^|/)(utils?|helpers?|common|misc|managers?)(/|\.[a-z]+$)' | report catchAll
  code_files | grep -E '(^|/)(service|controller|repository|model|types|constants|hooks|api)\.[a-z]+$' | report noDomainInName
  code_files | grep -E "$JS_RE" | grep -E '[^/]*([A-Z]|[a-z0-9]_[a-z0-9])[^/]*$' | report notKebabCase
  long_files | report overLimit
  search '\b(console\.(log|debug)|debugger)\b' | report debugCode
  search '\b(it|test|describe)\.(only|skip)\b|\bx(it|describe)\(' | report skippedTests
  search ':\s*any\b|\bas any\b|<any>|@ts-(ignore|nocheck)' "$TS_RE" | report looseTypes
  search '\b(TODO|FIXME|HACK)\b' | grep -Ev '(TODO|FIXME|HACK)\(' | report todoNoOwner
  search '^\s*//' "$JS_RE" | report lineComments
  search 'process\.env\.|os\.environ|os\.getenv' | grep -Eiv '(^|/)[^:]*(config|env)[^:/]*:' | report scatteredEnv
  git ls-files | grep -E '(^|/)\.env$' | report committedEnv
  git ls-files | grep -E '(^|/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?)$' | sed 's#.*/##' | sort -u | {
    output=$(cat)

    if [ "$(printf '%s' "$output" | grep -c '')" -gt 1 ]; then
      printf '%s\n' "$output" | report mixedLockfiles
    fi
  }
}

leads=$(run_audit)

if [ -z "$leads" ]; then
  echo "audit-code: 0 leads"
else
  printf '%s\n' "$leads"
fi
