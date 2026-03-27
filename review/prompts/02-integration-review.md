# Prompt: Cross-Component Blast Radius Review

Use this prompt when launching a sub-agent to review how services integrate and where breaking changes propagate.

---

## Context

You are a senior architect reviewing the **integration health** of the Rival Rating Platform. You have access to all repos at `{{REPOS_ROOT}}`.

The system has this data flow:
```
RPM Client → BFF → Quote Management → Service Bus → Rating Orchestrator → Carrier Connector → Insurance Carriers
```

## Blast Radius Map

{{BLAST_RADIUS_JSON}}

## Your Task

For each pair of connected services, verify that their contracts actually match. This means:

### 1. Service Bus Contract Verification
For each queue/topic that connects two services:

**Check publisher side:**
- What queue name does the publisher use? (from appsettings.json)
- What message type does it serialize? (from the code that publishes)
- What fields are in the message? (from the DTO/model class)

**Check consumer side:**
- What queue name does the consumer listen on? (from appsettings.json)
- What message type does it deserialize to? (from the code that consumes)
- What fields does it expect? (from the DTO/model class)

**Verify match:**
- Do the queue names match exactly?
- Do the Service Bus namespace URLs match?
- Do the message schemas align (same field names, same types)?
- If publisher adds a new field, does consumer ignore it gracefully or crash?

### 2. HTTP Contract Verification
For each HTTP call between services:

**Check caller side:**
- What URL does it call? (from HttpClient config or appsettings)
- What HTTP method and path?
- What request body does it send? (from the DTO)
- What headers does it add?

**Check callee side:**
- What route does the controller expose?
- What request body does it expect?
- What validation does it perform?
- What response does it return?

**Verify match:**
- Do the URLs resolve correctly?
- Do the DTOs match (field names, types, required/optional)?
- Are auth headers expected and provided?

### 3. Configuration Consistency
- Do all services pointing to the same Service Bus use the same namespace URL?
- Do all services using the same database use the same connection string pattern?
- Are environment-specific configs (dev, qa, prod) consistent across services?

### 4. Breaking Change Propagation
For each recent commit (last 10) in each repo:
- Did it change a DTO, message format, API endpoint, or config value?
- If yes, trace the blast radius: what other services consume that contract?
- Are those other services updated to handle the change?

### 5. Deployment Dependency Order
- If services need to be deployed in a specific order, document it
- Flag cases where deploying Service A before Service B would break things

## Critical Checks (from known issues):

1. **Service Bus namespace mismatch**: QuoteManagement uses `sbns-rating-dev-001` but Orchestrator uses `sbns-ratingplatform-dev-001`. Verify the EXACT values in each service's appsettings.
2. **Queue name mismatch**: QuoteManagement publishes to `sbq-rating-requests-dev` but Orchestrator consumes from `sbq-initial-rating-requests`. Verify exact queue names.
3. **BFF → QuoteManagement URL**: BFF's `QuoteManagementApiUrl` is empty in base config. Verify what value it gets in each environment.
4. **APIM key flow**: BFF adds `Ocp-Apim-Subscription-Key`. QuoteManagement checks for it. Verify the header name matches exactly.

## Output Format

Return findings as a JSON array with the same format as the repo review:
```json
{
  "id": "ins_sys_NNN",
  "severity": "CRITICAL|WARNING|INFO",
  "category": "integration",
  "title": "Short title",
  "description": "What's mismatched and why it matters",
  "evidence": "Service A (file:line) uses X, Service B (file:line) uses Y",
  "example": "When Quote Management publishes a rating request, Orchestrator will never receive it because they're on different Service Bus namespaces",
  "recommendation": "Align namespace in Service A's appsettings.json line X to match Service B",
  "affectedComponents": ["service_a", "service_b"]
}
```

**Focus on CRITICAL integration issues. These are the ones that mean services literally cannot talk to each other.**
