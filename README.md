# skills

Personal agent skills for development workflow.

## Install

```bash
# Install all skills
npx skills add zainzafar/skills

# Install a specific skill
npx skills add zainzafar/skills --skill react-craft
```

## Skills

| Skill | What it does |
|---|---|
| **react-craft** | Naming conventions, component structure, test-first development, route-colocated architecture, file size discipline |

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

## Adding new skills

Create a folder under `skills/` with a `SKILL.md`:

```
skills/
└── my-new-skill/
    └── SKILL.md
```

Then add it to `.claude-plugin/marketplace.json`.
