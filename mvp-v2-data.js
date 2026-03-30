window.MVP_V2_DATA = {
  goal: "A broker in Alberta fills out an auto insurance quote form, submits it, and sees real premium quotes from Aviva and/or Peace Hills within 60 seconds.",

  approach: "bottom-up",

  environments: [
    { id: "sandbox", name: "Sandbox", description: "Isolated testing -- prove each component works alone" },
    { id: "dev", name: "Dev", description: "Integration -- all components wired together" },
    { id: "prod", name: "Prod", description: "Production -- real brokers, real carriers" }
  ],

  executionOrder: [
    {
      step: 1,
      id: "carrier_connector",
      name: "Carrier Connector",
      subtitle: "The actual carrier API calls",
      why_first: "This is the core business logic. If carrier APIs don't work, nothing else matters. Prove this first.",
      azure_resource: "Container App (Worker Service)",
      azure_name: "ca-carrierconnector-{env}-001",
      current_state: "functional-simulator",
      state_label: "Simulator Only",
      state_color: "yellow",

      problems: [
        {
          id: "cc-1",
          title: "Always routes to simulator -- never calls real carrier APIs",
          severity: "critical",
          description: "RatingService.RateAsync() always calls PremiumCalculator (simulator). The carrier adapters (AvivaAdapter, PeaceHillsAdapter) are fully built but never invoked.",
          fix: "Add IRatingModeResolver to toggle between simulator and real carrier mode per carrier. Wire RatingService to call ICarrierAdapterFactory when mode is RealCarrier.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can write the mode resolver, update RatingService routing logic, and wire DI. Human must verify the adapter integration works against real carrier sandbox."
        },
        {
          id: "cc-2",
          title: "CDM-to-CSIO XML transformer does not exist",
          severity: "critical",
          description: "All carrier APIs (Aviva, Peace Hills) require CSIO 1.48 ACORD XML. The adapters expect a CsioRequest with pre-built XML, but nothing generates it from CDM data. This is the single largest missing piece of code.",
          fix: "Build ICdmToCsioTransformer that converts CDM v2 dynamic field bag to CSIO 1.48 ACORD XML for Personal Auto NewBusiness. Check if existing Cssi.Schemas.Csio.Xml NuGet package is .NET 9 compatible first -- could cut effort in half.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can build the transformer class with XML generation. Requires human review of CSIO compliance and testing against carrier sandbox."
        },
        {
          id: "cc-3",
          title: "CSIO response parser does not exist",
          severity: "critical",
          description: "Carrier responses come back as CSIO XML but nothing parses premiums out of them back into RatingResponseMessage format.",
          fix: "Build ICsioResponseParser that extracts premiums, coverages, surcharges, decline reasons from CSIO XML response.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can build the parser. Needs sample carrier responses for testing."
        },
        {
          id: "cc-4",
          title: "Storage write crashes message processing",
          severity: "high",
          description: "Blob storage write in CarrierRatingConsumerService has no try/catch. Storage failure crashes entire pipeline, prevents premium response from being published.",
          fix: "Wrap storage write in try/catch, log failure, continue to publish response.",
          claude_can_do: "yes",
          claude_detail: "Straightforward code change."
        },
        {
          id: "cc-5",
          title: "decimal vs double for NumberValue",
          severity: "medium",
          description: "DynamicFieldValue.NumberValue is double in CarrierConnector but decimal in upstream services. Insurance premiums need exact arithmetic.",
          fix: "Change NumberValue from double? to decimal? in DynamicFieldValue.cs",
          claude_can_do: "yes",
          claude_detail: "Simple type change."
        },
        {
          id: "cc-6",
          title: "Health check always returns Healthy",
          severity: "low",
          description: "Hardcoded isHealthy = true. Container Apps won't know if the service is actually broken.",
          fix: "Check Service Bus processor status and storage connectivity.",
          claude_can_do: "yes",
          claude_detail: "Straightforward code change."
        }
      ],

      test_to_verify: "Send a test CDM payload with Alberta auto data. CarrierConnector converts to CSIO XML, calls Aviva QA sandbox, gets real premium back. Premium is non-zero and contains coverage breakdown.",

      deploy_to: "Sandbox first. Can also test locally with dotnet run if Azure CLI RBAC is configured."
    },
    {
      step: 2,
      id: "orchestrator",
      name: "Rating Orchestrator",
      subtitle: "Fan-out to multiple carriers",
      why_next: "Once one carrier works, the Orchestrator fans out to multiple carriers in parallel. It's the multiplier.",
      azure_resource: "Container App (Worker Service)",
      azure_name: "ca-ratingorchestrator-{env}-001",
      current_state: "degraded",
      state_label: "Degraded",
      state_color: "yellow",

      problems: [
        {
          id: "orch-1",
          title: "Crashes at startup -- empty StorageAccount config",
          severity: "critical",
          description: "Program.cs:66 throws InvalidOperationException when StorageAccount.AccountName is empty.",
          fix: "Make storage config optional or provide a valid storage account name.",
          claude_can_do: "yes",
          claude_detail: "Simple config/code change."
        },
        {
          id: "orch-2",
          title: "Crashes at startup -- empty APIM config",
          severity: "critical",
          description: "Program.cs:72 throws InvalidOperationException when Apim.BaseUrl is empty.",
          fix: "Make APIM config optional for MVP (not needed when QuoteManagement reads responses directly).",
          claude_can_do: "yes",
          claude_detail: "Simple code change."
        },
        {
          id: "orch-3",
          title: "Competing consumer on response queue",
          severity: "critical",
          description: "Both Orchestrator and QuoteManagement listen on sbq-rating-responses. Messages randomly split between them.",
          fix: "Disable Orchestrator's RatingResponseProcessorService for MVP.",
          claude_can_do: "yes",
          claude_detail: "Comment out one line in Program.cs."
        },
        {
          id: "orch-4",
          title: "carrierTarget vs carrierContext property name mismatch",
          severity: "critical",
          description: "Orchestrator sends 'carrierTarget' in JSON, CarrierConnector reads 'carrierContext'. Carrier config is always null.",
          fix: "Align property names -- either rename in Orchestrator or CarrierConnector.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can rename. Team must agree which name wins."
        },
        {
          id: "orch-5",
          title: "Fan-out MessageId not idempotent",
          severity: "medium",
          description: "MessageId is Guid.NewGuid() each time. Retries create duplicate carrier messages.",
          fix: "Use deterministic MessageId: {jobId}-{carrierId}",
          claude_can_do: "yes",
          claude_detail: "Simple code change."
        }
      ],

      test_to_verify: "Send a test RatingRequestMessage with 2 carrier targets (Aviva + Peace Hills). Orchestrator fans out 2 messages to sbq-rating-jobs. Each message has correct carrier routing.",

      deploy_to: "Sandbox, alongside CarrierConnector."
    },
    {
      step: 3,
      id: "service_bus",
      name: "Azure Service Bus",
      subtitle: "Message queue infrastructure",
      why_next: "The glue between all services. Must exist and have correct queues before wiring services together.",
      azure_resource: "Azure Service Bus (Standard tier)",
      azure_name: "sbns-ratingplatform-{env}-001",
      current_state: "provisioned",
      state_label: "Provisioned",
      state_color: "blue",
      is_infrastructure: true,

      problems: [
        {
          id: "sb-1",
          title: "Namespace exists — verify queues are created",
          severity: "medium",
          description: "sbns-ratingplatform-dev-001 is provisioned in rg-ratingplatform-dev-001. Need to verify the 3 queues exist: sbq-initial-rating-requests, sbq-rating-jobs, sbq-rating-responses.",
          fix: "az servicebus queue list --namespace-name sbns-ratingplatform-dev-001 --resource-group rg-ratingplatform-dev-001. Create any missing queues.",
          claude_can_do: "no",
          claude_detail: "Requires Azure CLI or Portal access to verify/create queues."
        },
        {
          id: "sb-2",
          title: "RBAC not configured for developers",
          severity: "high",
          description: "DefaultAzureCredential needs Azure Service Bus Data Sender/Receiver roles assigned to developer accounts.",
          fix: "az role assignment create for each developer.",
          claude_can_do: "no",
          claude_detail: "Requires Azure admin access."
        }
      ],

      test_to_verify: "az servicebus queue list shows all 3 queues: sbq-initial-rating-requests, sbq-rating-jobs, sbq-rating-responses.",

      deploy_to: "Already provisioned via Terraform (verify). Same namespace across sandbox/dev."
    },
    {
      step: 4,
      id: "quote_mgmt",
      name: "Quote Management",
      subtitle: "Quote persistence + Service Bus publishing",
      why_next: "Saves quotes to database and publishes rating requests to Service Bus. Connects the REST API world to the async message world.",
      azure_resource: "Container App (Web API)",
      azure_name: "ca-quotemgmt-{env}-001",
      current_state: "broken",
      state_label: "Broken",
      state_color: "red",

      problems: [
        {
          id: "qm-1",
          title: "Wrong Service Bus namespace -- messages go nowhere",
          severity: "critical",
          description: "Points to sbns-rating-dev-001 but infrastructure uses sbns-ratingplatform-dev-001. Messages are published to a namespace that doesn't exist.",
          fix: "Change namespace in ALL 3 config sections (AzServiceBus, RatingServiceBus, ServiceBusSettings) to sbns-ratingplatform-dev-001.",
          claude_can_do: "yes",
          claude_detail: "Config file edit."
        },
        {
          id: "qm-2",
          title: "Wrong queue names",
          severity: "critical",
          description: "Uses sbq-rating-requests-dev but Orchestrator listens on sbq-initial-rating-requests. Same for response queue.",
          fix: "Change queue names in all 3 config sections.",
          claude_can_do: "yes",
          claude_detail: "Config file edit."
        },
        {
          id: "qm-4",
          title: "Response format mismatch -- flat vs nested",
          severity: "critical",
          description: "CarrierConnector sends flat {carrierId, status, ratingResult}. QuoteManagement expects nested {carrierResult: {carrierId, status, premiumSummary}}. Every response is silently discarded.",
          fix: "Update QuoteManagement's RatingResponseMessage to accept flat structure (less disruptive).",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can refactor the DTO. Team must agree on direction."
        },
        {
          id: "qm-5",
          title: "CarrierTargets always null from frontend",
          severity: "critical",
          description: "RPM Client sends null for CarrierTargets. QuoteManagement fails validation: 'CarrierTargets must be present and non-empty.'",
          fix: "Either fix frontend to send carrier targets, or have QuoteManagement default to configured carriers when null.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can implement either approach. Team must decide which."
        },
        {
          id: "qm-6",
          title: "Cosmos DB provisioned — connection string not configured",
          severity: "high",
          description: "cosdb-quotemanagement-dev-001 is provisioned in rg-quotemanagement-dev-001 (RPM subscription). Connection string needs to be added to QuoteManagement appsettings.json and collections (quoteWip) need creation.",
          fix: "Get connection string from Azure Portal for cosdb-quotemanagement-dev-001. Add to appsettings.json MongoDB section. Create quoteWip collection.",
          claude_can_do: "partially",
          claude_detail: "Claude can update appsettings.json once connection string is provided. Collection creation requires Azure CLI or Portal."
        },
        {
          id: "qm-7",
          title: "3 overlapping Service Bus config sections",
          severity: "high",
          description: "AzServiceBus, RatingServiceBus, and ServiceBusSettings all define queue names differently. Different code reads different sections.",
          fix: "Audit which code reads which section. Ensure all 3 agree.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can audit and consolidate. Human should verify."
        }
      ],

      test_to_verify: "POST to /api/v1/quotes to create a quote, then POST to /api/v1/quotes/{id}/rate. Message appears in sbq-initial-rating-requests queue.",

      deploy_to: "Dev environment (needs MongoDB)."
    },
    {
      step: 5,
      id: "bff",
      name: "Web BFF",
      subtitle: "API gateway / proxy layer",
      why_next: "Thin proxy between frontend and backend. Three quick fixes to make it functional.",
      azure_resource: "Container App (Web API)",
      azure_name: "ca-webbff-{env}-001",
      current_state: "broken",
      state_label: "Broken",
      state_color: "red",

      problems: [
        {
          id: "bff-1",
          title: "Empty QuoteManagementApiUrl -- all quote calls fail silently",
          severity: "critical",
          description: "appsettings.json has QuoteManagementApiUrl: ''. BFF has no URL to proxy requests to.",
          fix: "Set to QuoteManagement's Container App URL or localhost.",
          claude_can_do: "yes",
          claude_detail: "Config file edit."
        },
        {
          id: "bff-2",
          title: "Thread-unsafe DefaultRequestHeaders mutation",
          severity: "critical",
          description: "SetApiKeyHeader modifies shared HttpClient.DefaultRequestHeaders on every request. Race condition under concurrency.",
          fix: "Use per-request HttpRequestMessage headers instead of DefaultRequestHeaders.",
          claude_can_do: "yes",
          claude_detail: "Code refactor -- well-understood .NET pattern."
        },
        {
          id: "bff-3",
          title: "Polly resilience policies commented out",
          severity: "medium",
          description: "Retry and circuit breaker are configured but the registration line is commented out in Program.cs.",
          fix: "Uncomment the .AddResiliencePolicies() line.",
          claude_can_do: "yes",
          claude_detail: "Uncomment one line."
        }
      ],

      test_to_verify: "Call BFF quote endpoints. Requests are proxied to QuoteManagement and responses return correctly.",

      deploy_to: "Dev environment."
    },
    {
      step: 6,
      id: "rpm_client",
      name: "RPM Client (Frontend)",
      subtitle: "Broker-facing Blazor web app",
      why_next: "Last in the chain. By this point, everything underneath is proven to work.",
      azure_resource: "Container App (Web App)",
      azure_name: "ca-rpmclient-{env}-001",
      current_state: "functional-with-gaps",
      state_label: "Functional (gaps)",
      state_color: "yellow",

      problems: [
        {
          id: "rpm-1",
          title: "No async polling -- offers always empty",
          severity: "critical",
          description: "OnGetQuote calls RateQuoteAsync then immediately GetOffersAsync. Rating is async via Service Bus (5-30 seconds). Offers will always be empty.",
          fix: "Implement polling loop: call GetOffersAsync every 3 seconds until pricingState is 'Rated' or timeout (60s). Show loading spinner.",
          claude_can_do: "yes-with-review",
          claude_detail: "Claude can write the polling loop with Blazor StateHasChanged. Human should review UX."
        },
        {
          id: "rpm-2",
          title: "Requires SQL Server + Azure AD + user seeding",
          severity: "critical",
          description: "ASP.NET Identity needs SQL Server. Every page requires Azure AD login. Users must be pre-seeded in the database.",
          fix: "Phase 0 prerequisites -- provision SQL Server, run EF migrations, seed demo users, verify Azure AD app registration.",
          claude_can_do: "partially",
          claude_detail: "Claude can write SQL seed scripts and config. Provisioning requires Azure/Docker access."
        },
        {
          id: "rpm-3",
          title: "Schema bundles missing dropdown values",
          severity: "high",
          description: "SchemaCache needs Auto Alberta data loaded (code lists for provinces, vehicle makes, coverage codes, etc.) for the form to render.",
          fix: "Author and load Auto Alberta schema bundle via SchemaCache InternalSync endpoint.",
          claude_can_do: "yes",
          claude_detail: "Claude can generate the full schema bundle JSON with all code lists."
        }
      ],

      test_to_verify: "Broker logs in, fills out Auto Alberta quote form, clicks Submit, sees loading spinner, then sees premium offers from Aviva and/or Peace Hills within 60 seconds.",

      deploy_to: "Dev environment (needs SQL Server, Azure AD, BFF, and all backend services)."
    }
  ],

  prerequisites: [
    { id: "prereq-sb", name: "Service Bus Namespace", status: "provisioned", resource: "sbns-ratingplatform-dev-001 (rg-ratingplatform-dev-001)" },
    { id: "prereq-mongo", name: "MongoDB / Cosmos DB", status: "provisioned", resource: "cosdb-quotemanagement-dev-001 (rg-quotemanagement-dev-001)" },
    { id: "prereq-sql", name: "SQL Server (Identity)", status: "provisioned", resource: "sqlsrv-ratingplatform-dev-001" },
    { id: "prereq-ad", name: "Azure AD App Registration", status: "unverified", resource: "ClientId: 51a0183f-..." },
    { id: "prereq-acr", name: "Container Registry", status: "provisioned", resource: "acrratingplatformdev001" },
    { id: "prereq-keyvault", name: "Key Vault", status: "provisioned", resource: "kvratingplatformdev001" }
  ],

  decisions: [
    {
      id: "d1",
      question: "Which property name wins: carrierTarget or carrierContext?",
      options: ["Rename in Orchestrator to carrierContext", "Rename in CarrierConnector to carrierTarget"],
      recommendation: "Rename in CarrierConnector to carrierTarget (Orchestrator has more code depending on the name)",
      status: "pending"
    },
    {
      id: "d2",
      question: "Response format: update sender (CarrierConnector) or receiver (QuoteManagement)?",
      options: ["Update QuoteManagement to accept flat structure", "Update CarrierConnector to wrap in carrierResult"],
      recommendation: "Update QuoteManagement (less disruptive -- it's already broken and needs fixes)",
      status: "pending"
    },
    {
      id: "d3",
      question: "CarrierTargets population: fix in frontend or backend?",
      options: ["Frontend sends carrier selections", "Backend defaults to configured carriers when null"],
      recommendation: "Backend defaults for MVP (faster), frontend carrier selection post-MVP",
      status: "pending"
    },
    {
      id: "d4",
      question: "Can existing Cssi.Schemas.Csio.Xml package be used with .NET 9?",
      options: ["Yes -- reuse package (5-8 day CSIO effort)", "No -- build from scratch (15-20 day effort)"],
      recommendation: "Check compatibility immediately -- this is the binary decision point for Tier 2 timeline",
      status: "needs-investigation"
    }
  ],

  timeline: {
    tier1: {
      name: "Tier 1: Simulator MVP",
      description: "End-to-end flow with simulated premiums",
      engineering_days: "6-8",
      calendar_weeks: "2-3",
      what_you_get: "Broker submits form -> sees simulated premium quotes from Aviva + Peace Hills"
    },
    tier2: {
      name: "Tier 2: Real Carrier MVP",
      description: "Real Aviva + Peace Hills API calls with CSIO XML",
      engineering_days: "20-50",
      calendar_weeks: "4-10",
      what_you_get: "Broker submits form -> sees REAL premium quotes from actual carrier APIs",
      depends_on: "Cssi.Schemas.Csio.Xml compatibility (best case 20 days, worst case 50 days)"
    }
  }
};
