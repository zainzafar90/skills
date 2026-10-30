#!/usr/bin/env bash
# Logged-out leads for public pages: share tags, indexing, TTFB.
set -u

MAX_TTFB=0.8
MAX_TIME=20
REQUIRED_TAGS='og:title og:description og:image'

if [ "$#" -eq 0 ]; then
  echo "usage: audit-page.sh <url>..." >&2
  exit 1
fi

lead() {
  echo "  $1: $2"
  leads=$((leads + 1))
}

tag_value() {
  printf '%s\n' "$1" | grep -iE "(property|name)=[\"']$2[\"']" | head -n 1 |
    sed -nE "s/.*content=[\"']([^\"']*)[\"'].*/\1/Ip"
}

check_tags() {
  local tags="$1" name value

  for name in $REQUIRED_TAGS; do
    value=$(tag_value "$tags" "$name")

    if [ -z "$value" ]; then
      lead missingTag "$name"
    fi
  done

  if ! printf '%s\n' "$tags" | grep -qiE "rel=[\"']canonical[\"']"; then
    lead missingTag canonical
  fi

  if ! printf '%s\n' "$tags" | grep -qiE "rel=[\"'][a-z ]*icon[\"']"; then
    lead missingTag favicon
  fi

  if printf '%s\n' "$tags" | grep -iE "name=[\"']robots[\"']" | grep -qi noindex; then
    lead noindex "robots meta tag"
  fi
}

check_og_image() {
  local image="$1" status

  if [ -z "$image" ]; then
    return 0
  fi

  case "$image" in
    https://* | http://*) ;;
    *)
      lead ogImage "not a full URL: $image"
      return 0
      ;;
  esac

  status=$(curl -sL -o /dev/null --max-time "$MAX_TIME" -w '%{http_code}' -- "$image")

  if [ "$status" != "200" ]; then
    lead ogImage "$image returned $status"
  fi
}

check_page() {
  local url="$1" body headers meta status ttfb final tags

  body=$(mktemp)
  headers=$(mktemp)
  meta=$(curl -sL --max-time "$MAX_TIME" -o "$body" -D "$headers" \
    -w '%{http_code} %{time_starttransfer} %{url_effective}' -- "$url")
  read -r status ttfb final <<<"$meta"
  echo "== $url ($status, ttfb ${ttfb:-?}s)"

  if [ "${status:-000}" = "000" ]; then
    lead blocked "could not reach the page"
  elif [ "$status" != "200" ]; then
    lead blocked "returned $status logged out"
  else
    if printf '%s' "$final" | grep -qiE '/(login|signin|sign-in|auth)\b'; then
      lead blocked "redirected to $final"
    fi

    if awk -v t="$ttfb" -v max="$MAX_TTFB" 'BEGIN { exit !(t > max) }'; then
      lead slowTtfb "${ttfb}s, one sample"
    fi

    if grep -qiE '^x-robots-tag:.*noindex' "$headers"; then
      lead noindex "X-Robots-Tag header"
    fi

    if grep -qiE '^content-type:.*html' "$headers"; then
      tags=$(tr '\n' ' ' <"$body" | grep -oiE '<(meta|link)[^>]+>')
      check_tags "$tags"
      check_og_image "$(tag_value "$tags" og:image)"
    fi
  fi

  rm -f "$body" "$headers"
}

leads=0

for url in "$@"; do
  case "$url" in
    https://* | http://*) check_page "$url" ;;
    *) echo "skipped, not an http URL: $url" >&2 ;;
  esac
done

echo "audit-page: $leads leads"
