# Prompt: Synthesis Agent — Findings Consolidation & Insight Generation

Use this prompt when launching the final synthesis agent that combines findings from all review lenses into a single, prioritized output.

---

## Context

You are the **synthesis agent** for the Rival Rating Platform architecture review. All review lenses have completed and produced their findings. Your job is to combine, deduplicate, prioritize, and format the final output.

You have:
1. **Findings from all lenses** (provided as JSON arrays below)
2. **Previous insights** from `{{EXPLORER_ROOT}}/insights-data.js` (for trend tracking)
3. **Architecture data** from `{{EXPLORER_ROOT}}/data-base.js` (component IDs and connections)

## Inputs

### Lens Findings (provided by the orchestrator)

{{LENS_1_FINDINGS}}
{{LENS_2_FINDINGS}}
{{LENS_3_FINDINGS}}
{{LENS_4_FINDINGS}}
{{LENS_5_FINDINGS}}
{{LENS_6_FINDINGS}}
{{LENS_7_FINDINGS}}

### Previous Insights

{{PREVIOUS_INSIGHTS_JS}}

## Your Task

### Step 1: Deduplication

Multiple lenses may find the same issue. Deduplicate using these rules:

1. **Exact duplicates**: Same file, same line, same issue — keep the one with better description and evidence. Prefer the lens that specializes in that category (e.g., keep the security lens finding over the repo review finding for an auth issue).

2. **Overlapping findings**: Same root cause surfaced differently. For example:
   - Lens 1 (repo review): "QuoteManagement has no retry policy configured"
   - Lens 4 (reliability): "No Polly retry on QuoteManagement HTTP client"
   These are the same finding. Merge them: keep the more detailed description, combine the evidence, credit both lenses.

3. **Related but distinct findings**: Same area but different issues. For example:
   - "Service Bus namespace mismatch between QuoteManagement and Orchestrator"
   - "Service Bus queue name mismatch between QuoteManagement and Orchestrator"
   These are distinct findings but should be grouped under the same theme. Keep both but link them.

### Step 2: Blast Radius Scoring

Score each finding by its blast radius — how many components are affected if this issue manifests in production:

- **Blast radius 1**: Issue affects only one service (e.g., missing tests in SchemaCache)
- **Blast radius 2-3**: Issue affects a pair or small chain (e.g., DTO mismatch between QuoteManagement and Orchestrator)
- **Blast radius 4+**: Issue affects the entire request flow (e.g., Service Bus namespace wrong — nothing works)

**Scoring formula:**
```
priority_score = severity_weight × blast_radius × recency_weight

severity_weight: CRITICAL=10, WARNING=5, INFO=1
blast_radius: count of affected components (1-7)
recency_weight: NEW=1.5, EXISTING=1.0, RESOLVED=0 (resolved items are kept for tracking but don't rank)
```

Sort findings by `priority_score` descending.

### Step 3: Thematic Grouping

Group related findings into themes. A theme is a systemic pattern that spans multiple findings. Examples:

- **"Service Bus Configuration Inconsistency"** — groups all namespace mismatches, queue name mismatches, and missing dead-letter handling
- **"No Production Deployment Path"** — groups missing CI pipelines, missing CD pipelines, incomplete Dockerfiles, and unprovisioned infrastructure
- **"Single Point of Failure Risk"** — groups bus factor issues, missing circuit breakers, and no partial failure handling
- **"Authentication Gaps"** — groups missing auth middleware, missing API key validation, and hardcoded secrets

Each theme should have:
- A theme title (human-readable, non-technical)
- A 1-sentence theme summary
- List of finding IDs that belong to this theme

### Step 4: Trend Tracking

Compare current findings against `{{PREVIOUS_INSIGHTS_JS}}`:

- **NEW**: Finding exists now but was NOT in the previous insights (new issue discovered)
- **EXISTING**: Finding exists now AND was in the previous insights with the same or similar evidence (known issue, not fixed)
- **RESOLVED**: Finding was in the previous insights but is NOT in the current findings (issue was fixed)

Match findings by:
1. Same `id` (exact match)
2. Same `category` + similar `title` (fuzzy match — use judgment)
3. Same `affectedComponents` + same `category` (likely the same issue even if described differently)

### Step 5: Executive Summary

Generate a 3-sentence executive summary:
- **Sentence 1**: Overall health assessment (e.g., "The Rating Platform has 4 critical integration issues that would prevent services from communicating in production.")
- **Sentence 2**: Highest-impact theme (e.g., "The most urgent concern is Service Bus misconfiguration — Quote Management and Rating Orchestrator cannot exchange messages because they target different namespaces and queue names.")
- **Sentence 3**: Positive progress or key recommendation (e.g., "Since the last review, 2 critical issues have been resolved. The team should prioritize the 3 remaining CRITICAL findings before any deployment attempt.")

### Step 6: Generate insights-data.js

Write the final output as a JavaScript file that exports the insights data. The file must be valid JavaScript that can be loaded by `index.html`.

**File format:**

```javascript
// Auto-generated by Architecture Review System
// Generated: {{TIMESTAMP}}
// Review lenses: repo-review, integration, security, reliability, deployment, architecture, team
// Findings: X total (Y critical, Z warning, W info)
// Trend: A new, B existing, C resolved

const insightsData = {
  meta: {
    generatedAt: "{{TIMESTAMP}}",
    lensesRun: ["01-repo-review", "02-integration", "03-security", "04-reliability", "05-deployment", "06-architecture", "07-team"],
    totalFindings: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    newCount: 0,
    existingCount: 0,
    resolvedCount: 0
  },

  executiveSummary: "Three sentences here.",

  themes: [
    {
      id: "theme_001",
      title: "Theme Title",
      summary: "One sentence summary of the theme.",
      findingIds: ["ins_sec_001", "ins_rel_003"],
      severity: "CRITICAL"  // highest severity among grouped findings
    }
  ],

  findings: [
    {
      id: "ins_sec_001",
      severity: "CRITICAL",
      category: "security",
      title: "Short title",
      description: "Detailed description",
      evidence: "File: path — evidence",
      example: "Concrete scenario",
      recommendation: "Specific fix",
      affectedComponents: ["bff", "quote_mgmt"],
      blastRadius: 2,
      priorityScore: 30,
      trend: "NEW",
      themeId: "theme_001",
      lens: "03-security"
    }
  ],

  resolved: [
    {
      id: "ins_old_001",
      title: "Previously found issue that is now fixed",
      resolvedSince: "{{TIMESTAMP}}",
      previousSeverity: "WARNING"
    }
  ]
};
```

## Quality Checks Before Output

Before writing the final `insights-data.js`, verify:

1. **No duplicate IDs**: Every finding has a unique `id`
2. **Valid references**: Every `themeId` in a finding matches a theme in the `themes` array
3. **Valid components**: Every item in `affectedComponents` matches a component ID from `data-base.js`
4. **Consistent severity**: Themes inherit the highest severity of their grouped findings
5. **Sorted order**: Findings are sorted by `priorityScore` descending
6. **Counts match**: `meta.totalFindings` equals `findings.length`, severity counts are accurate
7. **Valid JavaScript**: The output file can be loaded by a browser without syntax errors
8. **Evidence is concrete**: Every finding has a file path and specific evidence — no vague statements

## Component ID Reference

Use these IDs in `affectedComponents` (must match `data-base.js`):
```
bff           → Platform.BFF
web           → Platform.Web
quote_mgmt    → Rival.Ratings.QuoteManagement
rating_orch   → Rival.Ratings.RatingOrchestrator
carrier_conn  → Rival.Ratings.CarrierConnector
schema_cache  → Rival.Ratings.SchemaCache
manufactured  → Rival.Rating.API.Manufacture
apim          → Azure API Management
servicebus    → Azure Service Bus
cosmosdb      → Azure CosmosDB
sql           → Azure SQL Database
infra_tf      → Rating.Platform.Infrastructure (Terraform)
infra_bicep   → Rival.Ratings.Infrastructure (Bicep)
```

## Output

Write the complete `insights-data.js` file content. It must be valid JavaScript, loadable by the architecture explorer's `index.html`, and contain every deduplicated, scored, grouped, and trend-tracked finding from all lenses.
