/* ═══════════════════════════════════════════════════════════════
   SYSTEM REVIEW DATA — Senior Systems Design Assessment
   Generated from deep architecture review (2026-03-29)
   ═══════════════════════════════════════════════════════════════ */

window.SYSTEM_REVIEW_DATA = {

  /* ── Design Principles (what a senior engineer evaluates) ── */
  principles: [
    { id: 'deployable', icon: '🚀', label: 'Deployable', question: 'Can this component be deployed independently via CI/CD?' },
    { id: 'contract_aligned', icon: '🤝', label: 'Contract Aligned', question: 'Does it use shared contracts or have its own divergent copies?' },
    { id: 'scalable', icon: '📈', label: 'Scalable', question: 'Can it handle 10x load without architectural changes?' },
    { id: 'observable', icon: '🔍', label: 'Observable', question: 'Can you trace a request end-to-end and diagnose failures?' },
    { id: 'resilient', icon: '🛡️', label: 'Resilient', question: 'Does it handle failures gracefully without losing data?' },
    { id: 'secure', icon: '🔒', label: 'Secure', question: 'Are secrets managed properly? Is auth enforced?' },
    { id: 'tested', icon: '✅', label: 'Tested', question: 'Are there integration tests that prove it works end-to-end?' },
    { id: 'config_correct', icon: '⚙️', label: 'Config Correct', question: 'Are connection strings, queue names, and URLs correct?' }
  ],

  /* ── Phased Roadmap ─────────────────────────────────────── */
  phases: [
    {
      id: 'phase_0',
      title: 'Azure Access & Infrastructure',
      subtitle: 'Get the keys to the building',
      color: '#a371f7',
      icon: '🔑',
      status: 'not_started',
      description: 'Before any code runs, we need Azure subscriptions with the right services provisioned and permissions granted.',
      owner: 'Tariq → Deji (DevOps)',
      effort: '1-2 days (plus approval wait time)',
      items: [
        { id: 'p0_1', text: 'Request sandbox Azure subscription with: Container Apps, Service Bus, Cosmos DB (MongoDB API), SQL Server, Key Vault, Blob Storage, APIM, App Insights', status: 'not_started', critical: true },
        { id: 'p0_2', text: 'Request dev subscription (mirrors sandbox but team-accessible)', status: 'not_started', critical: true },
        { id: 'p0_3', text: 'Request prod subscription (locked down, deployment-only access)', status: 'not_started', critical: false },
        { id: 'p0_4', text: 'Verify Azure AD app registration: ClientSecret exists, redirect URIs include dev/local URLs', status: 'not_started', critical: true },
        { id: 'p0_5', text: 'Provision Service Bus namespace: sbns-ratingplatform-{env}-001', status: 'not_started', critical: true },
        { id: 'p0_6', text: 'Create Service Bus queues programmatically via Bicep: sbq-rating-requests, sbq-rating-jobs, sbq-rating-responses', status: 'not_started', critical: true },
        { id: 'p0_7', text: 'Provision Cosmos DB account with MongoDB API for Quote Management', status: 'not_started', critical: true },
        { id: 'p0_8', text: 'Provision SQL Server for ASP.NET Identity (RPM Client requirement)', status: 'not_started', critical: true },
        { id: 'p0_9', text: 'Provision Key Vault for carrier OAuth2 credentials and connection strings', status: 'not_started', critical: false },
        { id: 'p0_10', text: 'Run EF migrations for ASP.NET Identity schema on SQL Server', status: 'not_started', critical: true },
        { id: 'p0_11', text: 'Seed demo user(s) in AspNetUsers table with email and roles', status: 'not_started', critical: true },
        { id: 'p0_12', text: 'Hold kickoff meeting: decide contract fix direction, response path, carrier target strategy', status: 'not_started', critical: true },
        { id: 'p0_13', text: 'Start carrier credential requests for sandbox access (2-6 weeks lead time)', status: 'not_started', critical: true },
        { id: 'p0_14', text: 'Check Cssi.Schemas.Csio.Xml .NET 9 compatibility (1 hour — determines 5 vs 18 day effort for Phase 4)', status: 'not_started', critical: true },
        { id: 'p0_15', text: 'Ensure all devs have NuGet PATs for private feed and az login with Service Bus RBAC roles', status: 'not_started', critical: false }
      ]
    },
    {
      id: 'phase_1',
      title: 'Deployment Pipelines',
      subtitle: 'Make code deployable',
      color: '#4f8fff',
      icon: '🏗️',
      status: 'not_started',
      description: 'Each service needs a CI/CD pipeline that builds a Docker image, pushes to Azure Container Registry, and deploys to Container Apps. Currently ZERO pipelines exist for Rating Platform services.',
      owner: 'Tariq + DevOps',
      effort: '2-3 days',
      items: [
        { id: 'p1_1', text: 'Create azure-pipelines.yml for QuoteManagement (build → ACR → Container App)', status: 'not_started', critical: true },
        { id: 'p1_2', text: 'Create azure-pipelines.yml for RatingOrchestrator', status: 'not_started', critical: true },
        { id: 'p1_3', text: 'Create azure-pipelines.yml for CarrierConnector', status: 'not_started', critical: true },
        { id: 'p1_4', text: 'Create azure-pipelines.yml for SchemaCache', status: 'not_started', critical: false },
        { id: 'p1_5', text: 'Create Bicep templates for Container App definitions (replicable dev → prod)', status: 'not_started', critical: true },
        { id: 'p1_6', text: 'Verify Dockerfiles exist and build successfully for all services', status: 'not_started', critical: true },
        { id: 'p1_7', text: 'Create Bicep template for Service Bus queues (programmatic, repeatable)', status: 'not_started', critical: true }
      ]
    },
    {
      id: 'phase_2',
      title: 'Shared Contracts Package',
      subtitle: 'Single source of truth — recommended for Tier 2, optional for Tier 1 MVP',
      color: '#3fb950',
      icon: '📦',
      status: 'not_started',
      description: 'Create Rival.Rating.Contracts NuGet package with shared message types, CDM models, and queue name constants. This eliminates the 4 duplicate copies of CdmData and fixes all contract drift bugs. Note: for Tier 1 MVP, in-place contract fixes (4-6 hours) are faster than creating a full NuGet package (2-3 days).',
      owner: 'Tariq',
      effort: '2-3 days',
      items: [
        { id: 'p2_1', text: 'Create Rival.Rating.Contracts repo with CdmData, DynamicFieldValue (decimal, not double), CarrierContext, queue name constants', status: 'not_started', critical: true },
        { id: 'p2_2', text: 'Define RatingRequestMessage, CarrierRatingMessage, RatingResponseMessage in shared package', status: 'not_started', critical: true },
        { id: 'p2_3', text: 'Set up Azure DevOps Artifacts feed and publish v1.0.0', status: 'not_started', critical: true },
        { id: 'p2_4', text: 'Update QuoteManagement: install package, delete local model copies, fix imports', status: 'not_started', critical: true },
        { id: 'p2_5', text: 'Update RatingOrchestrator: install package, delete local model copies, fix imports', status: 'not_started', critical: true },
        { id: 'p2_6', text: 'Update CarrierConnector: install package, delete local model copies, fix imports', status: 'not_started', critical: true },
        { id: 'p2_7', text: 'Update BFF: install package, delete local model copies, fix imports', status: 'not_started', critical: false },
        { id: 'p2_8', text: 'Run serialization round-trip tests to verify all services agree on JSON shape', status: 'not_started', critical: true }
      ]
    },
    {
      id: 'phase_3',
      title: 'Component Readiness',
      subtitle: 'Fix each block in the pipeline',
      color: '#d29922',
      icon: '🔧',
      status: 'not_started',
      description: 'Go component by component through the data flow. For each one: is it enterprise-ready? Fix configuration, connections, and logic issues.',
      owner: 'Tariq + Team',
      effort: '5-8 days',
      items: [
        { id: 'p3_1', text: 'BFF: Fix empty QuoteManagementApiUrl in appsettings.json', status: 'not_started', critical: true },
        { id: 'p3_2', text: 'BFF: Fix thread-safety bug in SetApiKeyHeader (mutates shared DefaultRequestHeaders)', status: 'not_started', critical: true },
        { id: 'p3_3', text: 'BFF: Enable Polly resilience policies (commented out in Program.cs)', status: 'not_started', critical: false },
        { id: 'p3_4', text: 'QuoteManagement: Fix Service Bus namespace (sbns-rating-dev-001 → sbns-ratingplatform-dev-001)', status: 'not_started', critical: true },
        { id: 'p3_5', text: 'QuoteManagement: Fix queue names to match shared constants', status: 'not_started', critical: true },
        { id: 'p3_6', text: 'QuoteManagement: Register ServiceBusSettings in DI (IOptions not registered)', status: 'not_started', critical: true },
        { id: 'p3_7', text: 'QuoteManagement: Create environment-specific appsettings (dev, qa, prod)', status: 'not_started', critical: true },
        { id: 'p3_8', text: 'QuoteManagement: Fix CarrierTargets always null from frontend', status: 'not_started', critical: true },
        { id: 'p3_9', text: 'RatingOrchestrator: Verify it receives messages after QuoteManagement fixes', status: 'not_started', critical: true },
        { id: 'p3_10', text: 'CarrierConnector: Fix health check (hardcoded to always return Healthy)', status: 'not_started', critical: false },
        { id: 'p3_11', text: 'RPM Client: Fix GetOffers polling (currently calls immediately, needs async wait)', status: 'not_started', critical: true },
        { id: 'p3_12', text: 'SchemaCache: Verify bundles are seeded with Alberta PersAuto data', status: 'not_started', critical: true },
        { id: 'p3_13', text: 'Fix carrierTarget vs carrierContext property mismatch (Orchestrator sends carrierTarget, Connector expects carrierContext)', status: 'not_started', critical: true },
        { id: 'p3_14', text: 'Fix response format mismatch: CarrierConnector sends flat, QuoteManagement expects nested carrierResult', status: 'not_started', critical: true },
        { id: 'p3_15', text: 'Fix Raw nullability mismatch in DynamicFieldValue across services', status: 'not_started', critical: false },
        { id: 'p3_16', text: 'Fix RatingResponseReader: dead-letter on JsonException instead of abandon (prevents infinite retry)', status: 'not_started', critical: false },
        { id: 'p3_17', text: 'Remove PII from logs: driver names, DOBs, addresses should not be in structured logs', status: 'not_started', critical: false }
      ]
    },
    {
      id: 'phase_4',
      title: 'CDM-to-CSIO Converter',
      subtitle: 'The missing piece — Tier 2 (not required for MVP demo)',
      color: '#f85149',
      icon: '🔄',
      status: 'not_started',
      description: 'This phase is optional for the MVP demo. The CarrierConnector\'s PremiumCalculator simulator can produce realistic fake premiums for the demo. This phase is required for real carrier integration (Tier 2). Build the transformer that converts CDM fields into carrier-specific CSIO/ACORD XML. Use VB.NET converter knowledge from czo-extractor as the reference for field mappings.',
      owner: 'Tariq',
      effort: '5-18 days (depends on CSIO package compatibility)',
      items: [
        { id: 'p4_1', text: 'Check if Rating.Csio.Packages.Data works with .NET 9 (1 hour, highest-leverage decision)', status: 'not_started', critical: true },
        { id: 'p4_2', text: 'Build ICdmToCsioTransformer interface and Alberta PersAuto implementation', status: 'not_started', critical: true },
        { id: 'p4_3', text: 'Map CDM fields → CSIO XML elements using czo-extractor Aviva data as reference', status: 'not_started', critical: true },
        { id: 'p4_4', text: 'Add missing CDM fields for Alberta Auto (maritalStatus, occupation, bodyType, etc.)', status: 'not_started', critical: true },
        { id: 'p4_5', text: 'Add broker identity fields to CDM (Producer/ContractNumber, PlacingOffice)', status: 'not_started', critical: true },
        { id: 'p4_6', text: 'Build ICsioResponseParser to extract premiums from carrier response XML', status: 'not_started', critical: true },
        { id: 'p4_7', text: 'Wire transformer into RatingService (replace PremiumCalculator simulator path)', status: 'not_started', critical: true },
        { id: 'p4_8', text: 'Test with captured Aviva XML from test data folder as golden reference', status: 'not_started', critical: true }
      ]
    },
    {
      id: 'phase_5',
      title: 'End-to-End Integration',
      subtitle: 'One Alberta quote flowing through',
      color: '#f778ba',
      icon: '🎯',
      status: 'not_started',
      description: 'Connect everything. Phase 5 can run with the simulator (Tier 1) OR with real carrier APIs (Tier 2). For MVP demo, the simulator path proves the pipeline works end-to-end without needing carrier credentials. Submit a real Alberta auto quote from the RPM Client, watch it flow through every service, and get a price back.',
      owner: 'Tariq + Team',
      effort: '3-5 days',
      items: [
        { id: 'p5_1', text: 'Obtain carrier sandbox credentials (OAuth2 client_id/secret from Peace Hills or Aviva)', status: 'not_started', critical: true },
        { id: 'p5_2', text: 'Configure IP whitelisting / NAT Gateway for carrier API access', status: 'not_started', critical: true },
        { id: 'p5_3', text: 'Submit test quote from RPM Client → verify CDM arrives at BFF', status: 'not_started', critical: true },
        { id: 'p5_4', text: 'Verify BFF forwards to QuoteManagement → quote stored in Cosmos DB', status: 'not_started', critical: true },
        { id: 'p5_5', text: 'Verify QuoteManagement publishes to correct Service Bus queue', status: 'not_started', critical: true },
        { id: 'p5_6', text: 'Verify Orchestrator receives, fans out per carrier, publishes to rating-jobs queue', status: 'not_started', critical: true },
        { id: 'p5_7', text: 'Verify CarrierConnector converts CDM → CSIO XML → calls carrier API', status: 'not_started', critical: true },
        { id: 'p5_8', text: 'Verify response flows back: CarrierConnector → response queue → QuoteManagement → RPM Client', status: 'not_started', critical: true },
        { id: 'p5_9', text: 'Celebrate: broker sees real premium from a real carrier', status: 'not_started', critical: true }
      ]
    }
  ],

  /* ── Per-Component Senior Engineer Assessment ────────────── */
  componentReviews: {
    rpm_client: {
      name: 'RPM Client',
      readiness: 'partial',
      score: 55,
      role: 'Blazor frontend that brokers use to fill out quote forms and see results.',
      businessLogicLines: 'Medium — dynamic form rendering from schema bundles, CDM creation from form values',
      verdict: 'Functional but has integration gaps. Forms are schema-driven (good). CDM creation works. But async response polling is missing — it calls GetOffers immediately instead of waiting for carrier responses.',
      criteria: [
        { principle: 'deployable', status: 'pass', note: 'Has Dockerfile and can be containerized' },
        { principle: 'contract_aligned', status: 'warn', note: 'Has its own copy of CdmData.cs — uses decimal (correct) but will drift' },
        { principle: 'scalable', status: 'pass', note: 'Stateless Blazor Server — scales horizontally' },
        { principle: 'observable', status: 'pass', note: 'App Insights integration present' },
        { principle: 'resilient', status: 'warn', note: 'No retry on failed API calls to BFF' },
        { principle: 'secure', status: 'fail', note: 'Azure AD auth required but not deferrable — needs app registration' },
        { principle: 'tested', status: 'fail', note: 'No integration tests for quote submission flow' },
        { principle: 'config_correct', status: 'warn', note: 'Requires SQL Server for ASP.NET Identity — must be provisioned' }
      ],
      dataStores: [
        { name: 'SQL Server', purpose: 'ASP.NET Identity (user auth)', fit: 'Correct — Identity framework requires relational DB', action: 'Provision Azure SQL in sandbox' }
      ],
      keyIssues: [
        { severity: 'critical', issue: 'CarrierTargets sent as null', detail: 'Frontend sends CarrierTargets = null in CreateQuoteRequest. No carriers get targeted. Quote goes nowhere.' },
        { severity: 'critical', issue: 'No async polling for results', detail: 'Calls GetOffers immediately after submission. Carrier rating takes 5-15 seconds. Results are never seen.' },
        { severity: 'warning', issue: 'CSIO mapping commented out', detail: 'Quote.razor.cs:704-707 has TODO comment for CSIO mapping — was never completed.' }
      ]
    },

    bff: {
      name: 'Web BFF',
      readiness: 'broken',
      score: 25,
      role: 'API proxy that adds APIM authentication headers and forwards requests to backend services.',
      businessLogicLines: '20 lines — just API key resolution from Key Vault. Everything else is HTTP forwarding.',
      verdict: 'Pure proxy with two critical bugs. Could be replaced by YARP or APIM policies, but fixing it is faster than replacing it for MVP.',
      criteria: [
        { principle: 'deployable', status: 'warn', note: 'Has Dockerfile but no CI/CD pipeline for Rating Platform' },
        { principle: 'contract_aligned', status: 'fail', note: 'Own copy of CdmData.cs and quote models — divergent from backend' },
        { principle: 'scalable', status: 'pass', note: 'Stateless proxy — scales horizontally' },
        { principle: 'observable', status: 'pass', note: 'App Insights configured' },
        { principle: 'resilient', status: 'fail', note: 'Polly resilience policies are COMMENTED OUT in Program.cs line 19' },
        { principle: 'secure', status: 'warn', note: 'API keys from Key Vault — correct pattern but Key Vault must be provisioned' },
        { principle: 'tested', status: 'fail', note: 'No tests' },
        { principle: 'config_correct', status: 'fail', note: 'QuoteManagementApiUrl is EMPTY in appsettings.json — all calls fail' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'critical', issue: 'QuoteManagementApiUrl is empty', detail: 'appsettings.json has empty string for the backend URL. Every request to Quote Management returns an error.' },
        { severity: 'critical', issue: 'Thread-safety bug in SetApiKeyHeader', detail: 'Mutates shared HttpClient.DefaultRequestHeaders from multiple threads. Race condition causes intermittent auth failures.' },
        { severity: 'warning', issue: 'Polly policies commented out', detail: 'Retry, circuit breaker, and timeout policies exist in code but are commented out. No resilience on outbound calls.' }
      ]
    },

    quote_mgmt: {
      name: 'Quote Management',
      readiness: 'broken',
      score: 30,
      role: 'Accepts quote creation/update requests, stores them in Cosmos DB, and publishes rating requests to Service Bus.',
      businessLogicLines: '4 lines — generates IDs. Everything else is object assembly, persistence, and queue publishing.',
      verdict: 'The critical link between frontend and rating pipeline. Currently broken due to wrong Service Bus namespace and queue names. Data model for Cosmos DB storage is reasonable. Fixing config issues makes it functional.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'No CI/CD pipeline exists' },
        { principle: 'contract_aligned', status: 'fail', note: 'Own copy of CdmData, RatingRequestMessage, RatingResponseMessage — decimal NumberValue (correct)' },
        { principle: 'scalable', status: 'pass', note: 'Stateless API + Cosmos DB + Service Bus — inherently scalable' },
        { principle: 'observable', status: 'pass', note: 'App Insights + structured logging present' },
        { principle: 'resilient', status: 'warn', note: 'No retry on Service Bus publish failures' },
        { principle: 'secure', status: 'warn', note: 'Managed Identity configured but not tested' },
        { principle: 'tested', status: 'fail', note: 'No integration tests' },
        { principle: 'config_correct', status: 'fail', note: 'Wrong Service Bus namespace AND wrong queue names' }
      ],
      dataStores: [
        { name: 'Cosmos DB (MongoDB API)', purpose: 'Quote records (quoteWip collection) — stores CDM, status, carrier targets, pricing results', fit: 'Good fit — flexible schema handles varying CDM fields per carrier/province. MongoDB API is fine for document-oriented quote data.', action: 'Provision Cosmos DB with MongoDB API. Verify quoteWip collection schema supports the full quote lifecycle (created → submitted → rated → offers received).' },
        { name: 'Service Bus', purpose: 'Publishes RatingRequestMessage to sbq-rating-requests queue', fit: 'Correct pattern — decouples quote submission from rating processing. Handles async carrier responses.', action: 'Fix namespace to sbns-ratingplatform-dev-001. Fix queue name to sbq-rating-requests (from shared constants).' }
      ],
      keyIssues: [
        { severity: 'critical', issue: 'Wrong Service Bus namespace', detail: 'Configured as sbns-rating-dev-001 but should be sbns-ratingplatform-dev-001. Messages go to a non-existent namespace.' },
        { severity: 'critical', issue: 'Wrong queue names', detail: 'Uses sbq-rating-requests-dev but Orchestrator listens on sbq-initial-rating-requests. Messages are never consumed.' },
        { severity: 'warning', issue: 'ServiceBusSettings DI registration uses different class name', detail: 'IOptions<ServiceBusSettings> is injected but the registration uses RatingServiceBusSettings (different class name). The settings class exists and is registered, but the name mismatch may cause confusion. Verify the correct class is resolved at runtime.' },
        { severity: 'warning', issue: 'No environment-specific config', detail: 'Only one appsettings.json with hardcoded dev values. No appsettings.Production.json.' }
      ]
    },

    service_bus: {
      name: 'Azure Service Bus',
      readiness: 'not_started',
      score: 0,
      role: 'Message queue infrastructure. Three queues: sbq-rating-requests (QuoteManagement → Orchestrator), sbq-rating-jobs (Orchestrator → CarrierConnector), sbq-rating-responses (CarrierConnector → QuoteManagement).',
      businessLogicLines: 'N/A — infrastructure service, no application code',
      verdict: 'The right technology for this problem. Needs to be provisioned with correct queue names, and ideally created via Bicep so it is repeatable across environments.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'Not provisioned yet — no Bicep template for Rating Platform queues' },
        { principle: 'contract_aligned', status: 'fail', note: 'Queue names are hardcoded differently in each service' },
        { principle: 'scalable', status: 'pass', note: 'Azure Service Bus scales to millions of messages/day' },
        { principle: 'observable', status: 'warn', note: 'Basic monitoring available but no custom alerts configured' },
        { principle: 'resilient', status: 'pass', note: 'Built-in dead-letter queues, message retry, and lock renewal' },
        { principle: 'secure', status: 'warn', note: 'Needs Managed Identity RBAC roles (Data Sender, Data Receiver)' },
        { principle: 'tested', status: 'fail', note: 'Cannot test until provisioned' },
        { principle: 'config_correct', status: 'fail', note: 'Namespace and queue names do not match between services' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'critical', issue: 'Not provisioned', detail: 'The Service Bus namespace sbns-ratingplatform-dev-001 does not exist yet. Must be created before any messages can flow.' },
        { severity: 'critical', issue: 'Queue name disagreement', detail: 'QuoteManagement uses sbq-rating-requests-dev, Orchestrator uses sbq-initial-rating-requests. The shared contracts package will define the canonical names.' },
        { severity: 'warning', issue: 'No Bicep template', detail: 'Queues should be created programmatically so dev/qa/prod environments are identical.' }
      ]
    },

    orchestrator: {
      name: 'Rating Orchestrator',
      readiness: 'partial',
      score: 60,
      role: 'Receives one rating request with multiple carrier targets, fans out into separate per-carrier messages.',
      businessLogicLines: '6 lines — a for-loop that iterates carrier targets and publishes a message per carrier.',
      verdict: 'Architecturally functional. The fan-out logic is correct and simple. Main issue is the message contract mismatch — it sends "carrierTarget" but CarrierConnector expects "carrierContext". Will be fixed by shared contracts package.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'No CI/CD pipeline exists' },
        { principle: 'contract_aligned', status: 'fail', note: 'Own copies of CDM models. Uses double for NumberValue (matches CarrierConnector but should be decimal for currency precision).' },
        { principle: 'scalable', status: 'pass', note: 'Stateless worker service — scales by adding instances' },
        { principle: 'observable', status: 'pass', note: 'OpenTelemetry tracing + App Insights configured' },
        { principle: 'resilient', status: 'pass', note: 'Dead-letter handling, message abandonment on transient errors' },
        { principle: 'secure', status: 'pass', note: 'Managed Identity for Service Bus access' },
        { principle: 'tested', status: 'warn', note: 'Unit tests exist but no integration tests' },
        { principle: 'config_correct', status: 'warn', note: 'Config is correct for its own queues but depends on upstream fixing theirs' }
      ],
      dataStores: [
        { name: 'Blob Storage', purpose: 'Archives rating requests for audit trail', fit: 'Good fit — cheap, immutable storage for compliance/debugging.', action: 'Provision storage account. Best-effort write (non-blocking) is the right pattern.' }
      ],
      keyIssues: [
        { severity: 'critical', issue: 'carrierTarget vs carrierContext property mismatch', detail: 'Sends CarrierRatingMessage with "carrierTarget" JSON property. CarrierConnector deserializes with "carrierContext". Result: carrier config is always null.' }
      ]
    },

    carrier_connector: {
      name: 'Carrier Connector',
      readiness: 'partial',
      score: 50,
      role: 'The workhorse. Receives per-carrier rating messages, converts CDM to CSIO XML, calls carrier APIs, parses responses, publishes results.',
      businessLogicLines: '130 lines of premium calculation (simulator). Carrier adapters are built but the CDM-to-CSIO converter is MISSING.',
      verdict: 'The most valuable service in the system. Has real business logic (premium rules), carrier adapters (Aviva, PeaceHills, SGI) with OAuth2 auth, resilience policies, and blob storage archival. The critical missing piece is the CDM-to-CSIO transformer — adapters are ready but have no XML to send.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'No CI/CD pipeline exists' },
        { principle: 'contract_aligned', status: 'fail', note: 'Own copies of CDM models. Uses double for NumberValue (wrong).' },
        { principle: 'scalable', status: 'pass', note: 'Stateless worker, concurrent message processing (10 concurrent), independent scaling' },
        { principle: 'observable', status: 'pass', note: 'OpenTelemetry + custom metrics + Activity tracing per carrier call' },
        { principle: 'resilient', status: 'pass', note: 'Polly retry (3x), circuit breaker (5 failures → 30s break), timeout (30s per request), dead-letter on permanent errors, abandon on transient' },
        { principle: 'secure', status: 'pass', note: 'OAuth2 per carrier (Okta, Auth0, Azure AD), Managed Identity for Azure services' },
        { principle: 'tested', status: 'warn', note: 'Has captured production XML test data but no automated integration tests' },
        { principle: 'config_correct', status: 'warn', note: 'Service Bus config is correct. Carrier API URLs are placeholders (SET-IN-KEYVAULT).' }
      ],
      dataStores: [
        { name: 'Blob Storage', purpose: 'Archives carrier response XML for audit trail and debugging', fit: 'Good fit — stores raw XML responses cheaply. Best-effort write pattern is correct.', action: 'Provision storage account with carrier-responses container.' }
      ],
      keyIssues: [
        { severity: 'critical', issue: 'CDM-to-CSIO transformer does not exist', detail: 'The carrier adapters (Aviva, PeaceHills, SGI) are built and ready. They expect CSIO XML as input. But no code converts CDM fields into CSIO XML. This is the #1 gap in the entire system.' },
        { severity: 'critical', issue: 'CSIO response parser does not exist', detail: 'Carrier APIs return CSIO XML with premiums embedded. No code extracts premiums from response XML.' },
        { severity: 'warning', issue: 'Health check is fake', detail: 'RatingHealthCheck always returns Healthy regardless of Service Bus or Blob Storage connectivity.' },
        { severity: 'warning', issue: 'Flat response structure', detail: 'Sends flat { carrierId, status, ratingResult } but QuoteManagement expects nested { carrierResult: { carrierId, status } }. Fixed by shared contracts.' }
      ]
    },

    schema_cache: {
      name: 'Schema Cache',
      readiness: 'partial',
      score: 45,
      role: 'Stores and serves insurance product schema bundles (field definitions, form config, validation rules, code lists). Frontend queries it to build dynamic forms.',
      businessLogicLines: '8 lines — two MongoDB queries. 629 lines of property-to-property mapping boilerplate.',
      verdict: 'Works but is over-engineered. 637-line SchemaService.cs where 629 lines are field-by-field mapping. For MVP, the key question is: are Alberta PersAuto bundles seeded in the database? If not, the frontend renders an empty form.',
      criteria: [
        { principle: 'deployable', status: 'warn', note: 'Has Dockerfile but no Rating Platform CI/CD pipeline' },
        { principle: 'contract_aligned', status: 'pass', note: 'Uses its own schema models — does not share Rating contracts (correct, different domain)' },
        { principle: 'scalable', status: 'pass', note: 'Stateless API + MongoDB — scales horizontally' },
        { principle: 'observable', status: 'pass', note: 'App Insights + health checks with MongoDB ping' },
        { principle: 'resilient', status: 'pass', note: 'Polly retry policies on MongoDB operations' },
        { principle: 'secure', status: 'warn', note: 'No auth middleware on public endpoints — any client can query schemas' },
        { principle: 'tested', status: 'fail', note: 'No integration tests' },
        { principle: 'config_correct', status: 'warn', note: 'MongoDB connection string is empty in appsettings.json — needs Key Vault reference' }
      ],
      dataStores: [
        { name: 'MongoDB (Cosmos DB)', purpose: 'Stores schema bundles (schemaCache collection) and activation mappings (schemaMetadata collection)', fit: 'Reasonable fit — schema bundles are JSON documents with varying structure. MongoDB handles flexible schemas well.', action: 'Provision Cosmos DB. Seed with Alberta PersAuto bundle containing required fields for Aviva.' }
      ],
      keyIssues: [
        { severity: 'critical', issue: 'Unknown if Alberta PersAuto bundle is seeded', detail: 'The form is schema-driven. If no bundle exists for carrierId=aviva, productCode=PersAuto, intent=quote, the frontend shows nothing.' },
        { severity: 'warning', issue: 'Over-engineered mapping layer', detail: '629 lines of property-to-property mapping in SchemaService.cs. Adds no business value — just converts BSON to DTOs.' }
      ]
    },

    cosmos_db: {
      name: 'Cosmos DB (MongoDB API)',
      readiness: 'not_started',
      score: 10,
      role: 'Document database for quote records and schema bundles. Uses MongoDB API compatibility layer so services use standard MongoDB drivers.',
      businessLogicLines: 'N/A — infrastructure service',
      verdict: 'Good technology choice for this use case. Quote data is document-shaped (varying fields per carrier/province), and Cosmos DB provides global distribution and automatic scaling. MongoDB API means standard drivers work without lock-in. Must be provisioned.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'Not provisioned for Rating Platform' },
        { principle: 'contract_aligned', status: 'pass', note: 'N/A — stores whatever services send it' },
        { principle: 'scalable', status: 'pass', note: 'Cosmos DB auto-scales with provisioned throughput (RU/s)' },
        { principle: 'observable', status: 'warn', note: 'Azure Monitor metrics available but no custom alerts' },
        { principle: 'resilient', status: 'pass', note: 'Built-in replication, automatic failover, point-in-time backup' },
        { principle: 'secure', status: 'warn', note: 'Needs Managed Identity access + network restrictions' },
        { principle: 'tested', status: 'fail', note: 'Cannot test until provisioned' },
        { principle: 'config_correct', status: 'fail', note: 'Connection strings are empty across all services' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'critical', issue: 'Not provisioned', detail: 'Cosmos DB account for Rating Platform does not exist. Must be created with MongoDB API enabled.' },
        { severity: 'warning', issue: 'RU/s budgeting needed', detail: 'Cosmos DB charges per request unit. Need to estimate throughput for quoting volume.' }
      ]
    },

    blob_storage: {
      name: 'Azure Blob Storage',
      readiness: 'not_started',
      score: 10,
      role: 'Archives raw carrier request/response XML for audit trail and debugging.',
      businessLogicLines: 'N/A — infrastructure service',
      verdict: 'Simple, correct use of blob storage. Best-effort write pattern (non-blocking) means storage failures do not break the rating flow. Low priority for MVP but needed for production debugging.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'Not provisioned' },
        { principle: 'contract_aligned', status: 'pass', note: 'N/A' },
        { principle: 'scalable', status: 'pass', note: 'Effectively unlimited' },
        { principle: 'observable', status: 'pass', note: 'Azure Monitor + diagnostic logs available' },
        { principle: 'resilient', status: 'pass', note: 'Built-in redundancy (LRS/GRS)' },
        { principle: 'secure', status: 'warn', note: 'Needs Managed Identity access + private endpoint' },
        { principle: 'tested', status: 'fail', note: 'Cannot test until provisioned' },
        { principle: 'config_correct', status: 'warn', note: 'StorageAccount.AccountName is empty in CarrierConnector config' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'warning', issue: 'Not provisioned', detail: 'Storage account for carrier responses needs creation. Low priority — system works without it.' }
      ]
    },

    key_vault: {
      name: 'Azure Key Vault',
      readiness: 'not_started',
      score: 10,
      role: 'Stores secrets: carrier OAuth2 credentials, database connection strings, APIM keys.',
      businessLogicLines: 'N/A — infrastructure service',
      verdict: 'Essential for production. All carrier API credentials should come from Key Vault, not appsettings.json. For dev/sandbox, connection strings in config are acceptable temporarily.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'Not provisioned for Rating Platform' },
        { principle: 'contract_aligned', status: 'pass', note: 'N/A' },
        { principle: 'scalable', status: 'pass', note: 'Azure managed service' },
        { principle: 'observable', status: 'pass', note: 'Audit logging built-in' },
        { principle: 'resilient', status: 'pass', note: 'Azure managed with SLA' },
        { principle: 'secure', status: 'pass', note: 'Core purpose is security — RBAC-based access' },
        { principle: 'tested', status: 'fail', note: 'Cannot test until provisioned' },
        { principle: 'config_correct', status: 'warn', note: 'Services reference Key Vault but vault does not exist yet' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'warning', issue: 'Not provisioned', detail: 'Key Vault needs creation. For sandbox, can use appsettings.json temporarily. For prod, must use Key Vault references.' }
      ]
    },

    apim: {
      name: 'API Management (APIM)',
      readiness: 'not_started',
      score: 5,
      role: 'API gateway that sits in front of backend services. Handles rate limiting, authentication, request routing, and API key management.',
      businessLogicLines: 'N/A — infrastructure service',
      verdict: 'The BFF currently does what APIM should do (add auth headers, proxy requests). For MVP, the BFF can substitute. For production, APIM provides rate limiting, analytics, and developer portal that the BFF cannot.',
      criteria: [
        { principle: 'deployable', status: 'fail', note: 'Not provisioned for Rating Platform APIs' },
        { principle: 'contract_aligned', status: 'pass', note: 'N/A' },
        { principle: 'scalable', status: 'pass', note: 'Azure managed with auto-scaling tiers' },
        { principle: 'observable', status: 'pass', note: 'Built-in analytics and logging' },
        { principle: 'resilient', status: 'pass', note: 'Azure managed with SLA' },
        { principle: 'secure', status: 'pass', note: 'OAuth validation, rate limiting, IP filtering' },
        { principle: 'tested', status: 'fail', note: 'Not provisioned' },
        { principle: 'config_correct', status: 'fail', note: 'No API definitions registered' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'info', issue: 'Not needed for MVP', detail: 'BFF substitutes for APIM in MVP. APIM should be provisioned for production with proper API policies.' }
      ]
    },

    aviva: {
      name: 'Aviva (Carrier)',
      readiness: 'partial',
      score: 40,
      role: 'External carrier API. REST endpoint via AWS API Gateway. Accepts CSIO XML, returns rated CSIO XML with premiums.',
      businessLogicLines: 'AvivaAdapter: ~191 lines. Auth handler, XML transformation (adds schemaLocation), REST call, response parsing.',
      verdict: 'Adapter is fully built. OAuth2 auth via Auth0 is implemented. Guidewire-specific XML transformation (schemaLocation attribute) is handled. Missing: CDM-to-CSIO converter to feed it XML, and sandbox credentials.',
      criteria: [
        { principle: 'deployable', status: 'pass', note: 'Adapter code is deployed as part of CarrierConnector' },
        { principle: 'contract_aligned', status: 'pass', note: 'Accepts CsioRequest interface — will work once converter exists' },
        { principle: 'scalable', status: 'warn', note: 'Subject to Aviva API rate limits — unknown what those are' },
        { principle: 'observable', status: 'pass', note: 'Per-carrier Activity tracing, timing metrics, error categorization' },
        { principle: 'resilient', status: 'pass', note: 'Polly retry (3x), circuit breaker (5 failures), 30s timeout' },
        { principle: 'secure', status: 'warn', note: 'OAuth2 credentials are placeholders — need real sandbox creds from Aviva' },
        { principle: 'tested', status: 'pass', note: 'Has captured production XML request/response as golden test data' },
        { principle: 'config_correct', status: 'warn', note: 'API URL is configured but credentials need Key Vault' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'critical', issue: 'No CDM-to-CSIO converter', detail: 'Adapter is ready but has no XML to send. The converter must be built first.' },
        { severity: 'warning', issue: 'Need sandbox credentials', detail: 'OAuth2 client_id/secret must be obtained from Aviva. Typically 2-6 weeks lead time.' }
      ]
    },

    peace_hills: {
      name: 'Peace Hills (Carrier)',
      readiness: 'partial',
      score: 40,
      role: 'External carrier API. REST endpoint via Guidewire Cloud. Accepts CSIO XML as text/plain, returns rated CSIO XML.',
      businessLogicLines: 'PeaceHillsAdapter: ~126 lines. OAuth2 via Okta, REST call, response parsing.',
      verdict: 'Adapter is built. Simpler than Aviva (no XML transformation needed — sends raw CSIO as text/plain). Good MVP candidate because Peace Hills is Alberta-based. Missing: CDM-to-CSIO converter and sandbox credentials.',
      criteria: [
        { principle: 'deployable', status: 'pass', note: 'Part of CarrierConnector' },
        { principle: 'contract_aligned', status: 'pass', note: 'Accepts CsioRequest interface' },
        { principle: 'scalable', status: 'warn', note: 'Subject to Peace Hills API rate limits' },
        { principle: 'observable', status: 'pass', note: 'Per-carrier tracing and metrics' },
        { principle: 'resilient', status: 'pass', note: 'Same Polly policies as other adapters' },
        { principle: 'secure', status: 'warn', note: 'Okta OAuth2 credentials are placeholders' },
        { principle: 'tested', status: 'warn', note: 'No captured test XML for Peace Hills auto' },
        { principle: 'config_correct', status: 'warn', note: 'API URL configured, credentials need Key Vault' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'critical', issue: 'No CDM-to-CSIO converter', detail: 'Same blocker as Aviva — adapter ready, no XML to feed it.' },
        { severity: 'warning', issue: 'Need sandbox credentials', detail: 'Okta OAuth2 credentials must be obtained from Peace Hills.' },
        { severity: 'info', issue: 'Zero proprietary Z-codes', detail: 'Peace Hills uses entirely generic CSIO codes (per czo-extractor). Simpler to implement than Aviva.' }
      ]
    },

    sgi: {
      name: 'SGI (Carrier)',
      readiness: 'partial',
      score: 35,
      role: 'External carrier API. SOAP-over-REST via Azure AD. Accepts CSIO XML wrapped in SOAP envelope.',
      businessLogicLines: 'SgiAdapter: ~125 lines + SgiSoapClient for SOAP wrapping.',
      verdict: 'Adapter is built but SOAP adds complexity. Not recommended as first MVP carrier — use Peace Hills or Aviva first. Lower priority.',
      criteria: [
        { principle: 'deployable', status: 'pass', note: 'Part of CarrierConnector' },
        { principle: 'contract_aligned', status: 'pass', note: 'Accepts CsioRequest interface' },
        { principle: 'scalable', status: 'warn', note: 'Subject to SGI API rate limits' },
        { principle: 'observable', status: 'pass', note: 'Per-carrier tracing' },
        { principle: 'resilient', status: 'pass', note: 'Same Polly policies' },
        { principle: 'secure', status: 'warn', note: 'Azure AD OAuth2 credentials are placeholders' },
        { principle: 'tested', status: 'fail', note: 'No test data captured' },
        { principle: 'config_correct', status: 'warn', note: 'SOAP endpoint configured, credentials need Key Vault' }
      ],
      dataStores: [],
      keyIssues: [
        { severity: 'critical', issue: 'No CDM-to-CSIO converter', detail: 'Same blocker as all carriers.' },
        { severity: 'warning', issue: 'SOAP complexity', detail: 'Requires SOAP envelope wrapping. More complex than REST carriers. Lower MVP priority.' }
      ]
    }
  },

  /* ── Architecture Review Summary ─────────────────────────── */
  architectureVerdict: {
    overallScore: 35,
    headline: 'Solid foundation, broken connections',
    summary: 'The architecture pattern (queue-based async with carrier adapters) is correct for insurance quoting. The implementation has strong individual components — especially the Carrier Connector with its adapter pattern, resilience policies, and telemetry. However, the services cannot communicate due to contract drift (4 copies of CdmData, property name mismatches, response structure disagreements) and configuration mismatches (wrong Service Bus namespaces, empty URLs). The shared contracts package is the highest-leverage fix.',
    strengths: [
      'Queue-based async pattern is correct for slow carrier APIs',
      'Carrier adapter pattern is well-designed (pluggable, per-carrier auth)',
      'Resilience policies (Polly retry, circuit breaker, timeout) are production-grade',
      'OpenTelemetry tracing allows end-to-end request tracking',
      'CDM dynamic field strategy handles varying carrier requirements',
      'Schema-driven forms enable adding carriers without code changes'
    ],
    weaknesses: [
      'Contract drift: 4 copies of CdmData with no shared package — property names diverge (carrierTarget vs carrierContext)',
      'Property name mismatch: carrierTarget vs carrierContext breaks deserialization',
      'Response structure mismatch: flat vs nested means prices never reach frontend',
      'Zero CI/CD pipelines for Rating Platform services',
      'CDM-to-CSIO converter does not exist (adapters have nothing to send)',
      'Infrastructure not provisioned (Service Bus, Cosmos DB, Key Vault)',
      'No shared contracts package — each service maintains its own copies'
    ]
  },

  /* ── Parallel Tracks (what can run simultaneously) ────── */
  tracks: [
    {
      id: 'track_infra',
      label: 'Infrastructure',
      color: '#a371f7',
      phases: ['phase_0', 'phase_1'],
      description: 'Azure provisioning and CI/CD pipelines'
    },
    {
      id: 'track_contracts',
      label: 'Contracts & Fixes',
      color: '#3fb950',
      phases: ['phase_2', 'phase_3'],
      description: 'Shared package + component bug fixes'
    },
    {
      id: 'track_converter',
      label: 'CDM-to-CSIO (Tier 2)',
      color: '#f85149',
      phases: ['phase_4'],
      description: 'The missing converter — can start independently. Optional for MVP demo.'
    },
    {
      id: 'track_integration',
      label: 'Integration',
      color: '#f778ba',
      phases: ['phase_5'],
      description: 'End-to-end testing — needs all tracks complete'
    }
  ],
  dependencies: [
    { from: 'phase_0', to: 'phase_1', reason: 'Need Azure subscription before creating pipelines' },
    { from: 'phase_2', to: 'phase_3', reason: 'Shared contracts must exist before services can reference them' },
    { from: 'phase_1', to: 'phase_5', reason: 'Services must be deployable before integration testing' },
    { from: 'phase_3', to: 'phase_5', reason: 'Component bugs must be fixed before end-to-end flow works' },
    { from: 'phase_4', to: 'phase_5', reason: 'Converter must exist to get real carrier quotes' }
  ],
  parallelGroups: [
    { label: 'Can run simultaneously', phases: [['phase_0','phase_1'], ['phase_2','phase_3'], ['phase_4']], note: 'Infrastructure, Contracts, and Converter work are independent — assign to different people or work streams' },
    { label: 'Must wait', phases: [['phase_5']], note: 'Integration testing requires Infrastructure and Component Fixes complete. Can use simulator (Tier 1) without CDM-to-CSIO converter.' }
  ],
  disclaimer: 'This plan is subject to change as we validate infrastructure access and carrier API availability. Tier 1 (Simulator MVP) can demo in 2-3 weeks. Tier 2 (Real Carriers) adds 3-6 weeks depending on CSIO package compatibility and carrier credential lead times.',

  /* ── Validation Findings (2026-03-29 deep dive) ─────────── */
  validationFindings: {
    date: '2026-03-29',
    summary: 'Deep-dive verification against all 5 critical repos. Every blocker re-checked against actual source code. Two previously claimed issues were disproven; all remaining blockers confirmed still present and unfixed.',
    confirmed: [
      { id: 'vf-1', component: 'BFF', issue: 'Thread-safety bug in SetApiKeyHeader', status: 'confirmed', detail: 'QuoteService.cs:77-88 still mutates shared DefaultRequestHeaders. Called 6 times across async operations. HttpClient is singleton via AddHttpClient<QuoteService>().', severity: 'critical' },
      { id: 'vf-2', component: 'BFF', issue: 'Polly resilience policies commented out', status: 'confirmed', detail: 'Program.cs line 19 — .AddResiliencePolicies() is still commented. Infrastructure exists (PollyPolicyOptions.cs, HttpClientBuilderExtensions.cs) but not wired.', severity: 'high' },
      { id: 'vf-3', component: 'BFF', issue: 'QuoteManagementApiUrl empty in prod config', status: 'confirmed', detail: 'appsettings.json:35 has empty string. Dev config (appsettings.Development.json) correctly points to localhost:7124. Intentional pattern but requires deployment-time override.', severity: 'medium' },
      { id: 'vf-4', component: 'QuoteManagement', issue: 'Wrong Service Bus namespace', status: 'confirmed', detail: 'appsettings.json lines 16 & 23 still reference sbns-rating-dev-001. Both AzServiceBus and RatingServiceBus sections are wrong. Orchestrator expects sbns-ratingplatform-dev-001.', severity: 'critical' },
      { id: 'vf-5', component: 'QuoteManagement', issue: 'Wrong queue names', status: 'confirmed', detail: 'sbq-rating-requests-dev and sbq-rating-responses-dev in all 3 config sections. Orchestrator expects sbq-initial-rating-requests and sbq-rating-responses.', severity: 'critical' },
      { id: 'vf-6', component: 'QuoteManagement', issue: 'No environment-specific appsettings', status: 'confirmed', detail: 'Only one appsettings.json with hardcoded dev values. No Development, QA, or Production variants.', severity: 'high' },
      { id: 'vf-7', component: 'Orchestrator → Connector', issue: 'carrierTarget vs carrierContext mismatch', status: 'confirmed', detail: 'Orchestrator sends CarrierTarget object (Models/Messages/CarrierRatingMessage.cs). CarrierConnector reads carrierContext (Models/Messages/RatingRequestMessage.cs with [JsonPropertyName("carrierContext")]). Carrier config silently nulls.', severity: 'critical' },
      { id: 'vf-8', component: 'Connector → QuoteMgmt', issue: 'Response format mismatch (flat vs nested)', status: 'confirmed', detail: 'CarrierConnector sends flat {carrierId, status, ratingResult}. QuoteManagement expects nested {carrierResult: {carrierId, status, premiumSummary}}. Every response silently fails deserialization.', severity: 'critical' },
      { id: 'vf-9', component: 'RPM Client', issue: 'CarrierTargets sent as null', status: 'confirmed', detail: 'Quote.razor.cs:726-735 explicitly sets CarrierTargets = null in UpdateQuoteRequest. No carrier selection UI exists.', severity: 'critical' },
      { id: 'vf-10', component: 'RPM Client', issue: 'No async polling for results', status: 'confirmed', detail: 'Quote.razor.cs:752-766 calls RateQuoteAsync() then immediately GetOffersAsync(). No polling loop, no retry, no wait. Results always empty.', severity: 'critical' },
      { id: 'vf-11', component: 'RPM Client', issue: 'SQL Server + Azure AD mandatory', status: 'confirmed', detail: 'Program.cs:128-136 requires IdentityDatabase SQL connection. Azure AD is mandatory on all pages via fallback authorization policy. App won\'t start without both.', severity: 'critical' },
      { id: 'vf-12', component: 'RPM Client', issue: 'CSIO mapping commented out', status: 'confirmed', detail: 'Quote.razor.cs:36-37 has ICsioMappingService injection commented. Lines 705-707 have the MapToAcordAsync call commented. Sends raw CDM instead.', severity: 'medium' },
      { id: 'vf-13', component: 'CarrierConnector', issue: 'Health check hardcoded', status: 'confirmed', detail: 'RatingHealthCheck.cs: isHealthy = true with no actual dependency checks.', severity: 'low' }
    ],
    disproven: [
      { id: 'vd-1', claim: 'ServiceBusSettings not registered in DI', reality: 'Program.cs has Configure<RatingServiceBusSettings>() and Configure<OpportunitiesServiceBusSettings>() properly registered. Someone (likely Mehul) fixed this. Removed from task list.', impact: 'Saved ~5 min of unnecessary work.' },
      { id: 'vd-2', claim: 'decimal vs double type mismatch for premiums', reality: 'Both Orchestrator PremiumSummary and CarrierConnector PremiumSummary use decimal for all monetary fields. No mismatch exists in the critical path.', impact: 'Removed false alarm from critical blockers.' }
    ],
    newInsight: 'QuoteManagement DI registration uses RatingServiceBusSettings (new class name) rather than the original ServiceBusSettings. The config section mapping should be verified at runtime to ensure the correct class resolves.'
  },

  /* ── Terraform / IaC Discovery (2026-03-29) ─────────────── */
  terraformDiscovery: {
    date: '2026-03-29',
    headline: 'Full Terraform exists — we can self-provision a sandbox',
    summary: 'A complete Terraform repository (Rating.Platform.Infrastructure) with modular IaC for every Azure resource the platform needs already exists. This eliminates the dependency on DevOps for infrastructure provisioning.',
    primaryRepo: {
      name: 'Rating.Platform.Infrastructure',
      path: 'knowledge/repos/Rating.Platform.Infrastructure',
      tool: 'Terraform / OpenTofu',
      environments: ['dev', 'qa'],
      structure: 'environments/{env}/main.tf + modules/foundation/ + modules/platform/'
    },
    secondaryRepos: [
      { name: 'Rival.Platform.Infrastructure', tool: 'Bicep', scope: 'Full platform (Journal, Quoting, Customers, etc.)', files: 247 },
      { name: 'Rival.RQuote.Infrastructure', tool: 'Bicep', scope: 'RQuote system', files: 'Multiple' },
      { name: 'DevOps.ObservabilityandMonitroingCoralogix', tool: 'Terraform', scope: 'Coralogix monitoring alerts', files: 'Multiple' }
    ],
    modulesAvailable: [
      { module: 'Service Bus', details: 'Namespace + 3 queues (sbq-initial-rating-requests, sbq-rating-jobs, sbq-rating-responses) with correct names', critical: true },
      { module: 'SQL Server', details: 'Azure SQL with CentralSchema database (S0 SKU)', critical: true },
      { module: 'Cosmos DB', details: 'MongoDB API 7.0 with RatingRules, RatingLedger, Schema databases and shard keys', critical: true },
      { module: 'Storage Account', details: 'Rating audit logs container with blob hierarchy', critical: false },
      { module: 'Key Vault', details: 'RBAC authorization with auto-generated secrets for each Container App', critical: false },
      { module: 'Container Registry', details: 'ACR (Basic for dev, Standard for qa) with Managed Identity only', critical: true },
      { module: 'Container App Environment', details: 'Workload profiles, internal load balancer, VNet integration', critical: true },
      { module: 'Networking', details: 'VNet with Container Apps subnet (10.10.0.0/23), service endpoints for CosmosDB/SQL/Storage/KeyVault', critical: false },
      { module: 'Log Analytics', details: 'Workspace + App Insights (30-day retention, 2GB daily quota)', critical: false },
      { module: 'RBAC', details: 'Managed identities with Service Bus Sender/Receiver, Storage Blob Contributor roles', critical: true }
    ],
    deploymentOptions: [
      {
        id: 'option_a',
        name: 'Use Existing Terraform (Recommended)',
        effort: '2-4 hours',
        steps: [
          'Clone Rating.Platform.Infrastructure',
          'Create environments/sandbox/ config pointing to your subscription',
          'az login && terraform init && terraform plan && terraform apply',
          'All resources provisioned with correct names, RBAC, and networking'
        ],
        pros: ['Repeatable', 'All naming conventions match', 'RBAC pre-configured', 'Tested by DevOps team'],
        cons: ['Need Terraform/OpenTofu installed', 'May need state backend setup']
      },
      {
        id: 'option_b',
        name: 'Azure CLI Manual Provisioning (Fastest)',
        effort: '1-2 hours',
        steps: [
          'az group create -n rg-ratingplatform-sandbox-001 -l canadacentral',
          'az servicebus namespace create + 3 queue creates',
          'az cosmosdb create --kind MongoDB --server-version 7.0',
          'az sql server create + az sql db create',
          'az storage account create + az acr create'
        ],
        pros: ['No Terraform knowledge needed', 'Fast for sandbox', 'Direct control'],
        cons: ['Not repeatable', 'Must manually match naming conventions', 'No RBAC automation']
      }
    ],
    whatThisMeans: 'The DevOps dependency — previously the biggest risk — is eliminated. With Azure subscription access and the existing Terraform, we can provision a complete sandbox in hours, not weeks. The IaC has already been reviewed and applied to dev/qa environments.',
    whatWeNeed: [
      { item: 'Azure subscription with Contributor access', from: 'Management / Deji', critical: true },
      { item: 'Push access to 5 repos (BFF, QuoteManagement, Orchestrator, CarrierConnector, RPM Client)', from: 'Management', critical: true },
      { item: 'NuGet PAT for private Rival feed', from: 'DevOps', critical: true },
      { item: 'Azure AD app registration (or permission to create one)', from: 'Management / Deji', critical: true },
      { item: '2-3 weeks calendar time', from: 'Management', critical: true }
    ],
    whatWeDontNeed: [
      'Full Skunk Works team — code fixes are 8-10 hours of focused work',
      'DevOps to provision infrastructure — Terraform is already written',
      'Real carrier credentials for Tier 1 — simulator mode works',
      'APIM gateway for MVP — BFF calls QuoteManagement directly'
    ],
    stats: {
      terraformFiles: 176,
      bicepFiles: 247,
      dockerfiles: 56,
      iacRepos: 6,
      modulesReady: 10,
      estimatedProvisionTime: '2-4 hours with Terraform'
    }
  }
};
