# skills

Personal agent skills for development workflow.

## Install

```bash
# Install all skills
npx skills add zainzafar90/skills

# Install a specific skill
npx skills add zainzafar90/skills --skill react-standards
```

## Skills

| Skill | What it does |
|---|---|
| **react-standards** | Enforces React naming, component and route structure, state ownership, readability, and test-first development. |
| **ocd** | A last-mile perfection pass on screens and code: UI polish, folder structure, naming, API and web consistency, and leftovers. |
| **lean** | Cuts the current change down to the least code that works, strips comments that narrate the code, and applies the fixes. |
| **commit** | Makes one-line commits on a human-named branch with no Co-Authored-By or AI attribution, and strips attribution from commits not yet pushed. |
| **ship** | Takes a finished branch through review, UI checks, cleanup, commits, and a PR description in one run. |
| **pr-review** | Reviews a pull request read-only and reports at most five confirmed findings with ready-to-apply suggestion blocks. |
| **pr-description** | Writes a short, scannable PR title and description from the current branch, with optional before and after screenshots and video. |

`ship` runs `pr-review` → `browser-verify` (UI only) → `ocd` → `lean` → `commit` → `pr-description`.
`browser-verify` and the `*-standards` rule skills live in [zainzafar90/myelin](https://github.com/zainzafar90/myelin).

## Companion skills

These are third-party skills that pair well with the ones above. Install them separately:

```bash
# State & hooks discipline (Vercel — 57 rules)
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices

# Composition patterns (compound components, state lifting)
npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns

# State management decision framework
npx skills add wshobson/agents --skill react-state-management

# TDD workflow
npx skills add obra/superpowers --skill test-driven-development

# shadcn/ui component patterns
npx skills add giuseppe-trisciuoglio/developer-kit --skill shadcn-ui

# Tailwind v4 + shadcn setup
npx skills add jezweb/claude-skills --skill tailwind-v4-shadcn
```

## Credits

He's too shy to post his own work, so here's the guy behind the pr-review magic: [nomanr](https://github.com/nomanr).

## Adding new skills

Create a folder under `skills/` with a `SKILL.md`:

```
skills/
└── my-new-skill/
    └── SKILL.md
```

Then add it to `marketplace.json`.
