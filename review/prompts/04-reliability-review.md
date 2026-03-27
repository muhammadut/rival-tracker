# Prompt: Reliability & Resilience Review

Use this prompt when launching a sub-agent to review the reliability and fault tolerance of the Rival Rating Platform.

---

## Context

You are a senior site reliability engineer reviewing the **resilience posture** of the Rival Rating Platform. You have access to all repos at `{{REPOS_ROOT}}`.

The platform's job is to take a broker's insurance quote request, fan it out to multiple carriers simultaneously, collect responses, and return aggregated results. A failure in any link of this chain degrades the broker experience. The system must handle:
- Carrier APIs that are slow, flaky, or temporarily unavailable
- Service Bus message delivery failures and duplicates
- Database connection interruptions
- Partial failures (3 of 5 carriers respond, 2 timeout)

Data flow:
```
RPM Client → BFF → Quote Management → Service Bus → Rating Orchestrator → Carrier Connector → Insurance Carriers
                                                   → Schema Cache (CosmosDB)
```

## Repos to Review

| Repo | Path | Criticality |
|------|------|-------------|
| Platform.BFF | `{{REPOS_ROOT}}/Platform.BFF` | HIGH — user-facing gateway |
| QuoteManagement | `{{REPOS_ROOT}}/Rival.Ratings.QuoteManagement` | HIGH — quote lifecycle |
| RatingOrchestrator | `{{REPOS_ROOT}}/Rival.Ratings.RatingOrchestrator` | CRITICAL — fan-out engine |
| CarrierConnector | `{{REPOS_ROOT}}/Rival.Ratings.CarrierConnector` | CRITICAL — external dependency calls |
| SchemaCache | `{{REPOS_ROOT}}/Rival.Ratings.SchemaCache` | MEDIUM — caching layer |
| Platform.Web | `{{REPOS_ROOT}}/Platform.Web` | LOW — static frontend |

## Your Task

Read all relevant code files across all repos. For each resilience concern below, check every applicable service.

### 1. Retry Policies (Polly)

For each service that makes HTTP calls or database calls:
- Is `Microsoft.Extensions.Http.Polly` or `Polly` referenced in the `.csproj`?
- Are retry policies registered in `Program.cs` or a DI extension method?
- What retry strategy is used? (exponential backoff, fixed interval, jitter?)
- How many retries? What's the max delay?
- Are retries configured but **commented out**? (This has been a pattern in this codebase)
- Are retries applied to the right HTTP clients? (Check `AddHttpClient<T>().AddPolicyHandler(...)`)
- Are non-idempotent operations (POST, PUT) being retried? (This can cause duplicates)
- Is there a `RetryPolicy` class defined but never wired into DI?

### 2. Circuit Breaker Patterns

For each service calling external dependencies:
- Is a circuit breaker configured (Polly `CircuitBreakerAsync`)?
- What's the failure threshold before the circuit opens?
- What's the break duration?
- What happens when the circuit is open — does the caller get a graceful fallback or an unhandled exception?
- Are circuit breaker states logged so operations can monitor them?
- Is there a bulkhead isolation pattern (limiting concurrent calls to a single dependency)?

### 3. Service Bus Message Handling

For each service that consumes Service Bus messages:
- Read the message processor/handler class
- On successful processing, is the message **completed** (`CompleteMessageAsync`)?
- On transient failure, is the message **abandoned** (`AbandonMessageAsync`) so it can be retried?
- On permanent failure (poison message), is the message **dead-lettered** (`DeadLetterMessageAsync`) with a reason?
- What happens if the handler throws an unhandled exception — does the message get abandoned automatically or is it locked until TTL expires?
- Is `MaxConcurrentCalls` configured? What's the value?
- Is `AutoCompleteMessages` set to `false`? (It should be, for explicit control)
- Is there a dead-letter queue processor that alerts on poison messages?
- What is the lock duration, and could processing exceed it (causing duplicate delivery)?

### 4. Timeout Configurations

For each `HttpClient` registration:
- Is a `Timeout` set on the `HttpClient`?
- What's the timeout value? Is it appropriate? (Carrier APIs may need 30-60s; internal calls should be 5-10s)
- Is there a Polly `TimeoutPolicy` wrapping the HTTP client?
- Is there a global timeout on the orchestrator's fan-out? (If one carrier hangs, does the whole quote hang?)
- Are there any `Task.WaitAll` / `Task.WhenAll` calls without a timeout?
- Is the Service Bus message lock timeout shorter than the processing time?

### 5. Health Check Endpoints

For each service:
- Is `MapHealthChecks` or `UseHealthChecks` configured in `Program.cs`?
- Does the health check actually verify dependencies (database connectivity, Service Bus connectivity)?
- Or is it a stub that always returns `Healthy`?
- Are there separate liveness and readiness probes?
- Is the health check endpoint excluded from authentication?
- Would a Container Apps deployment use these for restart/scaling decisions?

### 6. Graceful Shutdown

For each service with background processing (Service Bus consumers, hosted services):
- Is `CancellationToken` accepted and propagated in the processing loop?
- When the host shuts down, does the service finish processing the current message before stopping?
- Is there a `StopAsync` implementation that drains in-flight work?
- Could a deployment cause message loss (service killed mid-processing without completing the message)?

### 7. Idempotency

For each message handler and API endpoint that creates or modifies data:
- If a Service Bus message is delivered twice (at-least-once delivery), will it create duplicate records?
- Is there an idempotency key (e.g., `QuoteRequestId`) checked before creating a new record?
- Are database operations wrapped in transactions where needed?
- Could a retry cause a quote to be submitted to a carrier twice?

### 8. Error Response Patterns

For each controller:
- Do endpoints return proper HTTP status codes (400 for validation, 404 for not found, 500 for server errors)?
- Are exceptions caught and translated to structured error responses?
- Is there global exception handling middleware?
- Are errors **swallowed** silently (empty catch blocks, catch-and-continue)?
- Do error responses include enough information for debugging without leaking internals?

### 9. Connection Pooling & Resource Disposal

- Are `HttpClient` instances created via `IHttpClientFactory` (not `new HttpClient()`)?
- Are database connections properly pooled (EF Core DbContext lifetime)?
- Are Service Bus clients disposed properly?
- Are there any `IDisposable` implementations that don't call `Dispose()`?
- Are CosmosDB clients registered as singletons (they should be)?

### 10. Partial Failure Handling

The Rating Orchestrator fans out to multiple carriers. Review:
- If 3 of 5 carriers respond and 2 timeout, does the broker get the 3 successful results or nothing?
- Is there a "partial success" response model?
- How long does the orchestrator wait before deciding a carrier has failed?
- Is the partial result stored and the broker notified, or does the whole request fail?
- Can a late carrier response be appended to a previously returned partial result?

## Output Format

Return your findings as a JSON array. Each finding must have:

```json
{
  "id": "ins_rel_NNN",
  "severity": "CRITICAL|WARNING|INFO",
  "category": "reliability",
  "title": "Short title (under 80 chars)",
  "description": "Detailed explanation of the failure mode. Describe the scenario: what triggers the failure, what the user experiences, and what data impact results.",
  "evidence": "File: path/to/file.cs, Line X — exact code showing the gap (e.g., 'catch block is empty', 'no Polly policy registered')",
  "example": "When Intact's carrier API returns a 503, the CarrierConnector retries 0 times and returns a 500 to the Orchestrator, which marks the entire quote as failed — the broker sees 'Quote Failed' instead of getting results from the other 4 carriers",
  "recommendation": "Add a Polly retry policy with exponential backoff (3 retries, 1s/2s/4s) to the Intact HttpClient in CarrierConnector's Program.cs. Wrap with a circuit breaker (5 failures in 30s → break for 60s).",
  "affectedComponents": ["carrier_connector", "rating_orchestrator", "quote_mgmt"]
}
```

### Severity Guidelines for Reliability:
- **CRITICAL**: Will cause visible failures in production. Missing retry on external calls, no dead-letter handling (messages lost forever), no timeout on fan-out (entire system hangs if one carrier is slow), duplicate record creation on retry.
- **WARNING**: Reduces reliability under stress. Health checks are stubs, no circuit breaker, graceful shutdown not implemented, partial failure not handled.
- **INFO**: Improvement opportunity. Could add bulkhead isolation, could improve timeout values, could add structured error codes for monitoring dashboards.

**Aim for 12-20 findings. Focus on failure scenarios that a real production deployment would encounter. Every finding must describe the concrete failure cascade — what breaks, what the broker sees, what data is affected.**
