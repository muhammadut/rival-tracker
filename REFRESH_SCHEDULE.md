# Data Refresh Schedule

## Daily (every morning before standup)
These change frequently and are cheap to pull.

| Data | Source | Script | Why daily |
|------|--------|--------|-----------|
| Recent commits (last 15 per repo) | Local git repos | `enrich-data.js` | Developers push code daily |
| Active work items + states | ADO Board API | `enrich-data.js` | Tickets move every day |
| PR activity + new comments | ADO Git API | `enrich-data.js` | PRs are opened/reviewed daily |
| Build status (last 5) | ADO Build API | `enrich-data.js` | CI runs on every push |
| Activity summaries | Generated from above | `enrich-data.js` | Derived from daily data |

**Command:** `export ADO_PAT='...' && node enrich-data.js`
**Time:** ~2 minutes

---

## Weekly (Monday morning or mid-week)
These require deeper analysis and are expensive (Claude Code sub-agents reading code).

| Data | Source | Method | Why weekly |
|------|--------|--------|-----------|
| Code review insights (bugs, risks) | Claude Code reading repos | Ask Claude Code | Code doesn't change drastically day-to-day |
| Health scores | Computed from insights + daily data | Claude Code | Scores shift gradually |
| Cross-component integration analysis | Claude Code cross-referencing repos | Ask Claude Code | Architecture doesn't change daily |
| Bus factor / contributor analysis | Git shortlog + commit patterns | Claude Code | Team composition is stable week-to-week |

**Command:** Tell Claude Code: "Refresh weekly insights for the architecture explorer"
**Time:** ~5-10 minutes (sub-agents reading code)

---

## Monthly (or on architecture changes)
These are expensive and rarely change.

| Data | Source | Method | Why monthly |
|------|--------|--------|------------|
| Story narratives | Deep repo analysis | Claude Code | Service history doesn't change often |
| "Educate" content (how it works) | Deep code reading | Claude Code | Architecture/code structure is stable |
| Architecture data (nodes, edges, connections) | Manual + Claude Code | Edit `data-base.js` | Only changes when services are added/removed |
| Dependency analysis (NuGet packages, configs) | Repo file reading | Claude Code | Dependencies updated rarely |
| Timeline phases | Git log analysis | Claude Code | Historical data doesn't change |

**Command:** Tell Claude Code: "Do a full deep-dive refresh of the architecture explorer"
**Time:** ~15-20 minutes

---

## On-demand (when something happens)
Trigger these manually when specific events occur.

| Trigger | What to refresh |
|---------|----------------|
| New service added to architecture | Update `data-base.js` nodes/edges, regenerate all |
| Major PR merged | Weekly insights for that specific service |
| Sprint planning / retro | Daily data + weekly insights |
| Presenting to executives | Full refresh (all layers) |
| New team member onboarding | Monthly content (educate sections) |
| Incident / outage | Daily + weekly for affected services |

---

## What NOT to regenerate

| Data | Frequency | Why |
|------|-----------|-----|
| `data-base.js` (static architecture) | Only on arch changes | Nodes/edges/meta are manually curated |
| WHAT_THIS_DOES descriptions | Only on arch changes | Hardcoded plain-English, rarely changes |
| View layouts / CSS / animations | Never (code changes only) | Part of the app, not data |

---

## Future: Automation Tiers

### Tier 1: Fully automated (no Claude needed)
- `enrich-data.js` on a cron or ADO pipeline
- Could run as an Azure Function on a timer trigger
- Outputs: commits, PRs, work items, builds, summaries

### Tier 2: Semi-automated (Claude API)
- `daily-review.js` calling Claude API
- Runs after Tier 1 completes
- Outputs: code insights, health scores
- Requires: Claude API key (Anthropic account)

### Tier 3: Manual (Claude Code interactive)
- Deep dives, story rewrites, educate content
- Best done interactively so you can guide the depth
- Outputs: narratives, educational content, architecture updates
