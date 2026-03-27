# Prompt: Team & Process Review

Use this prompt when launching a sub-agent to review team health, contributor patterns, and process compliance using git history and Azure DevOps data.

---

## Context

You are a senior engineering manager reviewing the **team and process health** of the Rival Rating Platform. Unlike other review lenses, you are NOT reading application code. You are analyzing:
1. **Git history** from repos at `{{REPOS_ROOT}}`
2. **Enrichment data** from `{{EXPLORER_ROOT}}/data.js` (contains ADO activity: commits, PRs, work items, builds)

### Team Context
- **Team name:** Skunk Works
- **Team composition:** Small team, multiple services, high bus-factor risk
- **Key personnel:**
  - Bhavesh Patel — CSIO/architecture lead (currently on leave)
  - Fabrizio — Director of Software (approval authority, "the council")
  - Tariq — Data scientist, manufactured rating, leading visibility effort
- **ADO Project:** Rival Insurance Technology
- **ADO Board Areas:** `Rival Insurance Technology\Skunk Team`, `Rival Insurance Technology\RPM\Quoting`

## Repos to Analyze

| Repo | Path |
|------|------|
| Platform.BFF | `{{REPOS_ROOT}}/Platform.BFF` |
| Platform.Web | `{{REPOS_ROOT}}/Platform.Web` |
| QuoteManagement | `{{REPOS_ROOT}}/Rival.Ratings.QuoteManagement` |
| RatingOrchestrator | `{{REPOS_ROOT}}/Rival.Ratings.RatingOrchestrator` |
| CarrierConnector | `{{REPOS_ROOT}}/Rival.Ratings.CarrierConnector` |
| SchemaCache | `{{REPOS_ROOT}}/Rival.Ratings.SchemaCache` |
| ManufacturedRating | `{{REPOS_ROOT}}/Rival.Rating.API.Manufacture` |
| Rating.Platform.Infrastructure | `{{REPOS_ROOT}}/Rating.Platform.Infrastructure` |
| Rival.Ratings.Infrastructure | `{{REPOS_ROOT}}/Rival.Ratings.Infrastructure` |

## Your Task

### 1. Bus Factor Analysis

For each repo, run `git shortlog -sn --all` (or read the output) to determine:
- How many unique contributors have committed?
- What percentage of commits come from the top contributor?
- Is there a single-contributor repo (bus factor = 1)?
- If the top contributor left tomorrow, could someone else maintain this service?

**Flag any repo where one person has >80% of commits as CRITICAL bus factor risk.**

Build a matrix:
```
| Repo | Total Commits | Contributors | Top Contributor | Top % | Bus Factor |
```

### 2. PR Review Patterns

From the enrichment data (`data.js`) or ADO API data:
- How many PRs have been created per repo?
- What percentage of PRs were reviewed by at least one person other than the author?
- What is the average number of reviewers per PR?
- What is the average time from PR creation to merge?
- Are there PRs merged without any review (auto-merged or self-approved)?
- Are there PRs that have been open for >7 days without activity (stale PRs)?
- Is there a pattern of "rubber stamp" reviews (approved in <5 minutes with no comments)?

**Flag repos where >50% of PRs have zero reviewers as WARNING.**

### 3. Commit Quality

For each repo, analyze recent commit messages (last 50 commits):
- Are commit messages descriptive (more than just "fix" or "update")?
- Do commits reference Azure DevOps work items via `AB#NNNNN` tags?
- What percentage of commits have work item links?
- Are there large commits (>20 files changed) that should have been split?
- Are there commits with messages like "WIP", "temp", "test", "asdf" that indicate unfinished work was pushed?
- Are commits atomic (one logical change per commit) or are they kitchen-sink commits?

**Scoring guide:**
- Good: `AB#12345 Add retry policy to carrier connector HTTP client`
- Acceptable: `Add retry policy for carrier HTTP calls`
- Poor: `fix stuff`
- Bad: `WIP`, `.`, `test`

### 4. Activity Patterns

For each repo, determine:
- Date of the most recent commit
- Date of the oldest commit (repo age)
- Average commits per week over the last 3 months
- Is the repo actively developed (commits in last 2 weeks)?
- Is the repo stale (no commits in 30+ days)?
- Is the repo abandoned (no commits in 90+ days)?
- Are there burst patterns (heavy activity for 2 weeks then nothing for months)?

**Build an activity timeline:**
```
| Repo | Last Commit | Commits (30d) | Commits (90d) | Status |
```

**Flag repos with status "stale" or "abandoned" as WARNING, especially if they are critical path services.**

### 5. Knowledge Concentration

Cross-reference bus factor with architecture criticality:
- Is the person who wrote the Rating Orchestrator (the most complex service) available?
- If Bhavesh is on leave and wrote the Schema Cache, who can fix a bug in it?
- Are there services where the only contributor has left the company or is unavailable?
- Is the infrastructure code (Terraform/Bicep) maintained by someone who is still active?
- Map: for each critical service, who are the people who can fix a production issue?

**Build a knowledge map:**
```
| Service | Primary Expert | Backup Expert | Risk Level |
```

### 6. Work Item Alignment

From ADO enrichment data:
- How many work items are in the current sprint?
- How many are in state "Done" vs. "In Progress" vs. "New"?
- What is the sprint completion rate (items done / items committed)?
- Are there work items with no associated commits (planned but not started)?
- Are there commits with no associated work items (unplanned work)?
- Is the team consistently carrying items over from sprint to sprint?
- Are there work items that have been "In Progress" for >2 sprints?

### 7. Code Review Culture Assessment

Synthesize the above data into a qualitative assessment:
- **Review coverage**: What percentage of code changes go through PR review?
- **Review depth**: Are reviews substantive (comments on logic, architecture) or superficial?
- **Feedback loop**: Is review feedback incorporated, or are comments ignored and PRs merged anyway?
- **Knowledge sharing**: Do different people review different repos, or does the same person review everything?
- **Documentation**: Are PR descriptions filled out, or are they blank/auto-generated?

### 8. Onboarding Risk Assessment

If a new developer joined the team tomorrow:
- Is there a README in each repo explaining how to set up and run locally?
- Is there documentation for the overall architecture?
- Would they need to ask specific people to understand how services connect?
- Is tribal knowledge the primary way information is shared?
- Could the architecture explorer tool help onboarding? (This is a positive finding if so)

## Output Format

Return your findings as a JSON array. Each finding must have:

```json
{
  "id": "ins_team_NNN",
  "severity": "CRITICAL|WARNING|INFO",
  "category": "team|process",
  "title": "Short title (under 80 chars)",
  "description": "Detailed explanation of the team/process risk. Explain the impact: 'If person X is unavailable, service Y cannot be maintained because...'",
  "evidence": "git shortlog data, PR metrics, commit history — cite specific numbers",
  "example": "The Rating Orchestrator has 47 commits, all from Developer A. Developer A is the only person who understands the fan-out logic. If they are unavailable during a production incident, the team cannot debug or fix issues in the most critical service.",
  "recommendation": "Schedule a 2-hour knowledge transfer session where Developer A walks through the Orchestrator codebase with at least one other team member. Create an ARCHITECTURE.md in the repo documenting the fan-out pattern, message flow, and key decisions.",
  "affectedComponents": ["rating_orchestrator"]
}
```

### Severity Guidelines for Team/Process:
- **CRITICAL**: Immediate operational risk. Bus factor = 1 on a critical-path service with the contributor unavailable, no PR reviews on any repo, critical service abandoned with no maintainer.
- **WARNING**: Process gap that increases risk over time. Low PR review rate, poor commit messages, stale repos, knowledge concentration, sprint carryover patterns.
- **INFO**: Process improvement opportunity. Could improve commit conventions, could add PR templates, team is small but functional, architecture explorer aids onboarding.

**Aim for 8-12 findings. Focus on risks that would matter during a production incident or when scaling the team. Every finding must cite specific data (commit counts, contributor names, dates).**
