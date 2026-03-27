# Prompt: Architecture & Design Patterns Review

Use this prompt when launching a sub-agent to review architectural decisions, pattern compliance, and design quality across the Rival Rating Platform.

---

## Context

You are a principal architect reviewing the **design and architecture** of the Rival Rating Platform. You have access to all repos at `{{REPOS_ROOT}}` and the architecture wiki at `{{WIKI_ROOT}}`.

The platform's intended architecture:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  RPM Client (React SPA)                                                │
│    └──→ Platform.BFF (ASP.NET)                                         │
│           └──→ APIM Gateway                                            │
│                  └──→ Quote Management API (ASP.NET)                   │
│                         ├──→ SQL Database (quote lifecycle)            │
│                         └──→ Service Bus (async fan-out trigger)       │
│                                └──→ Rating Orchestrator (worker)       │
│                                       ├──→ Schema Cache (CosmosDB)    │
│                                       └──→ Carrier Connector (HTTP)   │
│                                              └──→ Carrier APIs        │
│  Manufactured Rating (ML model serving) ←── future, separate path     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Intended Boundaries:
- **Platform.BFF**: Thin pass-through. Adds auth headers, routes to APIM. NO business logic.
- **Quote Management**: Owns the quote lifecycle. Creates/reads/updates quotes in SQL. Publishes events to Service Bus. Does NOT call carriers directly.
- **Rating Orchestrator**: Receives Service Bus messages. Fans out to multiple carriers via Carrier Connector. Aggregates results. Updates quote status.
- **Carrier Connector**: Adapter layer. Translates platform-agnostic rating requests into carrier-specific API calls. Each carrier has its own adapter.
- **Schema Cache**: Provides and caches CSIO schema definitions from CosmosDB. Read-only service.

## Repos to Review

| Repo | Path | Expected Pattern |
|------|------|-----------------|
| Platform.BFF | `{{REPOS_ROOT}}/Platform.BFF` | Thin gateway, no business logic |
| QuoteManagement | `{{REPOS_ROOT}}/Rival.Ratings.QuoteManagement` | Repository pattern, CQRS-lite |
| RatingOrchestrator | `{{REPOS_ROOT}}/Rival.Ratings.RatingOrchestrator` | Message handler, fan-out, aggregation |
| CarrierConnector | `{{REPOS_ROOT}}/Rival.Ratings.CarrierConnector` | Adapter/Strategy pattern per carrier |
| SchemaCache | `{{REPOS_ROOT}}/Rival.Ratings.SchemaCache` | Cache-aside, read-only API |
| ManufacturedRating | `{{REPOS_ROOT}}/Rival.Rating.API.Manufacture` | ML model serving (future) |

## Your Task

Read the key architectural files in each repo — `Program.cs`, controllers, services, repositories, models, and message handlers. Compare what the code actually does against what the architecture intends.

### 1. Architecture Diagram vs. Implementation

Compare the intended architecture (above) with what the code actually implements:
- Does the BFF actually pass through, or does it contain business logic (calculations, data transformations, database calls)?
- Does Quote Management actually own the quote lifecycle, or is that logic split across services?
- Does the Rating Orchestrator actually fan out to multiple carriers, or is it a stub?
- Does the Carrier Connector use the Adapter pattern with per-carrier adapters, or is carrier logic mixed together?
- Is Schema Cache actually caching, or does it hit CosmosDB on every request?
- Does the data actually flow through Service Bus, or are there direct HTTP calls bypassing the async pattern?

### 2. Boundary Violations

Check for violations of service boundaries:
- **BFF contains business logic**: Does the BFF do anything beyond routing, adding headers, and simple request/response mapping? Flag any data transformation, validation, calculation, or database access in the BFF.
- **Direct database access across boundaries**: Does any service directly access another service's database? (e.g., Orchestrator querying QuoteManagement's SQL DB directly instead of going through the API)
- **Shared database anti-pattern**: Do multiple services share the same database schema? Are they reading/writing the same tables?
- **Bypass of async boundary**: Does the Orchestrator call Quote Management's API directly instead of using Service Bus messages? Does Quote Management call Carrier Connector directly?
- **Domain logic in controllers**: Are controllers doing more than request routing? Business logic should be in service/domain classes, not controllers.

### 3. Pattern Compliance

For each repo, check if the claimed patterns are actually implemented:

**Repository Pattern (expected in QuoteManagement):**
- Is there an `IRepository<T>` or similar interface?
- Is the repository injected via DI, not instantiated directly?
- Does the repository abstract the database access (EF Core DbContext not leaked into services)?
- Are there repository methods for each data operation, or is the DbContext used directly?

**Adapter Pattern (expected in CarrierConnector):**
- Is there a common `ICarrierAdapter` interface?
- Does each carrier have its own adapter implementation?
- Can a new carrier be added by implementing the interface without modifying existing code?
- Is the adapter selected via Strategy pattern or factory based on carrier ID?

**CQRS (if claimed):**
- Are commands (write operations) separated from queries (read operations)?
- Are there separate models for reads and writes?
- Or is it a single model used for everything?

**Mediator Pattern (if MediatR is used):**
- Are request/response handlers properly separated?
- Is MediatR used consistently or only in some places?

### 4. Coupling Analysis

Identify unnecessary coupling between services:
- **Shared DTOs**: Are services referencing each other's DTO/model projects? They should each define their own contracts.
- **Shared NuGet packages**: Is there a common package? What's in it — shared models (bad coupling) or shared utilities (acceptable)?
- **Temporal coupling**: Must services be deployed together because of shared types?
- **Knowledge coupling**: Does Service A need to know the internal implementation details of Service B?
- **Contract coupling**: Are services coupled through overly specific contracts (50-field DTOs when only 5 fields are needed)?

### 5. Data Model Appropriateness

Review the data storage choices:
- **SQL for Quote Management**: Is SQL appropriate for the quote lifecycle? Is the schema normalized? Are there any EAV (Entity-Attribute-Value) anti-patterns?
- **CosmosDB for Schema Cache**: Is CosmosDB appropriate for caching CSIO schemas? Is the partition key well-chosen? Could a simpler cache (Redis) work?
- **Are domain models persisted directly?** Or are there separate persistence models (good separation)?
- **Are database models leaking into API responses?** DTOs should be separate from entity models.

### 6. Domain Model Leakage

Check if domain concepts leak across service boundaries:
- Are entity models (with database annotations) used in API responses?
- Are Service Bus message contracts tied to internal domain models?
- If Quote Management changes its internal `Quote` entity, does that force changes in the Orchestrator?
- Are there proper mapping layers (AutoMapper, manual mappers) between domain and contract models?

### 7. Simplification Opportunities

Identify over-engineering or under-engineering:
- Could any two services be merged without loss of clarity? (e.g., is Schema Cache complex enough to warrant its own service?)
- Are there abstractions with only one implementation that add complexity without flexibility?
- Are there layers of indirection (Controller → Service → Repository → DbContext) where some layers are pass-through only?
- Could the fan-out be simplified with Azure Durable Functions instead of a custom orchestrator?
- Are there simpler alternatives to the current approach that would achieve the same goals?

### 8. SOLID Principle Adherence

For each service, briefly assess:
- **S (Single Responsibility)**: Does each class have one reason to change?
- **O (Open/Closed)**: Can the system be extended (new carrier) without modifying existing code?
- **L (Liskov Substitution)**: Are interface implementations truly interchangeable?
- **I (Interface Segregation)**: Are interfaces focused, or do they have methods that some implementations don't need?
- **D (Dependency Inversion)**: Do high-level modules depend on abstractions, not concrete implementations?

### 9. Consistency Across Services

- Do all services follow the same project structure (Controllers/ Services/ Repositories/ Models/)?
- Is the same logging framework used consistently (Serilog everywhere, or mixed)?
- Is error handling consistent (same error response format across all APIs)?
- Are naming conventions consistent across repos (PascalCase, camelCase, same suffixes)?
- Is the same .NET version used across all services?

## Output Format

Return your findings as a JSON array. Each finding must have:

```json
{
  "id": "ins_arch_NNN",
  "severity": "CRITICAL|WARNING|INFO",
  "category": "architecture",
  "title": "Short title (under 80 chars)",
  "description": "Detailed explanation of the architectural concern. Explain the intended pattern, what the code actually does, and why the deviation matters.",
  "evidence": "File: path/to/file.cs — code showing the boundary violation, missing pattern, or coupling. Reference the architecture diagram where applicable.",
  "example": "The BFF's QuoteController.cs contains a method that calculates premium tax on line 47, which should be in QuoteManagement's domain layer. If the tax logic needs to change, developers must update both BFF and QuoteManagement, creating a consistency risk.",
  "recommendation": "Move the premium tax calculation from BFF/Controllers/QuoteController.cs to QuoteManagement's domain service layer. The BFF should only forward the request and return the response.",
  "affectedComponents": ["bff", "quote_mgmt"]
}
```

### Severity Guidelines for Architecture:
- **CRITICAL**: Fundamental design violation that will cause systemic problems. Service boundary violations that create data inconsistency, shared database access, missing async boundary that defeats the purpose of the architecture.
- **WARNING**: Pattern deviation that increases maintenance burden. Missing abstraction layers, inconsistent patterns across services, domain model leakage, coupling that makes independent deployment difficult.
- **INFO**: Design improvement opportunity. Simplification candidates, pattern upgrades, consistency improvements, SOLID refinements.

**Aim for 10-15 findings. Focus on deviations between intended and actual architecture. Every finding must reference both the intended design and the actual implementation.**
