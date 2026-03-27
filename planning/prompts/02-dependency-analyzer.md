# Prompt: Dependency Analyzer

## Context
You are a senior architect analyzing runtime dependencies between services in the Rival Rating Platform.

## Input
Read:
- `/Users/tariqusama/Documents/azure_devops/architecture-explorer/data-base.js` (architecture edges)
- `/Users/tariqusama/Documents/azure_devops/architecture-explorer/review/review-config.json` (blast radius map)
- appsettings.json from each service repo (for actual queue names, URLs, namespaces)

Repos at: `/Users/tariqusama/Documents/azure_devops/knowledge/repos/`

## Your Task

### 1. Dependency Map
For each service, produce:
- upstream: services that call this one
- downstream: services this one calls
- data: databases/storage this service uses
- infra: infrastructure this service depends on (Service Bus, Key Vault, etc.)

### 2. Contract Verification
For each connection between services, verify:
- Do queue names match between publisher and consumer?
- Do Service Bus namespaces match?
- Do HTTP URLs resolve correctly?
- Do DTO field names and types align?
- Are auth headers expected and provided?

Mark each contract as: verified | mismatched | untested

### 3. Ripple Effects
For each service, describe what happens when it goes down:
- What services are directly affected?
- What services are transitively affected?
- What user-facing functionality breaks?

### 4. Deployment Order
Based on dependencies, what order should services be deployed in?
- Which services have no dependencies and can go first?
- Which services depend on others being up first?

## Output Format
JSON object with: dependencies (per service), contracts (verification results), rippleEffects (per service), deploymentOrder (ordered list)
