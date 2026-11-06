"""Check a README for broken anchors, missing paths, undefined scripts and em dashes. Usage: check_readme.py [README.md]"""

import json
import re
import sys
from pathlib import Path

PATH_PREFIXES = ("http://", "https://", "mailto:", "#", "//")
SCRIPT_RUNNERS = re.compile(r"`(?:pnpm|npm run|yarn)\s+([a-z0-9:_-]+)")
MAKE_TARGET = re.compile(r"`make\s+([a-z0-9_-]+)")
NON_SCRIPT_WORDS = {"install", "add", "dlx", "exec", "i", "create", "init", "remove", "update", "run", "x"}


def github_slug(heading: str) -> str:
    text = re.sub(r"<[^>]+>|[`*_~]", "", heading).strip().lower()
    text = re.sub(r"[^\w\- ]", "", text)
    return text.replace(" ", "-")


def broken_anchors(text: str) -> list[str]:
    slugs = {github_slug(h) for h in re.findall(r"^#{1,6} (.+)$", text, re.M)}
    return [a for a in re.findall(r"\]\(#([^)]+)\)", text) if a not in slugs]


def linked_paths(text: str) -> list[str]:
    targets = re.findall(r"\]\(([^)\s]+)\)", text) + re.findall(r'src="([^"]+)"', text)
    return [t.split("#")[0] for t in targets if t and not t.startswith(PATH_PREFIXES)]


def missing_paths(text: str, root: Path) -> list[str]:
    return sorted({p for p in linked_paths(text) if p and not (root / p).exists()})


def defined_scripts(root: Path) -> set[str]:
    manifest = root / "package.json"
    if not manifest.exists():
        return set()
    return set(json.loads(manifest.read_text()).get("scripts", {}))


def undefined_scripts(text: str, root: Path) -> list[str]:
    scripts = defined_scripts(root)
    if not scripts:
        return []
    used = {s for s in SCRIPT_RUNNERS.findall(text) if s not in NON_SCRIPT_WORDS}
    return sorted(used - scripts)


def undefined_make_targets(text: str, root: Path) -> list[str]:
    makefile = root / "Makefile"
    if not makefile.exists():
        return []
    source = makefile.read_text()
    targets = set(re.findall(r"^([a-zA-Z0-9_-]+):", source, re.M))
    generated = set(re.findall(r"addprefix ([a-zA-Z0-9_-]+),", source)) | set(re.findall(r"^([a-zA-Z0-9_-]+)%:", source, re.M))
    used = {t for t in MAKE_TARGET.findall(text) if not t.endswith("-")}
    return sorted(t for t in used - targets if not any(t.startswith(prefix) for prefix in generated))


def visible_lines(text: str) -> int:
    folded = re.sub(r"<details>.*?</details>", "", text, flags=re.S)
    return sum(1 for line in folded.splitlines() if line.strip())


def main() -> int:
    readme = Path(sys.argv[1] if len(sys.argv) > 1 else "README.md")
    if not readme.exists():
        print(f"error: {readme} not found")
        return 2
    text = readme.read_text()
    root = readme.resolve().parent
    problems = {
        "broken anchors": broken_anchors(text),
        "missing files": missing_paths(text, root),
        "undefined package scripts": undefined_scripts(text, root),
        "undefined make targets": undefined_make_targets(text, root),
        "em dashes (lines)": [str(i) for i, line in enumerate(text.splitlines(), 1) if "—" in line],
    }
    found = {k: v for k, v in problems.items() if v}
    for label, items in found.items():
        print(f"{label}: {', '.join(items)}")
    if not found:
        print("ok: no problems found")
    lines = visible_lines(text)
    note = " (aim for roughly 80-140; fold the rest into <details> or docs/)" if lines > 140 else ""
    print(f"length: {lines} non-blank lines outside <details>{note}")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
