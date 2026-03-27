window.ACTION_PLAN_DATA = {
  generatedAt: "2026-03-27T14:00:00Z",

  mvpGoal: "One insurance quote flows end-to-end: a broker fills out a form in RPM Client, submits it, the request reaches the Rating Orchestrator, gets routed to the Carrier Connector, a premium is calculated, and the result is displayed back to the broker.",

  mvpCriticalPath: [
    {
      order: 1,
      title: "Fix BFF QuoteManagementApiUrl",
      description: "The BFF's appsettings.json has an empty QuoteManagementApiUrl. All quote API calls from RPM Client silently fail because the BFF has no downstream URL to proxy to. This is the first link in the chain.",
      complexity: "small",
      owner: "Platform team",
      affectedServices: ["bff", "rpm_client"],
      whatToChange: "Set ConnectionStrings.QuoteManagementApiUrl in Web.BFF/appsettings.json to the QuoteManagement service URL (e.g., https://localhost:7124 for local dev, or the Container App internal URL for deployed dev).",
      unblocks: "RPM Client -> BFF -> QuoteManagement request flow"
    },
    {
      order: 2,
      title: "Fix BFF thread-unsafe DefaultRequestHeaders mutation",
      description: "SetApiKeyHeader in QuoteService.cs removes and re-adds the APIM subscription key on HttpClient.DefaultRequestHeaders on every request. DefaultRequestHeaders is shared across concurrent requests and is not thread-safe. Under any concurrency, requests will intermittently lose their auth header.",
      complexity: "small",
      owner: "Platform team",
      affectedServices: ["bff"],
      whatToChange: "In Web.BFF/Services/QuoteService.cs (lines 77-88): stop mutating DefaultRequestHeaders. Either set the header once during HttpClient registration in Program.cs, or create per-request HttpRequestMessage objects and set the header on each message.",
      unblocks: "Reliable BFF proxying under concurrent load"
    },
    {
      order: 3,
      title: "Enable BFF Polly resilience policies",
      description: "Retry and circuit breaker policies are fully configured in appsettings.json but the .AddResiliencePolicies() call is commented out in Program.cs line 19. Without this, transient failures during the async rating flow will not be retried.",
      complexity: "small",
      owner: "Platform team",
      affectedServices: ["bff"],
      whatToChange: "Uncomment the .AddResiliencePolicies() line in Web.BFF/Program.cs:19. Consider reducing retry count from 10 to 3 for user-facing quote requests.",
      unblocks: "Resilient BFF-to-backend communication"
    },
    {
      order: 4,
      title: "Fix QuoteManagement Service Bus namespace and queue alignment",
      description: "QuoteManagement sends to sbns-rating-dev-001 / sbq-rating-requests-dev, but Orchestrator listens on sbns-ratingplatform-dev-001 / sbq-initial-rating-requests. Until this is fixed, NO messages flow from quoting to rating. This is the most critical integration bug in the entire platform.",
      complexity: "small",
      owner: "QuoteManagement team (Mehul Dumasia)",
      affectedServices: ["quote_mgmt", "orchestrator"],
      whatToChange: "Update QuoteManagement's appsettings.json: change AzServiceBus.FullyQualifiedServiceBusNamespace to 'sbns-ratingplatform-dev-001.servicebus.windows.net', change RequestQueueName to 'sbq-initial-rating-requests', change ResponseQueueName to 'sbq-rating-responses'. Remove the duplicate AzServiceBus and RatingServiceBus sections - keep only ServiceBusSettings.",
      unblocks: "Enables QuoteManagement -> Orchestrator message flow"
    },
    {
      order: 5,
      title: "Register ServiceBusSettings in QuoteManagement DI container",
      description: "RatingSubmissionService injects IOptions<ServiceBusSettings> but Program.cs only registers AzServiceBusOptions. Type name mismatch causes a runtime DI resolution failure when attempting to submit a quote for rating.",
      complexity: "small",
      owner: "QuoteManagement team (Mehul Dumasia)",
      affectedServices: ["quote_mgmt"],
      whatToChange: "Add builder.Services.Configure<ServiceBusSettings>(builder.Configuration.GetSection(\"ServiceBusSettings\")); to Program.cs. Ensure the appsettings.json section name matches.",
      unblocks: "QuoteManagement can instantiate RatingSubmissionService without crashing"
    },
    {
      order: 6,
      title: "Create QuoteManagement environment-specific appsettings",
      description: "QuoteManagement has only one appsettings.json with hardcoded dev values (including UseMockData=true). Need dev/qa/prod configs to deploy correctly across environments.",
      complexity: "medium",
      owner: "QuoteManagement team (Mehul Dumasia)",
      affectedServices: ["quote_mgmt"],
      whatToChange: "Create appsettings.dev.json, appsettings.qa.json, appsettings.prod.json following the pattern from RatingOrchestrator. Set UseMockData=false in qa/prod. Configure managed identity for Service Bus authentication in prod.",
      unblocks: "Correct deployment configuration per environment"
    },
    {
      order: 7,
      title: "Verify Orchestrator receives messages end-to-end",
      description: "Once QuoteManagement aligns its Service Bus config (steps 4-5), verify the Orchestrator successfully picks up messages from sbq-initial-rating-requests, stores the payload to blob storage, and fans out work items to sbq-rating-jobs.",
      complexity: "small",
      owner: "Rating Platform team",
      affectedServices: ["orchestrator", "quote_mgmt"],
      whatToChange: "Integration test: send a test quote submission through QuoteManagement and verify the Orchestrator processes it. Check blob storage for the stored payload and sbq-rating-jobs for fan-out messages.",
      unblocks: "Confirms the QuoteManagement -> Orchestrator link works"
    },
    {
      order: 8,
      title: "Fix CarrierConnector health check and storage error handling",
      description: "Health check always returns Healthy (hardcoded true) which masks real problems. Storage write failures crash the entire message processing pipeline instead of being handled gracefully.",
      complexity: "small",
      owner: "Rating Platform team",
      affectedServices: ["carrier_connector"],
      whatToChange: "In RatingHealthCheck.cs: replace hardcoded isHealthy=true with actual Service Bus processor and storage account connectivity checks. In CarrierRatingConsumerService.cs: wrap storage writes in try/catch, log failures, but allow the response to still be published.",
      unblocks: "Reliable CarrierConnector operation and honest health reporting"
    },
    {
      order: 9,
      title: "Implement RPM Client polling for async rating results",
      description: "OnGetQuote calls RateQuoteAsync then immediately GetOffersAsync. Rating is asynchronous (returns 202 Accepted with a jobId), so offers will always be empty when fetched immediately. The UI needs to poll until results arrive.",
      complexity: "medium",
      owner: "Platform team",
      affectedServices: ["rpm_client"],
      whatToChange: "In Pages/Quoting/Quote.razor.cs: after calling RateQuoteAsync (which returns a jobId), implement a polling loop that calls GetOffersAsync every 2-3 seconds until pricingState is 'Rated' or a timeout (e.g., 60 seconds) is reached. Show a loading spinner during polling.",
      unblocks: "Broker can see rating results in the UI"
    },
    {
      order: 10,
      title: "Load schema bundles for MVP carriers into SchemaCache",
      description: "SchemaCache works but needs actual schema data for the MVP carriers (Aviva, SGI, PeaceHills) to drive the form rendering in RPM Client.",
      complexity: "medium",
      owner: "Schema/Architecture team",
      affectedServices: ["schema_cache", "rpm_client"],
      whatToChange: "Use the InternalSync endpoint to load schema bundles for each MVP carrier. Each bundle needs: manifest, schema fields (what data to collect from the broker), form config (UI layout), and code lists (dropdown values like vehicle makes/models).",
      unblocks: "RPM Client can render carrier-specific quote forms"
    }
  ],

  services: {
    "quote_mgmt": {
      currentState: "broken",
      stateExplanation: "Code is functional but has critical configuration and DI issues that prevent it from communicating with other services. Service Bus namespace/queue names don't match the infrastructure. DI registration for ServiceBusSettings is missing, which will crash the rating submission flow at runtime. Also has production credentials committed to source control.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Fix Service Bus namespace and queue names",
          description: "Align with infrastructure: sbns-ratingplatform-dev-001, queues: sbq-initial-rating-requests, sbq-rating-jobs, sbq-rating-responses",
          complexity: "small",
          type: "config",
          file: "appsettings.json",
          whatToDo: "Change FullyQualifiedServiceBusNamespace from 'sbns-rating-dev-001.servicebus.windows.net' to 'sbns-ratingplatform-dev-001.servicebus.windows.net'. Change RequestQueueName from 'sbq-rating-requests-dev' to 'sbq-initial-rating-requests'. Change ResponseQueueName from 'sbq-rating-responses-dev' to 'sbq-rating-responses'. Remove the duplicate AzServiceBus and RatingServiceBus sections - keep only ServiceBusSettings.",
          ticketTitle: "Fix Service Bus configuration alignment in QuoteManagement",
          ticketDescription: "Update appsettings.json Service Bus configuration to match the infrastructure provisioned by Rating.Platform.Infrastructure Terraform. Current config points to sbns-rating-dev-001 which does not match the Orchestrator's sbns-ratingplatform-dev-001. Queue names also differ: QuoteManagement uses sbq-rating-requests-dev but Orchestrator listens on sbq-initial-rating-requests."
        },
        {
          priority: 2,
          title: "Register ServiceBusSettings in DI",
          description: "RatingSubmissionService injects IOptions<ServiceBusSettings> but it's never registered in Program.cs - only AzServiceBusOptions is registered, causing a type mismatch",
          complexity: "small",
          type: "code",
          file: "Program.cs",
          whatToDo: "Add: builder.Services.Configure<ServiceBusSettings>(builder.Configuration.GetSection(\"ServiceBusSettings\")); to Program.cs. Alternatively, rename AzServiceBusOptions to ServiceBusSettings if they represent the same config shape.",
          ticketTitle: "Fix DI registration for ServiceBusSettings",
          ticketDescription: "RatingSubmissionService depends on IOptions<ServiceBusSettings> which is not registered in the DI container. Program.cs registers AzServiceBusOptions instead. This causes a runtime crash when attempting to submit a quote for rating."
        },
        {
          priority: 3,
          title: "Fix BFF QuoteManagementApiUrl",
          description: "The BFF's appsettings.json has an empty QuoteManagementApiUrl - all quote API calls from RPM Client silently fail at the BFF proxy layer",
          complexity: "small",
          type: "config",
          file: "Web.BFF/appsettings.json (in Rival.Platform.BFF repo)",
          whatToDo: "Set ConnectionStrings.QuoteManagementApiUrl to the QuoteManagement service URL. For dev: use the Container App's internal URL or localhost for local dev.",
          ticketTitle: "Configure QuoteManagementApiUrl in BFF",
          ticketDescription: "The BFF cannot route quote requests because QuoteManagementApiUrl is empty in appsettings.json. Set it to the QuoteManagement API URL so the proxy can forward requests."
        },
        {
          priority: 4,
          title: "Create environment-specific appsettings",
          description: "QuoteManagement has only one appsettings.json with hardcoded dev values. Need dev/qa/prod configs for correct deployment.",
          complexity: "medium",
          type: "config",
          file: "appsettings.*.json",
          whatToDo: "Create appsettings.dev.json, appsettings.qa.json, appsettings.prod.json following the pattern from RatingOrchestrator. Set UseMockData=false in qa/prod. Set managed identity for Service Bus in prod.",
          ticketTitle: "Add environment-specific configuration files to QuoteManagement",
          ticketDescription: "QuoteManagement uses a single appsettings.json with hardcoded dev values including mock data enabled. Create per-environment configs following the pattern established by RatingOrchestrator."
        }
      ],

      postMvpImprovements: [
        {
          title: "Add authentication middleware",
          description: "UseAuthentication() before UseAuthorization() + configure Azure AD bearer tokens. Currently UseAuthorization() is called but UseAuthentication() is missing, making all [Authorize] attributes ineffective.",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Implement real auth context for user identity",
          description: "Replace placeholder Guid.NewGuid() with actual authenticated user from HttpContext claims",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Fix BuildServiceProvider() anti-pattern in health check",
          description: "Program.cs:136 creates a second DI container inside a health check lambda, causing duplicate singleton instances. Replace with a typed IHealthCheck class.",
          complexity: "small",
          type: "code"
        },
        {
          title: "Add MongoDB index on OpportunityId",
          description: "Prevent collection scans as quote data grows",
          complexity: "small",
          type: "code"
        },
        {
          title: "Rotate exposed credentials and remove docs/specs/azure-resources.json",
          description: "Production Cosmos DB keys, Service Bus SAS keys, and Storage Account keys are committed to git. Must rotate ALL credentials and remove the file.",
          complexity: "small",
          type: "security"
        },
        {
          title: "Fix API key validation",
          description: "Ocp-Apim-Subscription-Key check only validates non-empty - any arbitrary string passes. Validate against a known value or rely on APIM gateway.",
          complexity: "small",
          type: "security"
        },
        {
          title: "Standardize DateTime to UTC",
          description: "Replace all DateTime.Now with DateTime.UtcNow for consistency across services",
          complexity: "small",
          type: "code"
        },
        {
          title: "Delete WeatherForecast.cs and implement Delete endpoint",
          description: "Clean up template leftovers and implement the stubbed delete endpoint",
          complexity: "small",
          type: "code"
        }
      ]
    },

    "orchestrator": {
      currentState: "degraded",
      stateExplanation: "Code is well-structured and functional. The main issue is that it cannot receive messages because QuoteManagement sends to a different Service Bus namespace. Once that's fixed on QuoteManagement's side, the Orchestrator should work for MVP. Has some error handling gaps (fan-out partial failure handling, dead-letter TODO) but these are not MVP-blocking.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Verify queue connectivity after QuoteManagement fix",
          description: "Once QuoteManagement aligns its Service Bus config, verify end-to-end message flow from QuoteManagement through Orchestrator to CarrierConnector",
          complexity: "small",
          type: "testing",
          file: "N/A - integration test",
          whatToDo: "After QuoteManagement fixes its Service Bus config, send a test message to sbq-initial-rating-requests and verify the Orchestrator picks it up, stores the payload to blob storage, and fans out carrier-specific work items to sbq-rating-jobs.",
          ticketTitle: "Verify Orchestrator receives messages after Service Bus alignment",
          ticketDescription: "Integration test: confirm end-to-end message flow from QuoteManagement through Orchestrator to CarrierConnector after Service Bus namespace alignment. Verify blob storage write and fan-out to sbq-rating-jobs."
        }
      ],

      postMvpImprovements: [
        {
          title: "Handle partial fan-out failures",
          description: "If one carrier routing fails during fan-out, don't abort the entire rating job. Process the carriers that succeed and report partial results.",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Implement explicit dead-lettering for validation failures",
          description: "Currently retries invalid messages 10 times before dead-letter. Add explicit validation and dead-letter immediately on schema violations.",
          complexity: "small",
          type: "code"
        },
        {
          title: "Add circuit breaker on second Service Bus publishing",
          description: "Prevent cascade failures if the work queue (sbq-rating-jobs) is throttled or unavailable",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Remove hardcoded credentials from docs/scripts/",
          description: "SAS keys and storage account keys committed to git in documentation/script files. Rotate and remove.",
          complexity: "small",
          type: "security"
        },
        {
          title: "Stop logging raw message bodies (PII risk)",
          description: "Log only metadata (correlationId, messageType, size) instead of full message content which may contain policyholder PII",
          complexity: "small",
          type: "security"
        }
      ]
    },

    "carrier_connector": {
      currentState: "functional",
      stateExplanation: "The service works correctly in simulator mode. It consumes from the right queues (sbq-rating-jobs), calculates premiums using the PremiumCalculator simulator, and publishes responses to sbq-rating-responses. For MVP, the simulator is acceptable - real carrier API integration comes later. Main concerns: health check is fake (always returns Healthy) and storage write failures crash message processing.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Fix health check to actually check dependencies",
          description: "Current health check always returns Healthy regardless of actual Service Bus or storage connectivity state",
          complexity: "small",
          type: "code",
          file: "RatingHealthCheck.cs",
          whatToDo: "Replace hardcoded 'isHealthy = true' with actual checks: verify Service Bus processor is running (check ProcessorStatus), verify storage account is accessible (ping container).",
          ticketTitle: "Implement real health checks in CarrierConnector",
          ticketDescription: "The health check endpoint always returns Healthy (hardcoded true). Implement actual dependency checks for Service Bus processor status and Storage Account connectivity."
        },
        {
          priority: 2,
          title: "Wrap storage writes in try/catch (best-effort pattern)",
          description: "Storage write failure currently crashes the entire message processing, preventing the rating response from being published even though the calculation succeeded",
          complexity: "small",
          type: "code",
          file: "CarrierRatingConsumerService.cs",
          whatToDo: "Wrap the storage write in a try/catch block, log the failure, but allow the response to still be published to sbq-rating-responses - matching the Orchestrator's best-effort storage pattern.",
          ticketTitle: "Make carrier response storage writes best-effort",
          ticketDescription: "Storage write failures in CarrierRatingConsumerService currently fail the entire message processing. Wrap in try/catch to allow response publishing even if storage is temporarily unavailable."
        }
      ],

      postMvpImprovements: [
        {
          title: "Implement real carrier API calls via adapters",
          description: "Switch from PremiumCalculator simulator to actual Aviva/SGI/PeaceHills API calls using carrier-specific adapter classes",
          complexity: "large",
          type: "code"
        },
        {
          title: "Use province-specific tax rates",
          description: "Replace hardcoded 5% tax rate with actual provincial insurance tax rates (varies by province in Canada)",
          complexity: "small",
          type: "code"
        },
        {
          title: "Align carrier multiplier map with configured carriers",
          description: "PeaceHills and SGI always get default multiplier of 1.0 because they are not in the carrier multiplier dictionary",
          complexity: "small",
          type: "code"
        },
        {
          title: "Guard console OTLP exporter behind environment check",
          description: "Don't log OpenTelemetry traces to stdout in production - only in development",
          complexity: "small",
          type: "code"
        },
        {
          title: "Replace SGI placeholder URL",
          description: "api.sgi.example.com is not a real endpoint - replace with actual SGI API URL when available",
          complexity: "small",
          type: "config"
        }
      ]
    },

    "schema_cache": {
      currentState: "functional",
      stateExplanation: "Schema Cache works - it stores and retrieves schema bundles from MongoDB (Cosmos DB). For MVP, it needs carrier schema bundles loaded for the carriers being quoted (Aviva, SGI, PeaceHills). Main architectural gap: it's named 'Cache' but has no caching layer, so every request hits MongoDB directly. Also has no authentication on any endpoint.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Ensure carrier schema bundles are loaded",
          description: "The service works but needs actual schema data for the MVP carriers (Aviva, SGI, PeaceHills) to drive RPM Client form rendering",
          complexity: "medium",
          type: "config",
          file: "Database seeding via InternalSync endpoint",
          whatToDo: "Use the InternalSync endpoint to load schema bundles for the MVP carriers. Each bundle needs: manifest (product metadata), schema fields (what data to collect from the broker), form config (UI layout and validation rules), and code lists (dropdown values like vehicle makes/models, province codes).",
          ticketTitle: "Load MVP carrier schema bundles into SchemaCache",
          ticketDescription: "Seed the SchemaCache MongoDB with schema bundles for Aviva, SGI, and PeaceHills personal auto products. Bundles drive the dynamic form rendering in RPM Client."
        }
      ],

      postMvpImprovements: [
        {
          title: "Add in-memory caching with IMemoryCache",
          description: "Every request currently hits MongoDB directly. Add IMemoryCache with TTL-based expiration for frequently accessed schemas to reduce database load.",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Implement locale filtering",
          description: "GetActiveSchema accepts locale parameter but ignores it - should filter schema bundles by locale (en-CA, fr-CA)",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Fix UpsertBundleAsync semantics",
          description: "Named 'upsert' but throws on duplicates - should perform an actual upsert (insert or update) using MongoDB's ReplaceOne with upsert option",
          complexity: "small",
          type: "code"
        },
        {
          title: "Add authentication to schema endpoints",
          description: "Currently no auth - anyone with network access can read all schemas and use the InternalSync endpoint to modify data",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Define CORS policy",
          description: "UseCors() is called in Program.cs but no policy is defined - either configure allowed origins or remove the call",
          complexity: "small",
          type: "config"
        }
      ]
    },

    "rpm_client": {
      currentState: "functional",
      stateExplanation: "The Blazor frontend works - brokers can fill out insurance quote forms, and the schema-driven UI renders correctly. The main MVP gap is the async rating flow: the UI submits a quote and immediately tries to fetch offers, but rating is asynchronous via Service Bus so offers won't be ready yet. Also has a hardcoded client ID placeholder.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Implement polling for rating results",
          description: "OnGetQuote calls RateQuoteAsync then immediately GetOffersAsync - rating is async via Service Bus, so offers will always be empty when fetched immediately after submission",
          complexity: "medium",
          type: "code",
          file: "Pages/Quoting/Quote.razor.cs",
          whatToDo: "After calling RateQuoteAsync (which returns 202 Accepted with a jobId), implement a polling loop that calls GetOffersAsync every 2-3 seconds until the pricing state is 'Rated' or a timeout (e.g., 60 seconds) is reached. Show a loading spinner during polling. Handle timeout gracefully with a user-friendly message.",
          ticketTitle: "Implement async rating result polling in Quote page",
          ticketDescription: "The quote submission flow immediately calls GetOffersAsync after RateQuoteAsync, but rating is asynchronous via Service Bus. Implement polling with a loading state until results are available or a timeout is reached."
        },
        {
          priority: 2,
          title: "Remove hardcoded client ID",
          description: "clientId is hardcoded to 'JOHTO4991' - should come from authenticated user context or opportunity data",
          complexity: "small",
          type: "code",
          file: "Pages/Quoting/Quote.razor.cs:52",
          whatToDo: "Get clientId from the authenticated user's claims or the opportunity data instead of the hardcoded placeholder 'JOHTO4991'.",
          ticketTitle: "Replace hardcoded clientId with authenticated user context",
          ticketDescription: "Quote.razor.cs uses hardcoded clientId 'JOHTO4991'. Replace with actual client identifier from the authenticated session or opportunity record."
        }
      ],

      postMvpImprovements: [
        {
          title: "Complete CSIO mapping integration",
          description: "CsioMappingService is commented out - CDM-to-CSIO (Centre for Study of Insurance Operations) data conversion is not happening",
          complexity: "large",
          type: "code"
        },
        {
          title: "Fix timer disposal and race conditions",
          description: "stateUpdateDebounceTimer is never disposed, and there's a race condition between the timer callback and Blazor's render thread",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Replace 3-second Task.Delay with proper DOM ready detection",
          description: "Hardcoded 3-second delay before scroll detection initialization - use JS interop for DOM ready instead",
          complexity: "small",
          type: "code"
        },
        {
          title: "Surface error details from failed API calls",
          description: "QuoteService swallows response bodies on error responses - details are lost, making debugging difficult",
          complexity: "small",
          type: "code"
        },
        {
          title: "Support multiple LOBs beyond Auto",
          description: "LOB (Line of Business) is hardcoded to 'Auto' in LoadSchemaAndInitializeForm - need to support Property, Liability, etc.",
          complexity: "medium",
          type: "code"
        }
      ]
    },

    "bff": {
      currentState: "broken",
      stateExplanation: "The BFF (Backend-For-Frontend) has a critical thread-safety bug and a missing configuration that prevent it from functioning correctly. SetApiKeyHeader mutates shared HttpClient.DefaultRequestHeaders on every request (not thread-safe under concurrency), and QuoteManagementApiUrl is empty so all quote proxy calls silently fail with no error surfaced to the frontend.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Fix thread-unsafe DefaultRequestHeaders mutation",
          description: "SetApiKeyHeader removes and re-adds the APIM subscription key header on shared DefaultRequestHeaders on every request - not thread-safe for concurrent requests, causing intermittent auth failures",
          complexity: "small",
          type: "code",
          file: "Web.BFF/Services/QuoteService.cs:77-88",
          whatToDo: "Instead of modifying DefaultRequestHeaders, create a new HttpRequestMessage per request and set the header on that message. Or set the header once during HttpClient configuration in Program.cs since the APIM key doesn't change per-request.",
          ticketTitle: "Fix thread-unsafe APIM key header injection in BFF QuoteService",
          ticketDescription: "QuoteService.SetApiKeyHeader() modifies HttpClient.DefaultRequestHeaders on every request. DefaultRequestHeaders is shared across concurrent requests and is not thread-safe. Move to per-request headers via HttpRequestMessage or one-time configuration."
        },
        {
          priority: 2,
          title: "Set QuoteManagementApiUrl",
          description: "appsettings.json has empty QuoteManagementApiUrl - all quote operations silently fail with no error surfaced to the caller",
          complexity: "small",
          type: "config",
          file: "Web.BFF/appsettings.json",
          whatToDo: "Set ConnectionStrings.QuoteManagementApiUrl to the QuoteManagement service's URL. For dev: if running locally use https://localhost:7124, for deployed dev use the Container App internal URL.",
          ticketTitle: "Configure QuoteManagementApiUrl in BFF appsettings",
          ticketDescription: "QuoteManagementApiUrl is empty in appsettings.json, causing all quote API proxy calls to silently fail. Set it to the QuoteManagement service URL."
        },
        {
          priority: 3,
          title: "Enable Polly resilience policies",
          description: "Retry and circuit breaker policies are fully configured in appsettings.json but the registration call is commented out in Program.cs",
          complexity: "small",
          type: "code",
          file: "Web.BFF/Program.cs:19",
          whatToDo: "Uncomment the .AddResiliencePolicies() line. Verify the retry count of 10 is appropriate (consider reducing to 3 for user-facing requests to avoid long waits).",
          ticketTitle: "Enable Polly resilience policies in BFF",
          ticketDescription: "Polly retry and circuit breaker policies are fully configured in appsettings.json but the registration is commented out in Program.cs line 19. Uncomment to enable resilient HTTP communication."
        }
      ],

      postMvpImprovements: [
        {
          title: "Add authentication middleware",
          description: "No auth middleware configured - all BFF endpoints are publicly accessible to anyone with network access",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Extract HTTP proxy helper to reduce code duplication",
          description: "6 proxy methods with identical boilerplate (create request, set headers, send, read response). Extract to a shared helper.",
          complexity: "medium",
          type: "code"
        },
        {
          title: "Surface downstream error details to frontend",
          description: "Error response bodies from downstream services are not read - error details are lost, making frontend debugging impossible",
          complexity: "small",
          type: "code"
        },
        {
          title: "Add health check endpoints",
          description: "No /health endpoint exists for container orchestration (Azure Container Apps) liveness/readiness probes",
          complexity: "small",
          type: "code"
        },
        {
          title: "Make Key Vault resolution async",
          description: "Synchronous GetSecret call in constructor blocks DI resolution thread during startup",
          complexity: "medium",
          type: "code"
        }
      ]
    },

    "manufacture": {
      currentState: "not-started",
      stateExplanation: "This repo contains only Terraform deployment scaffolding and a CI/CD pipeline definition. There is zero application code - no Dockerfile, no Program.cs, no business logic. The Manufactured Rating Engine would calculate premiums using in-house actuarial rules without calling external carrier APIs. This is Tariq's opportunity to build from the ground up.",

      mvpBlockers: [
        {
          priority: 1,
          title: "Scaffold the application",
          description: "Create the .NET Worker Service project, Dockerfile, Program.cs, and basic Service Bus consumer. This is the foundational work to get the service from zero to a running process.",
          complexity: "large",
          type: "code",
          file: "New project",
          whatToDo: "Create a .NET 9 Worker Service following the CarrierConnector pattern: BackgroundService consuming from sbq-rating-jobs queue (filtering for manufactured-rating carrier type), a ManufacturedRatingService that applies configurable rating rules, and a response publisher to sbq-rating-responses. Use the same CDM/DTO models as CarrierConnector for message compatibility.",
          ticketTitle: "Scaffold Manufactured Rating Engine application",
          ticketDescription: "Create the .NET Worker Service project with Service Bus consumer, rating rules engine, and response publisher. Follow the CarrierConnector architecture as a template. Include Dockerfile, Program.cs with DI setup, and basic health check."
        },
        {
          priority: 2,
          title: "Fix the pipeline ACR typo",
          description: "CI/CD pipeline references 'acratingplatformdev001' (missing 'r') instead of 'acrratingplatformdev001' - builds will fail to push container images",
          complexity: "small",
          type: "config",
          file: ".azuredevops/azure-pipeline.yaml",
          whatToDo: "Change AcrConnection from 'acratingplatformdev001' to 'acrratingplatformdev001' to match the actual Azure Container Registry name.",
          ticketTitle: "Fix ACR name typo in Manufacture pipeline",
          ticketDescription: "The CI pipeline references 'acratingplatformdev001' which is missing the 'r' in 'acr'. Correct to 'acrratingplatformdev001' to match the provisioned Azure Container Registry."
        }
      ],

      postMvpImprovements: [
        {
          title: "Build the rating rules engine",
          description: "Core business logic for calculating premiums from configurable actuarial rules, rate tables, and risk factor tables",
          complexity: "large",
          type: "code"
        },
        {
          title: "Create rules management API",
          description: "CRUD endpoints for managing rating rules, rate tables, factor tables, and territory definitions",
          complexity: "large",
          type: "code"
        },
        {
          title: "Add unit and integration tests",
          description: "Test the premium calculation logic with various scenarios: different vehicle types, driver profiles, coverage levels, provinces",
          complexity: "medium",
          type: "testing"
        }
      ]
    }
  },

  systemMvpSummary: {
    totalBlockers: 0,
    estimatedComplexity: "Most MVP blockers are config changes and small code fixes. The hardest items are implementing the RPM Client polling loop and scaffolding the Manufactured Rating Engine. Excluding Manufacture (which is a greenfield build), estimated 2-3 days of focused work to get a quote flowing end-to-end from RPM Client through to CarrierConnector and back.",
    criticalPathOrder: [
      "1. Fix BFF QuoteManagementApiUrl (5 min config change)",
      "2. Fix BFF thread-safety bug in SetApiKeyHeader (30 min code change)",
      "3. Enable BFF Polly resilience policies (5 min uncomment)",
      "4. Fix QuoteManagement Service Bus namespace + queue names (30 min config)",
      "5. Register ServiceBusSettings in QuoteManagement DI (5 min code change)",
      "6. Create QuoteManagement environment-specific appsettings (1 hour)",
      "7. Verify Orchestrator receives messages (integration test)",
      "8. Fix CarrierConnector health check + storage error handling (30 min)",
      "9. Implement RPM Client polling for async rating results (2-3 hours)",
      "10. Load schema bundles for MVP carriers (1-2 hours)"
    ],
    quickWins: [
      "Delete WeatherForecast.cs from QuoteManagement (literally 10 seconds)",
      "Fix BFF's QuoteManagementApiUrl (config change, 5 minutes)",
      "Enable BFF Polly policies (uncomment one line, 5 minutes)",
      "Fix Manufacture pipeline ACR typo (config change, 5 minutes)"
    ]
  }
};

// Calculate total blockers
(function() {
  var total = 0;
  Object.values(window.ACTION_PLAN_DATA.services).forEach(function(s) {
    total += (s.mvpBlockers || []).length;
  });
  window.ACTION_PLAN_DATA.systemMvpSummary.totalBlockers = total;
})();
