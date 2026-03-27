# Architecture Review System

A multi-agent code review system that analyzes the Rival Insurance Rating Platform from 7 specialized perspectives ("lenses"), synthesizes findings across all of them, and outputs structured insights that feed into the architecture visualization dashboard.

The system is designed to be run by Claude Code. A human triggers a review by giving Claude Code a natural language instruction; Claude Code reads the prompt templates, fills in the relevant context, launches parallel review agents, and writes the results to `insights-data.js`.

---

## The 7 Review Lenses

Each lens is a focused review agent with its own prompt template in `prompts/`.

| # | Lens | Scope | Prompt | What It Finds |
|---|------|-------|--------|---------------|
| 1 | **Code Quality** | Per-repo (runs once per service) | `prompts/01-repo-review.md` | Logic errors, null reference risks, DI gaps, dead code, TODO/FIXME, test coverage gaps, logging quality |
| 2 | **Integration & Contracts** | System-wide (all repos) | `prompts/02-integration-review.md` | Service Bus queue name mismatches, HTTP endpoint URL drift, DTO field mismatches, missing auth headers, config inconsistencies |
| 3 | **Security** | System-wide | `prompts/03-security-review.md` | Missing auth middleware, unprotected endpoints, hardcoded secrets, input validation gaps, CORS issues, dependency CVEs, injection risks |
| 4 | **Reliability & Resilience** | System-wide | `prompts/04-reliability-review.md` | Missing retries/circuit breakers, Service Bus message handling patterns, timeout configs, health check stubs, graceful shutdown, idempotency |
| 5 | **Deployment & Infrastructure** | System-wide | `prompts/05-deployment-review.md` | Missing CI/CD pipelines, Dockerfile issues, infra gaps, environment config completeness, ACR targets, deployment ordering, secret management |
| 6 | **Architecture & Design** | System-wide | `prompts/06-architecture-review.md` | Diagram-vs-reality drift, boundary violations, fan-out correctness, domain model leakage, unnecessary coupling, pattern compliance |
| 7 | **Team & Process** | System-wide (git + ADO data) | `prompts/07-team-review.md` | Bus factor, PR review quality, commit message quality, work item alignment, stale repos, sprint burndown patterns |

---

## How to Run a Review

### Prerequisites

1. All source repos cloned under `/Users/tariqusama/Documents/azure_devops/knowledge/repos/`
2. An Azure DevOps Personal Access Token (optional, for ADO enrichment):
   ```bash
   export ADO_PAT='your-pat-here'
   ```

### Step 0: Prepare the Environment

Run the setup script to pull latest code, enrich ADO data, and print a summary:

```bash
cd /Users/tariqusama/Documents/azure_devops/architecture-explorer
./review/run-review.sh
```

This will:
- `git fetch --all --prune` and `git pull --ff-only` every repo
- Run `enrich-data.js` to pull fresh commits, PRs, work items, and build status from Azure DevOps (if `ADO_PAT` is set)
- Print a summary table of each repo (last commit date, total commits, active branches)
- Print the blast radius connection map from `review-config.json`
- Print the Claude Code commands for each review type

### Full Review (weekly cadence)

Tell Claude Code:

> "Run a full architecture review following review/REVIEW_SPEC.md"

Claude Code will:
1. Read `REVIEW_SPEC.md` and `review-config.json` to understand the system topology
2. Launch 12 parallel agents: 6 per-repo Code Quality agents + 6 system-wide lens agents
3. Collect structured findings from every agent
4. Run a Synthesis agent that deduplicates, prioritizes by blast radius, groups related findings, and generates an executive summary
5. Write the final output to `insights-data.js`
6. Commit and push to GitHub

### Quick Review (daily cadence)

Tell Claude Code:

> "Run a quick review of recent changes in the Rating Platform"

Claude Code will:
1. Check `git log --since='24 hours ago'` for each repo to find changed files
2. Run Code Quality review only on changed files
3. Run Integration review for connections affected by the changes
4. Append new findings to the existing `insights-data.js` (does not replace old findings)

### Targeted Review (on-demand)

Tell Claude Code:

> "Review Quote Management and its blast radius"

Claude Code will:
1. Look up `quote_mgmt` in `review-config.json` to find its blast radius (upstream: bff, rpm_client; downstream: orchestrator, schema_cache)
2. Run Code Quality review on Quote Management
3. Run Integration review focusing on Quote Management's connections
4. Run relevant system-wide lenses scoped to the affected services
5. Synthesize and update insights for the affected scope only

---

## How the Prompts Work

Each prompt template in `prompts/` is a Markdown file with a structured format:

1. **Role definition** -- tells the agent what kind of reviewer it is
2. **Input specification** -- lists which files/repos the agent should read, with placeholders like `{{REPO_PATH}}` and `{{KEY_FILES}}`
3. **Review checklist** -- the specific things to look for (each lens has a different checklist)
4. **Output format** -- the exact JSON structure the agent must produce for each finding (severity, title, description, evidence, recommendation, blast radius, ticket template)

When Claude Code launches a review:
1. It reads the prompt template from `prompts/`
2. It reads `review-config.json` to get the list of repos, key files, and blast radius connections
3. It fills in the placeholders (repo paths, file lists, service names)
4. It launches sub-agents, each receiving the filled-in prompt as their instruction
5. Each agent reads the actual source code and produces structured findings

The prompt system is designed so that adding a new lens is as simple as adding a new `prompts/0N-*.md` file and referencing it in `REVIEW_SPEC.md`.

---

## How Findings Flow to the Dashboard

```
Review Agents (Lenses 1-7)
    each produce structured JSON findings
              |
              v
    Synthesis Agent
        - Deduplicates overlapping findings across lenses
        - Scores by blast radius (issues affecting 3+ components rank higher)
        - Escalates severity when linked findings compound
        - Groups related findings into themes
        - Compares against previous run to mark NEW / EXISTING / RESOLVED
        - Generates 3-sentence executive summary
              |
              v
    insights-data.js
        - A JS file that exports window.insightsData
        - Contains: findings[], executiveSummary, metadata (timestamp, lenses run)
        - Each finding has: severity, title, description, evidence[], recommendation,
          blastRadius[], ticketTemplate
              |
              v
    index.html (Architecture Explorer dashboard)
        - Loads insights-data.js alongside data.js
        - Renders findings in the Insights panel
        - Color-codes by severity (CRITICAL = red, WARNING = amber, INFO = blue)
        - Links findings to affected nodes on the architecture diagram
        - Shows trend indicators (new, existing, resolved) when previous data exists
```

---

## File Structure

```
review/
  REVIEW_SPEC.md        -- Master specification (lenses, execution flow, synthesis rules)
  review-config.json    -- Service registry, key files, blast radius map
  run-review.sh         -- Environment prep script (pull repos, enrich data, print summary)
  README.md             -- This file
  prompts/
    01-repo-review.md         -- Lens 1: Code Quality (per-repo)
    02-integration-review.md  -- Lens 2: Integration & Contracts
    03-security-review.md     -- Lens 3: Security
    04-reliability-review.md  -- Lens 4: Reliability & Resilience
    05-deployment-review.md   -- Lens 5: Deployment & Infrastructure
    06-architecture-review.md -- Lens 6: Architecture & Design
    07-team-review.md         -- Lens 7: Team & Process
```

---

## Configuration: review-config.json

The config file defines:

- **`reposRoot`** -- absolute path to the directory containing all cloned repos
- **`services`** -- map of service keys to their repo name, type (api/worker/webapp), and key files to review
- **`blastRadius`** -- for each service, its upstream callers, downstream dependencies, data stores, infrastructure, and contract details (queue names, endpoints, headers)

The blast radius data is what allows the system to scope targeted reviews and to score findings by how many components they affect.
