# Prompt: MVP Path Planner

## Context
You are a senior engineering manager creating an actionable plan to get each service in the Rival Rating Platform to MVP state.

**MVP Definition:** One insurance quote flows end-to-end: a broker fills out a form in RPM Client, submits it, the request reaches the Rating Orchestrator via Service Bus, gets routed to the Carrier Connector, a premium is calculated (simulator is acceptable), and the result is displayed back to the broker.

## Input
Read these files:
- `/Users/tariqusama/Documents/azure_devops/architecture-explorer/insights-data.js` (current findings)
- `/Users/tariqusama/Documents/azure_devops/architecture-explorer/review/review-config.json` (blast radius)

## Your Task

For each service (quote_mgmt, orchestrator, carrier_connector, schema_cache, rpm_client, bff, manufacture), determine:

### 1. Current State Assessment
Classify as: broken | degraded | functional | mvp-ready | not-started
- **broken**: Has CRITICAL findings that prevent basic operation
- **degraded**: Works partially but has issues that affect MVP flow
- **functional**: Works for MVP purposes, issues are post-MVP
- **mvp-ready**: No blockers for MVP
- **not-started**: No code exists

Write a 2-3 sentence explanation of why.

### 2. MVP Blockers (ordered by priority)
For each blocker:
- What needs to be fixed (specific file, specific change)
- Why it blocks MVP (what breaks without this fix)
- Complexity: small (config change, <30 min), medium (code change, 1-4 hours), large (significant work, 1+ days)
- Type: config | code | infrastructure | testing | security
- What it unblocks when fixed

### 3. Post-MVP Improvements
Things that should be fixed but don't block the first end-to-end quote from flowing.

### Rules
- Only mark something as an MVP blocker if it ACTUALLY prevents the end-to-end flow
- Security issues are WARNING for MVP unless they prevent the service from starting
- Missing tests are NOT MVP blockers
- Cosmetic issues (WeatherForecast.cs, log message typos) are NOT MVP blockers
- The simulator in CarrierConnector IS acceptable for MVP
- Manufactured Rating is NOT needed for MVP (direct rating only)

## Output Format
JSON object matching the ACTION_PLAN_DATA.services structure with: currentState, stateExplanation, mvpBlockers[], postMvpImprovements[]
