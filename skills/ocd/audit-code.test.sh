#!/usr/bin/env bash
# Self-test for audit-code.sh; prints PASS or FAIL.
set -u

AUDIT="$(cd "$(dirname "$0")" && pwd)/audit-code.sh"
REPO=$(mktemp -d)
trap 'rm -rf "${REPO:?}"' EXIT

cd "$REPO" || exit 1
git init -q
mkdir -p src/utils src/features/orders
printf '// narrate\nconsole.log(1)\nconst a: any = 1\n/* TODO fix */\nprocess.env.API_URL\n' >src/utils/App.ts
printf 'it.only("x", () => {})\n' >src/features/orders/orders.test.ts
printf '/* TODO(#1): owned */\nexport const x = 1\n' >src/features/orders/order-rules.ts
seq 1 201 >src/features/orders/api.ts
touch .env package-lock.json yarn.lock
git add -A

output=$(bash "$AUDIT")
failed=0

expect() {
  if ! printf '%s\n' "$output" | grep -q "$1"; then
    echo "missing: $1"
    failed=1
  fi
}

reject() {
  if printf '%s\n' "$output" | grep -q "$1"; then
    echo "unexpected: $1"
    failed=1
  fi
}

for label in catchAll noDomainInName notKebabCase overLimit debugCode skippedTests looseTypes \
  todoNoOwner lineComments scatteredEnv committedEnv mixedLockfiles; do
  expect "== $label"
done
reject 'order-rules.ts'

CLEAN=$(mktemp -d)
trap 'rm -rf "${REPO:?}" "${CLEAN:?}"' EXIT
cd "$CLEAN" || exit 1
git init -q
output=$(bash "$AUDIT")
expect 'audit-code: 0 leads'

if [ "$failed" -eq 0 ]; then
  echo PASS
else
  echo FAIL
  printf '%s\n' "$output"
  exit 1
fi
