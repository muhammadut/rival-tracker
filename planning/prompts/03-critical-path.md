# Prompt: System-Wide Critical Path Calculator

## Context
You are a project manager computing the fastest path from current state to MVP for the Rival Rating Platform.

## Input
- MVP blockers per service (from Agent 1 output)
- Dependency data and contract verification (from Agent 2 output)
- Review findings (insights-data.js)

## Your Task

### 1. Critical Path Ordering
Take all MVP blockers across all services and order them by:
1. Dependencies: if fix A requires fix B to exist first, B comes first
2. Blast radius: fixes that unblock more downstream work come first
3. Complexity: among equal-priority items, do small fixes first (quick wins)

### 2. Quick Wins
Identify fixes that:
- Take less than 15 minutes
- Unblock something meaningful
- Are pure config changes (no code review needed)

### 3. Effort Estimation
For the full MVP path:
- Total number of tasks
- Breakdown by complexity (small/medium/large)
- Rough time estimate assuming 1 developer

### 4. Parallel Work Opportunities
Which fixes can be done simultaneously by different people?
Group into work streams that don't conflict.

### 5. Risk Assessment
What are the risks to the MVP plan?
- What might take longer than estimated?
- What has unknown scope?
- What depends on people who are unavailable (Bhavesh on leave)?

## Output Format
JSON object with: criticalPathOrder (ordered list with time estimates), quickWins (list), effortEstimate, parallelStreams, risks

## Rules
- Be realistic about estimates - padding is better than optimism
- Consider that Bhavesh Patel is on leave and cannot do work
- The Manufactured Rating Engine is OUT OF SCOPE for MVP
- APIM provisioning is a DevOps task, not a developer task - flag it but don't block MVP on it
