# Architecture Review System

## Overview

A multi-agent review system that analyzes the Rating Platform from 7 different lenses, then synthesizes findings into actionable insights. Each lens is a specialized review agent with a focused prompt.

## The 7 Review Lenses

### Lens 1: Code Quality Review
**Focus:** Individual repo code health
**Agent type:** Per-repo (runs 6 times, once per service)
**Prompt:** `prompts/01-repo-review.md`
**Looks for:**
- Logic errors, null reference risks, edge cases
- DI registration completeness
- Leftover template code, TODO/FIXME comments
- Code duplication, overly complex methods
- Test coverage gaps
- Logging quality (structured logging, correlation IDs)

### Lens 2: Integration & Contract Review
**Focus:** Cross-service communication contracts
**Agent type:** System-wide (runs once, reads all repos)
**Prompt:** `prompts/02-integration-review.md`
**Looks for:**
- Service Bus queue/topic name mismatches
- HTTP endpoint URL mismatches
- DTO field name/type mismatches between publisher and consumer
- Missing auth headers in cross-service calls
- Configuration inconsistencies (different namespaces, different DB names)

### Lens 3: Security Review
**Focus:** Authentication, authorization, secrets, input validation
**Agent type:** System-wide (runs once, reads all repos)
**Prompt:** `prompts/03-security-review.md`
**Looks for:**
- Missing UseAuthentication() / UseAuthorization() middleware
- Endpoints without auth checks
- Hardcoded secrets, API keys, or connection strings in code
- Missing input validation on public endpoints
- CORS misconfiguration
- Dependency vulnerabilities (known CVEs in NuGet packages)
- SQL/NoSQL injection risks
- Missing rate limiting

### Lens 4: Reliability & Resilience Review
**Focus:** Error handling, retry policies, circuit breakers, graceful degradation
**Agent type:** System-wide (runs once, reads all repos)
**Prompt:** `prompts/04-reliability-review.md`
**Looks for:**
- Missing try/catch on external calls
- Missing or disabled Polly retry policies
- No circuit breaker for downstream dependencies
- Service Bus message handling (complete/abandon/dead-letter patterns)
- Timeout configurations (are they set? are they reasonable?)
- Health check implementations (are they real or always-healthy stubs?)
- Graceful shutdown handling (IHostedService lifecycle)
- Idempotency (can messages be safely re-processed?)

### Lens 5: Deployment & Infrastructure Review
**Focus:** CI/CD readiness, Docker, Terraform/Bicep, environment configs
**Agent type:** System-wide (runs once, reads all repos + infra repos)
**Prompt:** `prompts/05-deployment-review.md`
**Looks for:**
- Missing CI/CD pipelines
- Dockerfile best practices (multi-stage, .dockerignore, non-root)
- Infrastructure gaps (provisioned vs. needed resources)
- Environment config completeness (dev, qa, prod all have values?)
- ACR target correctness (pushing to right container registry)
- Deployment dependency order
- Missing APIM gateway provisioning
- Secret management (Key Vault vs. config vs. env vars)

### Lens 6: Architecture & Design Review
**Focus:** Pattern compliance, SOLID principles, separation of concerns
**Agent type:** System-wide (runs once, reads key files from all repos)
**Prompt:** `prompts/06-architecture-review.md`
**Looks for:**
- Does implementation match the architecture diagram?
- Are boundaries respected (BFF has no business logic, etc.)?
- Is the fan-out pattern implemented correctly?
- Are domain models leaking across service boundaries?
- Is there unnecessary coupling between services?
- Could any service be simplified or merged?
- Are the right patterns used (Repository, Adapter, Strategy, etc.)?
- Is the data model appropriate (MongoDB vs SQL choices)?

### Lens 7: Team & Process Review
**Focus:** Bus factor, contributor patterns, PR hygiene, work item alignment
**Agent type:** System-wide (runs once, uses git + ADO data)
**Prompt:** `prompts/07-team-review.md`
**Looks for:**
- Bus factor per repo (single contributor risk)
- PR review quality (are PRs reviewed? by whom? how many comments?)
- Commit message quality (are they descriptive? linked to work items?)
- Work item alignment (is code being committed against the right tickets?)
- Stale repos (no activity in 30+ days)
- Sprint burndown patterns (are items completing or carrying over?)

---

## Execution Flow

```
Step 1: Pull Latest Code
  └── run-review.sh pulls/fetches all repos

Step 2: Launch Review Agents (parallel where possible)
  ├── Lens 1: Code Quality (6 agents, one per repo) ──┐
  ├── Lens 2: Integration (1 agent, reads all repos) ──┤
  ├── Lens 3: Security (1 agent, reads all repos) ─────┤
  ├── Lens 4: Reliability (1 agent, reads all repos) ──┤
  ├── Lens 5: Deployment (1 agent, reads all repos) ───┤
  ├── Lens 6: Architecture (1 agent, reads all repos) ─┤
  └── Lens 7: Team (1 agent, uses git + ADO data) ─────┤
                                                        │
Step 3: Synthesis Agent                                 │
  └── Reads ALL findings from all lenses ◄──────────────┘
      - Deduplicates overlapping findings
      - Prioritizes by blast radius (issues affecting more components rank higher)
      - Groups related findings into themes
      - Generates executive summary
      - Writes final insights-data.js

Step 4: Publish
  └── Commit + push to GitHub
```

## How to Run

### Full Review (weekly)
```
Tell Claude Code:
"Run a full architecture review following review/REVIEW_SPEC.md"

Claude Code will:
1. Read REVIEW_SPEC.md and review-config.json
2. Launch 12 agents (6 repo reviews + 6 system-wide reviews)
3. Collect all findings
4. Run synthesis to deduplicate and prioritize
5. Write insights-data.js
6. Commit and push
```

### Targeted Review (on-demand)
```
Tell Claude Code:
"Run a targeted review of Quote Management and its blast radius"

Claude Code will:
1. Read review-config.json for quote_mgmt blast radius
2. Launch Lens 1 for quote_mgmt only
3. Launch Lens 2 focusing on quote_mgmt connections
4. Synthesize and update insights for quote_mgmt only
```

### Quick Review (daily)
```
Tell Claude Code:
"Run a quick review - just check recent changes"

Claude Code will:
1. Check git diff for each repo (last 24 hours of commits)
2. Only review changed files
3. Run Lens 2 (integration) for affected connections
4. Append new findings to existing insights
```

---

## Synthesis Agent Rules

The synthesis agent combines findings from all lenses and applies these rules:

1. **Deduplication**: If Lens 1 and Lens 3 both find "no auth on endpoint X", keep the more detailed one
2. **Blast radius scoring**: A finding affecting 3+ components ranks higher than one affecting 1
3. **Severity escalation**: If a WARNING in one service is a dependency of a CRITICAL in another, escalate to CRITICAL
4. **Grouping**: Related findings get grouped (e.g., all "Service Bus mismatch" findings become one compound finding)
5. **Executive summary**: Generate a 3-sentence summary of the most important findings
6. **Trend tracking**: Compare against previous insights-data.js — mark findings as NEW, EXISTING, or RESOLVED

## Output Quality Standards

Every finding MUST have:
- A title a non-engineer can understand
- A description explaining WHY it matters (not just WHAT it is)
- Concrete evidence (file path + line number + what the code says)
- A concrete example ("When a broker submits a quote targeting 3 carriers...")
- A specific, actionable recommendation
- The blast radius (which other components are affected)
- A copyable ticket template for creating an ADO work item
