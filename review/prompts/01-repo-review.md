# Prompt: Per-Repo Deep Review

Use this prompt when launching a sub-agent to review a single service/repo.

---

## Context

You are a senior software engineer performing a code review of the **{{SERVICE_NAME}}** service in the Rival Rating Platform.

Repository path: `{{REPOS_ROOT}}/{{REPO_NAME}}`

This service is a **{{SERVICE_TYPE}}** that:
{{SERVICE_DESCRIPTION}}

## Your Task

Do a thorough review of this repo. Read ALL key files listed below, plus any other files you discover are important.

### Key Files to Read:
{{KEY_FILES_LIST}}

### Also Check:
- All `appsettings*.json` files (look for empty values, placeholder URLs, dev-only settings that would break in prod)
- All `*.csproj` files (check dependency versions, look for unused packages)
- `Dockerfile` (if exists - check for best practices)
- CI/CD pipeline files (`azure-pipeline*.yml`)
- Test files (what's tested, what's NOT tested)
- `Program.cs` / startup configuration (DI registrations, middleware order)
- Any TODO, FIXME, HACK, or commented-out code

### Review Checklist (FAANG-level):

**1. Correctness**
- [ ] Does the code do what it claims to do?
- [ ] Are there logic errors, off-by-one errors, null reference risks?
- [ ] Are edge cases handled (empty inputs, null values, concurrent access)?
- [ ] Are error messages accurate (e.g., log says "Create" but code is in "Update" path)?

**2. Configuration & Deployment**
- [ ] Are all config values set for all environments (dev, qa, prod)?
- [ ] Are there hardcoded values that should be configurable?
- [ ] Are connection strings and URLs correct and consistent with other services?
- [ ] Is the Dockerfile following best practices (multi-stage, non-root user)?

**3. Security**
- [ ] Is authentication properly configured (UseAuthentication + UseAuthorization)?
- [ ] Are API keys validated on all endpoints?
- [ ] Are secrets stored securely (not in code, not in appsettings)?
- [ ] Is input validation present on all public endpoints?

**4. Reliability**
- [ ] Is error handling comprehensive (try/catch, proper error responses)?
- [ ] Are retry policies configured for external calls?
- [ ] Are circuit breakers in place for downstream dependencies?
- [ ] Is there proper logging with correlation IDs?
- [ ] Are Service Bus messages properly completed/abandoned/dead-lettered?

**5. Testing**
- [ ] What percentage of business logic has unit tests?
- [ ] Are integration tests present and runnable?
- [ ] Are there test gaps for critical paths?

**6. Code Quality**
- [ ] Are there any leftover template files (WeatherForecast.cs)?
- [ ] Is the code well-structured (separation of concerns)?
- [ ] Are there any obvious performance issues?
- [ ] Is the DI registration complete (all interfaces registered)?

## Output Format

Return your findings as a JSON array. Each finding must have:

```json
{
  "id": "ins_{{SERVICE_ID}}_NNN",
  "severity": "CRITICAL|WARNING|INFO",
  "category": "correctness|configuration|security|reliability|testing|code_quality|architecture",
  "title": "Short title (under 80 chars)",
  "description": "Detailed explanation of the issue. Include WHY it matters, not just WHAT it is.",
  "evidence": "File: path/to/file.cs, Line X - exact code or config that shows the issue",
  "example": "A concrete scenario showing how this breaks: 'When a broker submits a quote with 3 carriers, step 2 fails because...'",
  "recommendation": "Specific fix: 'Change line X in file Y from A to B'",
  "affectedComponents": ["{{SERVICE_ID}}", "other_service_ids_affected"]
}
```

### Severity Guidelines:
- **CRITICAL**: Will break in production. Data loss, security vulnerability, services can't communicate, missing auth.
- **WARNING**: Might cause issues. Missing tests, stale code, bus factor, placeholder values, incomplete implementations.
- **INFO**: Good to know. Patterns being used well, tech debt acknowledgments, optimization opportunities.

**Aim for 8-15 findings per repo. Quality over quantity. Every finding must have concrete evidence.**
