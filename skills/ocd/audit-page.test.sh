#!/usr/bin/env bash
# Self-test for audit-page.sh; prints PASS or FAIL.
set -u

AUDIT="$(cd "$(dirname "$0")" && pwd)/audit-page.sh"
SITE=$(mktemp -d)
PORT=$(python3 -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
BASE="http://127.0.0.1:$PORT"

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$SITE" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; wait "$SERVER" 2>/dev/null; rm -rf "${SITE:?}"' EXIT

cat >"$SITE/good.html" <<EOF
<html><head>
<meta property="og:title" content="Title">
<meta property="og:description" content="Text">
<meta content="$BASE/og.png" property="og:image">
<link rel="canonical" href="$BASE/good.html">
<link rel="shortcut icon" href="/icon.png">
</head></html>
EOF
touch "$SITE/og.png"
sed "s#good.html#login.html#" "$SITE/good.html" >"$SITE/login.html"

cat >"$SITE/bad.html" <<EOF
<html><head>
<meta name="robots" content="noindex">
<meta property="og:image" content="/og.png">
</head></html>
EOF

cat >"$SITE/lost.html" <<EOF
<html><head><meta property="og:image" content="$BASE/gone.png"></head></html>
EOF

for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -s -o /dev/null "$BASE/good.html" && break
  sleep 0.3
done

failed=0

expect() {
  if ! printf '%s\n' "$output" | grep -q "$1"; then
    echo "missing: $1"
    failed=1
  fi
}

output=$(bash "$AUDIT" "$BASE/good.html")
expect 'audit-page: 0 leads'

output=$(bash "$AUDIT" "$BASE/login.html")
expect 'audit-page: 0 leads'

output=$(bash "$AUDIT" "$BASE/bad.html")
expect 'missingTag: og:title'
expect 'missingTag: canonical'
expect 'missingTag: favicon'
expect 'noindex: robots meta tag'
expect 'ogImage: not a full URL'

output=$(bash "$AUDIT" "$BASE/lost.html")
expect 'ogImage: .*gone.png returned 404'

output=$(bash "$AUDIT" "$BASE/missing.html")
expect 'blocked: returned 404'

if [ "$failed" -eq 0 ]; then
  echo PASS
else
  echo FAIL
  printf '%s\n' "$output"
  exit 1
fi
