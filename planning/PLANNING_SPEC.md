# Planning Agent System

## Overview

The Planning system runs AFTER the Review system. It takes the review findings (insights-data.js) and generates actionable plans (actionplan-data.js). While the Review system identifies WHAT's wrong, the Planning system defines WHAT TO DO about it.

## Relationship to Review System

```
Review System (review/)          Planning System (planning/)
  ├── 7 lens agents                ├── 3 planning agents
  ├── Synthesis agent              ├── Prioritization agent
  └── Output: insights-data.js     └── Output: actionplan-data.js
        │                                │
        └───── Both feed into ───────────┘
                    │
              index.html
              (Insights tab + Action Plan tab + Dependencies tab)
```

## The 3 Planning Agents

### Agent 1: MVP Path Planner
**Prompt:** `prompts/01-mvp-planner.md`
**Input:** insights-data.js + review-config.json (blast radius)
**What it does:**
- Reads all CRITICAL and WARNING findings
- For each service, determines: what's the minimum set of fixes to get it to MVP state?
- Considers dependencies: "fixing A requires B to be fixed first"
- Generates ordered task lists with complexity estimates
- Produces the `services[id].mvpBlockers` array

### Agent 2: Dependency Analyzer
**Prompt:** `prompts/02-dependency-analyzer.md`
**Input:** data-base.js (architecture) + insights-data.js + actual code (appsettings, contracts)
**What it does:**
- Maps the actual runtime dependencies between services (queue names, HTTP URLs, shared databases)
- Verifies each dependency is healthy or broken
- Computes ripple effects: "if service X goes down, what breaks downstream?"
- Identifies deployment order constraints
- Produces dependency data and ripple effect descriptions

### Agent 3: System-Wide Critical Path
**Prompt:** `prompts/03-critical-path.md`
**Input:** Output from Agent 1 + Agent 2
**What it does:**
- Takes all per-service MVP blockers and dependency data
- Computes the system-wide critical path (what order to fix things)
- Identifies quick wins (config changes that take 5 minutes)
- Estimates total effort to reach MVP
- Groups related fixes that should be done together
- Produces the `systemMvpSummary` and `mvpCriticalPath`

## Execution Flow

```
Step 1: Review system produces insights-data.js (already done)

Step 2: Launch Planning Agents (sequential - each depends on prior)
  Agent 1: MVP Path Planner
    → Reads insights-data.js
    → For each service: what must be fixed for MVP?
    → Output: per-service mvpBlockers + postMvpImprovements

  Agent 2: Dependency Analyzer
    → Reads data-base.js + insights-data.js + appsettings from repos
    → Maps actual dependencies, verifies contracts, computes ripple effects
    → Output: blast radius data + ripple effects + contract details

  Agent 3: System-Wide Critical Path
    → Reads Agent 1 + Agent 2 output
    → Orders all fixes by dependency chain
    → Identifies quick wins
    → Computes total effort estimate
    → Output: systemMvpSummary + mvpCriticalPath + quickWins

Step 3: Write actionplan-data.js combining all outputs
```

## How to Run

### Full Planning (after review)
```
Tell Claude Code:
"Run the planning system following planning/PLANNING_SPEC.md"

Claude Code will:
1. Read the latest insights-data.js
2. Launch Agent 1 (MVP Path Planner) for each service
3. Launch Agent 2 (Dependency Analyzer)
4. Launch Agent 3 (Critical Path) with combined data
5. Write actionplan-data.js
6. Commit and push
```

### Targeted Planning (for one service)
```
Tell Claude Code:
"Generate an action plan for Quote Management and its dependencies"
```

### Quick Update (after code changes)
```
Tell Claude Code:
"Update the action plan - the Service Bus config was fixed in QuoteManagement"

Claude Code will:
1. Re-read QuoteManagement's appsettings.json
2. Verify the fix resolves the finding
3. Update the mvpBlockers (mark as resolved)
4. Recalculate the critical path
```

## Refresh Schedule
- **After every review cycle** (weekly): Full planning run
- **After significant code changes**: Targeted update
- **Before sprint planning**: Full planning run (gives the team their task list)
- **Before executive presentations**: Full planning run + verify data freshness
