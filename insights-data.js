window.INSIGHTS_DATA = {
  generatedAt: "2026-03-26T10:00:00Z",
  generatedBy: "Claude Code Architecture Review",

  services: {
    "quote_mgmt": [
      {
        id: "ins_qm_001",
        severity: "CRITICAL",
        category: "integration",
        title: "Service Bus namespace mismatch with Rating Orchestrator",
        description: "QuoteManagement uses 'sbns-rating-dev-001' and queue names 'sbq-rating-requests-dev' / 'sbq-rating-responses-dev', but Rating Orchestrator uses 'sbns-ratingplatform-dev-001' with different queue names ('sbq-initial-rating-requests', 'sbq-rating-jobs', 'sbq-rating-responses'). These services cannot communicate over Service Bus as configured.",
        evidence: "File: appsettings.json - QuoteManagement: sbns-rating-dev-001 / sbq-rating-requests-dev. Orchestrator: sbns-ratingplatform-dev-001 / sbq-initial-rating-requests. Different namespace AND different queue names.",
        recommendation: "Align the Service Bus namespace and queue names. QuoteManagement should publish to 'sbq-initial-rating-requests' on 'sbns-ratingplatform-dev-001' to match what the Orchestrator consumes.",
        affectedComponents: ["quote_mgmt", "orchestrator"]
      },
      {
        id: "ins_qm_002",
        severity: "CRITICAL",
        category: "code_quality",
        title: "Schema service uses placeholder URL and mock data flag is ON",
        description: "SchemaServiceSettings.BaseUrl is set to 'https://schema-service-placeholder.azurewebsites.net' and UseMockData is set to true. This means the service is not actually connecting to the SchemaCache API for bundle resolution, relying on mock data instead.",
        evidence: "File: appsettings.json, Lines 48-50 - BaseUrl: 'https://schema-service-placeholder.azurewebsites.net', UseMockData: true. Also in Models/ConfigurationOptions.cs: UseMockData defaults to true.",
        recommendation: "Update BaseUrl to point to the actual SchemaCache API URL and set UseMockData to false. The SchemaCache service exists and is deployed.",
        affectedComponents: ["quote_mgmt", "schema_cache"]
      },
      {
        id: "ins_qm_003",
        severity: "CRITICAL",
        category: "security",
        title: "No authentication middleware configured - UseAuthorization without UseAuthentication",
        description: "Program.cs calls app.UseAuthorization() but never calls app.UseAuthentication() or builder.Services.AddAuthentication(). The APIM key check added in PR 6915 provides API key validation, but there is no standard authentication middleware. Any [Authorize] attributes would be ineffective.",
        evidence: "File: Program.cs, Line 163 - app.UseAuthorization() present but no AddAuthentication() or UseAuthentication() call anywhere in the file.",
        recommendation: "Add proper authentication middleware. If relying solely on APIM key validation, document this explicitly and ensure all endpoints are protected.",
        affectedComponents: ["quote_mgmt", "bff"]
      },
      {
        id: "ins_qm_004",
        severity: "CRITICAL",
        category: "code_quality",
        title: "Delete endpoint returns failure - not implemented",
        description: "The QuoteService.DeleteQuoteAsync method fetches the quote but then returns ServiceResult.Failure('Delete functionality not available'). The endpoint exists but always fails.",
        evidence: "File: Services/QuoteService.cs, Lines 305-307 - '// TODO: Implement delete functionality when available in repository' followed by return ServiceResult.Failure.",
        recommendation: "Either implement the delete functionality or remove the endpoint to avoid confusion. A 501 Not Implemented status would be more appropriate than the current behavior.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_005",
        severity: "WARNING",
        category: "security",
        title: "Auth context hardcoded to 'system' user with random GUID",
        description: "Multiple locations in QuoteService generate a random GUID for systemUserId instead of extracting it from the authentication context. The UserName is hardcoded to 'system'. This means audit trails are meaningless.",
        evidence: "File: Services/QuoteService.cs, Lines 224, 257, 360, 380, 429, 449 - 'var systemUserId = Guid.NewGuid().ToString(); // TODO: Get from auth context' and 'UserName = \"system\" // TODO: Get from auth context'",
        recommendation: "Inject the authenticated user context (e.g., via IHttpContextAccessor) and use actual user identity for audit trails.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_006",
        severity: "WARNING",
        category: "deployment",
        title: "MongoDB connection string not configured in appsettings.json",
        description: "The MongoDBDatabaseOptions section has DatabaseName and collection names but no ConnectionString property in the base appsettings.json. The MongoDB health check in Program.cs calls BuildServiceProvider() during registration which is an anti-pattern.",
        evidence: "File: appsettings.json - MongoDBDatabaseOptions section has no ConnectionString field. File: Program.cs Lines 136-137 - builder.Services.BuildServiceProvider() called during health check registration.",
        recommendation: "Add ConnectionString to appsettings.json (empty, to be injected via environment). Fix the health check to not call BuildServiceProvider() during registration - use a proper IHealthCheck class instead.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_007",
        severity: "WARNING",
        category: "code_quality",
        title: "Integration test URLs are placeholders",
        description: "Integration test configuration has placeholder URLs that have never been updated, indicating integration tests may not be running against real environments.",
        evidence: "File: Tests/IntegrationTests/Configuration/TestConfiguration.cs, Lines 67-68 - Dev URL: 'https://api-quotemanagement-dev.example.com' and QA URL: 'https://api-quotemanagement-qa.example.com' both marked with '// TODO: Replace with actual URL'",
        recommendation: "Update integration test configuration with actual deployed service URLs.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_008",
        severity: "WARNING",
        category: "code_quality",
        title: "Activity stalled - no commits in 44 days",
        description: "Last commit was on February 10, 2026. The service has 20 total commits with development appearing to have stalled after the opportunity-to-quote integration feature.",
        evidence: "Git log: Last commit ec412d5 on 2026-02-10. Total 20 commits since project creation on 2026-01-12.",
        recommendation: "Review whether this service is being actively developed or if work has shifted elsewhere. The service has several TODO items and incomplete features.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_009",
        severity: "INFO",
        category: "architecture",
        title: "Good test coverage structure with unit and integration test separation",
        description: "The project has a well-organized test structure with 14+ unit test files covering controllers, services, repositories, models, DTOs, and messaging. Integration tests cover CRUD operations, rating, and health endpoints.",
        evidence: "Test files cover: QuotesControllerTests, QuoteServiceTests, QuoteRepositoryTests, RatingSubmissionServiceTests, RatingResponseHandlerServiceTests, CarrierBundleResolutionServiceTests, OpportunityMessageConsumerTests, and 7+ integration test files.",
        recommendation: "Continue expanding test coverage, particularly around the delete functionality and error edge cases.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_010",
        severity: "INFO",
        category: "architecture",
        title: "Well-structured Dockerfile with multi-stage build and test stage",
        description: "Dockerfile uses multi-stage build pattern with separate base, build, test, publish, and final stages. Tests run during Docker build with coverage collection.",
        evidence: "File: Dockerfile - 5 stages: base (aspnet:9.0), build (sdk:9.0), test (runs dotnet test with coverage), publish, final.",
        recommendation: "No changes needed. This is a solid Docker build pattern.",
        affectedComponents: ["quote_mgmt"]
      }
    ],

    "orchestrator": [
      {
        id: "ins_orch_001",
        severity: "CRITICAL",
        category: "deployment",
        title: "Production appsettings has empty Service Bus namespace and APIM BaseUrl",
        description: "The appsettings.prod.json has empty FullyQualifiedServiceBusNamespace, empty StorageAccount.AccountName, and empty Apim.BaseUrl. While comments say to inject via environment variables, if those aren't set, the service will throw InvalidOperationException at startup.",
        evidence: "File: appsettings.prod.json - ServiceBus.FullyQualifiedServiceBusNamespace: '', StorageAccount.AccountName: '', Apim.BaseUrl: '', Apim.SubscriptionKey: ''",
        recommendation: "Verify that Azure Container App environment variables are properly configured for production. Consider adding startup validation that fails fast with descriptive error messages if required config is missing.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_002",
        severity: "WARNING",
        category: "code_quality",
        title: "Dead-letter logic not implemented (Phase 2 TODO)",
        description: "MessageProcessor.cs has a TODO comment indicating dead-letter logic for invalid messages is not yet implemented. In production, invalid messages could block the queue.",
        evidence: "File: Services/MessageProcessor.cs, Line 77 - '// TODO: In Phase 2, implement dead-letter logic here'. Also appsettings.prod.json has DeadLetterOnValidationFailure: true but the code to support it may be incomplete.",
        recommendation: "Implement dead-letter queue handling to prevent poison messages from blocking the processing pipeline.",
        affectedComponents: ["orchestrator", "carrier_connector"]
      },
      {
        id: "ins_orch_003",
        severity: "WARNING",
        category: "code_quality",
        title: "Multiple deferred features marked as v0.12+ TODOs",
        description: "Several test files have disabled tests waiting for v0.12+ features including metadata storage and telemetry methods that are not yet implemented.",
        evidence: "Files: Tests/UnitTests/Services/StorageServiceTests.cs Line 188, MessageProcessorTests.cs Lines 115, 391, 444, 464 - Multiple '// TODO: v0.12+' and '// TODO: Re-enable when...' comments with disabled test assertions.",
        recommendation: "Track these deferred items in the backlog. The disabled tests indicate feature gaps that should be prioritized.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_004",
        severity: "INFO",
        category: "architecture",
        title: "Excellent observability setup with OpenTelemetry and Application Insights",
        description: "The Orchestrator has comprehensive telemetry: custom ActivitySource and Meters, distributed tracing across HTTP/ServiceBus/Azure SDK, Azure Monitor exporters, and environment-aware console exporters for development.",
        evidence: "File: Program.cs Lines 148-231 - Full OpenTelemetry configuration with tracing, metrics, Azure Monitor exporters, OTLP support, and custom activity sources.",
        recommendation: "This is a good pattern to replicate across other services. QuoteManagement and SchemaCache lack this level of observability.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_005",
        severity: "INFO",
        category: "architecture",
        title: "Strong configuration validation with fail-fast pattern",
        description: "Program.cs uses null-coalescing throw for required configurations (OrchestratorConfiguration, StorageAccountConfiguration, ApimConfiguration), ensuring the service fails fast at startup if config is missing.",
        evidence: "File: Program.cs Lines 58-72 - Three required config sections throw InvalidOperationException if missing.",
        recommendation: "Good pattern. Consider adding this to QuoteManagement and SchemaCache.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_006",
        severity: "INFO",
        category: "code_quality",
        title: "Comprehensive unit test coverage across services, validation, and telemetry",
        description: "The Orchestrator has 12 test files covering background services, message processing, storage, validation, telemetry metrics, activity sources, and model serialization.",
        evidence: "Test files: RatingOrchestratorServiceTests, RatingResponseProcessorServiceTests, MessageProcessorTests, StorageServiceTests, ServiceBusPublisherTests, BundleFieldValidatorTests, MessageValidatorTests, OrchestratorMetricsTests, OrchestratorActivitySourceTests, plus model tests.",
        recommendation: "Strong test coverage. Focus on implementing the disabled v0.12+ tests.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_007",
        severity: "WARNING",
        category: "code_quality",
        title: "Bus factor concern - two primary contributors",
        description: "Only 15 total commits split between 2 main contributors (Soibifa Gaibo: 6, Bhoomika Jodhani: 6). If either leaves, critical knowledge about the orchestration logic could be lost.",
        evidence: "Git log: 4 total contributors, but 80% of commits from 2 people. Philip West (2 commits) and Mounica Gudala (1 commit) have minimal involvement.",
        recommendation: "Cross-train additional team members on the orchestrator architecture and message processing logic.",
        affectedComponents: ["orchestrator"]
      }
    ],

    "carrier_connector": [
      {
        id: "ins_cc_001",
        severity: "CRITICAL",
        category: "deployment",
        title: "SGI carrier adapter uses placeholder URL across all environments",
        description: "The SGI carrier adapter BaseUrl is 'https://api.sgi.example.com' in all environment configs (default, dev, qa). This is clearly a placeholder domain that will never resolve. The SGI carrier is listed as active in the Carriers array.",
        evidence: "Files: appsettings.json, appsettings.dev.json, appsettings.qa.json - SGI.BaseUrl: 'https://api.sgi.example.com'. Also Auth.TokenUrl uses '{tenant}' placeholder. CarrierConnector.Carriers includes 'sgi'.",
        recommendation: "Either configure the real SGI API URL or remove 'sgi' from the active Carriers list until integration is ready. Current config will cause runtime failures for SGI rating requests.",
        affectedComponents: ["carrier_connector", "orchestrator"]
      },
      {
        id: "ins_cc_002",
        severity: "WARNING",
        category: "performance",
        title: "Console OTLP exporter enabled unconditionally in production",
        description: "The OpenTelemetry configuration in Program.cs adds AddConsoleExporter() without any environment check. This will write telemetry data to stdout in production, adding unnecessary I/O overhead.",
        evidence: "File: Program.cs Lines 85, 97 - '.AddConsoleExporter()) // For dev/testing' - no environment guard. Compare with Orchestrator which guards console exporter behind IsDevelopment() check.",
        recommendation: "Wrap AddConsoleExporter() calls in an environment check: if (builder.Environment.IsDevelopment()). Follow the pattern used in the Rating Orchestrator.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_003",
        severity: "WARNING",
        category: "deployment",
        title: "Production appsettings has all carrier URLs and auth credentials empty",
        description: "appsettings.prod.json has empty BaseUrl, TokenUrl, ClientId, ClientSecret, and Scope for ALL four carrier adapters (PeaceHills, Aviva, AvivaTraders, SGI). All rely on environment variable injection.",
        evidence: "File: appsettings.prod.json - All CarrierAdapters entries have empty BaseUrl, TokenUrl, ClientId, ClientSecret fields.",
        recommendation: "Verify Azure Container App configuration injects all required carrier adapter settings. Consider startup validation to fail fast if carrier configs are incomplete.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_004",
        severity: "WARNING",
        category: "code_quality",
        title: "Leftover scaffold test file (UnitTest1.cs) with empty test",
        description: "The default project scaffold test file still exists with an empty test method, suggesting initial cleanup was not done.",
        evidence: "File: Tests/UnitTests/UnitTest1.cs - Contains only an empty Test1() method with no assertions.",
        recommendation: "Delete UnitTest1.cs. It adds noise to test results and suggests incomplete cleanup.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_005",
        severity: "INFO",
        category: "architecture",
        title: "Strong carrier adapter pattern with resilience policies",
        description: "Each carrier adapter (PeaceHills, Aviva, AvivaTraders, SGI) has individually configurable retry, timeout, and circuit breaker policies. The adapter factory pattern allows easy addition of new carriers.",
        evidence: "File: appsettings.json - Each carrier in CarrierAdapters has Resilience.Retry (MaxRetries, BaseDelaySeconds, JitterMilliseconds), Timeout (per-request and total), and CircuitBreaker (FailureThreshold, BreakDurationSeconds).",
        recommendation: "Good resilience pattern. Consider adding health check endpoints per carrier adapter for operational visibility.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_006",
        severity: "INFO",
        category: "code_quality",
        title: "Extensive test coverage including adapter-specific tests and validators",
        description: "The project has 27+ test files covering carrier adapters (PeaceHills, Aviva, SGI), auth handlers, validators (CDM, vehicle, driver, coverage, policy), services, and integration tests.",
        evidence: "Test files include: PeaceHillsAdapterTests, AvivaAdapterTests, SgiAdapterTests, AvivaAuthHandlerTests, PeaceHillsAuthHandlerTests, 11 validator test files, plus service tests and integration tests.",
        recommendation: "Excellent test coverage. Continue adding tests for new carrier adapters as they are integrated.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_007",
        severity: "INFO",
        category: "architecture",
        title: "Contract-first API design with OpenAPI spec validation pipeline",
        description: "The project has a dedicated Azure Pipeline for contract validation and an OpenAPI spec file, indicating a contract-first development approach.",
        evidence: "Files: .azuredevops/azure-pipelines-contract-validation.yml, docs/contracts/openapi/carrier-connector.yaml",
        recommendation: "Good practice. Consider extending this pattern to other services.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_008",
        severity: "WARNING",
        category: "code_quality",
        title: "Hardcoded BasePremium value in configuration",
        description: "The Rating section has a hardcoded BasePremium of 1000.0 in all environment configs. This appears to be a test/placeholder value that should be dynamically determined.",
        evidence: "Files: appsettings.json, appsettings.dev.json, appsettings.prod.json - Rating.BasePremium: 1000.0",
        recommendation: "Verify whether BasePremium should be carrier-specific or dynamically calculated. A static 1000.0 across all carriers seems incorrect for production.",
        affectedComponents: ["carrier_connector"]
      }
    ],

    "schema_cache": [
      {
        id: "ins_sc_001",
        severity: "WARNING",
        category: "security",
        title: "No authentication or authorization configured",
        description: "The SchemaCache API has no authentication middleware. Any client can read/write schema data without credentials. There is no UseAuthentication(), AddAuthentication(), or [Authorize] attribute usage.",
        evidence: "File: Program.cs - No authentication/authorization middleware. The API exposes CRUD operations on schema data with no access control.",
        recommendation: "Add API key validation or Azure AD authentication. At minimum, write operations (upsert, activate) should require authentication.",
        affectedComponents: ["schema_cache", "quote_mgmt", "bff"]
      },
      {
        id: "ins_sc_002",
        severity: "WARNING",
        category: "code_quality",
        title: "Stale - no commits in 56 days",
        description: "Last commit was January 29, 2026. The service has only 12 total commits. Development appears to have stopped after the shard key support feature.",
        evidence: "Git log: Last commit a322400 on 2026-01-29. First commit on 2026-01-12. Only 12 total commits.",
        recommendation: "Determine if the SchemaCache is feature-complete or if development has stalled. QuoteManagement still uses mock data instead of connecting to this service.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_003",
        severity: "WARNING",
        category: "code_quality",
        title: "Bus factor = 1 (Satish Natarajan owns 50% of commits)",
        description: "Of 12 total commits, Satish Natarajan has 6. The next contributor (Alexander Vergeichik) has 3 which appear to be infrastructure/pipeline work.",
        evidence: "Git log: Satish Natarajan: 6 commits, Alexander Vergeichik: 3 commits, Soibifa Gaibo: 1, Philip West: 1, Mounica Gudala: 1.",
        recommendation: "Cross-train team members on the SchemaCache codebase, particularly the MongoDB schema and Service Bus consumer logic.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_004",
        severity: "INFO",
        category: "architecture",
        title: "Good test coverage with unit and integration tests",
        description: "Both unit tests (controllers, repositories, services) and integration tests (CRUD operations, health, sample data seeding, duplicate detection) are present with 14 test files.",
        evidence: "Unit tests: SchemaControllerTests, SchemaCacheRepositoryTests, SchemaMetadataRepositoryTests, SchemaServiceTests, InternalSyncControllerTests. Integration tests: GetBundleTests, UpsertBundleTests, GetActiveSchemaTests, UpsertActivationTests, HealthEndpointTests, SampleDataSeededTests.",
        recommendation: "Continue maintaining test coverage as the schema model evolves.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_005",
        severity: "INFO",
        category: "architecture",
        title: "MongoDB BsonClassMap configuration handles nested Id property conflicts",
        description: "Program.cs includes careful BsonClassMap registrations for FormSection and Step types to prevent MongoDB from treating nested 'Id' properties as document identifiers. This is a common pitfall handled well.",
        evidence: "File: Program.cs Lines 20-44 - BsonClassMap registrations with UnmapMember/MapMember pattern for FormSection.Id and Step.Id.",
        recommendation: "Good defensive coding. Document this pattern for future developers working with MongoDB nested documents.",
        affectedComponents: ["schema_cache"]
      }
    ],

    "rpm_client": [
      {
        id: "ins_rpmw_001",
        severity: "WARNING",
        category: "deployment",
        title: "Running on .NET 8.0 while backend services are on .NET 9.0",
        description: "The RPMClient Dockerfile uses mcr.microsoft.com/dotnet/aspnet:8.0 and sdk:8.0, while QuoteManagement, Orchestrator, CarrierConnector, and SchemaCache all use .NET 9.0. This version mismatch could cause issues with shared packages.",
        evidence: "File: RPMClient/Dockerfile Lines 3, 9 - 'FROM mcr.microsoft.com/dotnet/aspnet:8.0' and 'FROM mcr.microsoft.com/dotnet/sdk:8.0'. All other rating services use :9.0.",
        recommendation: "Plan an upgrade to .NET 9.0 for consistency across the platform. Check if shared NuGet packages have .NET 9.0 dependencies.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_002",
        severity: "WARNING",
        category: "code_quality",
        title: "No unit or integration tests found",
        description: "The RPMClient project has no test project. The only 'Tests' directory found is a Models/Tests folder which appears to contain test data models, not actual test cases. The Dockerfile has no test stage.",
        evidence: "No *.test.*, *.spec.*, or *Tests.csproj files found. Dockerfile has no test stage (unlike all backend services). Compare with QuoteManagement/Orchestrator/CarrierConnector which all have unit and integration test projects.",
        recommendation: "Add a test project for critical UI logic, services, and component rendering. Blazor Server apps can be tested with bUnit.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_003",
        severity: "INFO",
        category: "architecture",
        title: "Mature, actively developed application with comprehensive feature set",
        description: "The RPMClient is the most actively developed project with 1,310 total commits, 10+ contributors, and daily commits. It is a Blazor Server application with authentication, localization, feature management, and extensive service integration.",
        evidence: "Git log: 1,310 total commits, last commit 2026-03-25 (1 day ago), 10 contributors. Program.cs shows 30+ service registrations, Azure AD auth, Syncfusion UI, localization (en-CA, en-US, fr-CA), feature management.",
        recommendation: "This is the primary user-facing application. Consider adding test coverage given the lack of any tests.",
        affectedComponents: ["rpm_client", "bff"]
      },
      {
        id: "ins_rpmw_004",
        severity: "INFO",
        category: "architecture",
        title: "Well-configured authentication with Azure AD and data protection",
        description: "The application uses Microsoft Identity with Azure AD, MSAL-based authentication, data protection persisted to SQL Server, and proper anti-forgery configuration.",
        evidence: "File: Program.cs - AddAuthentication(), Azure AD config, AddDataProtection().PersistKeysToDbContext(), UseAuthentication(), UseAuthorization(), UseAntiforgery().",
        recommendation: "Authentication setup is solid. Ensure token refresh and session management handle edge cases.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_005",
        severity: "INFO",
        category: "architecture",
        title: "Dynamic UI and schema-driven form system",
        description: "The application includes a dynamic UI service layer (AddDynamicUIServices) and SchemaCacheManager, suggesting forms are driven by schema definitions rather than hardcoded. This aligns well with the SchemaCache API architecture.",
        evidence: "File: Program.cs Lines 92, 96 - AddScoped<ISchemaCacheManager, SchemaCacheManager>() and AddDynamicUIServices(). appsettings.json has DynamicUI configuration section.",
        recommendation: "Good architectural choice for a multi-carrier insurance platform where forms vary by carrier.",
        affectedComponents: ["rpm_client", "schema_cache", "bff"]
      }
    ],

    "bff": [
      {
        id: "ins_bff_001",
        severity: "CRITICAL",
        category: "integration",
        title: "QuoteManagementApiUrl is empty in production appsettings",
        description: "The BFF appsettings.json has an empty QuoteManagementApiUrl while all other service URLs are populated with dev environment values. This means the BFF cannot proxy quote management requests in production without environment variable override.",
        evidence: "File: appsettings.json Line 35 - 'QuoteManagementApiUrl': '' (empty). Compare with other URLs like JournalTasksApiUrl, ConfigurationApiUrl which have values.",
        recommendation: "Set the QuoteManagementApiUrl to the correct APIM or direct endpoint URL for each environment.",
        affectedComponents: ["bff", "quote_mgmt"]
      },
      {
        id: "ins_bff_002",
        severity: "CRITICAL",
        category: "code_quality",
        title: "Resilience policies commented out for QuoteService HTTP client",
        description: "The Polly resilience policies (retry, circuit breaker, fallback) are commented out for the QuoteService HTTP client registration. This means there is no retry or circuit breaker protection for quote management API calls.",
        evidence: "File: Program.cs Line 19 - '//    .AddResiliencePolicies(nameof(PollyPolicyOptions), builder.Configuration);' is commented out. The PollyPolicyOptions config exists in appsettings.json but is not being used.",
        recommendation: "Uncomment and configure resilience policies for the QuoteService HTTP client. Other service clients likely have this configured.",
        affectedComponents: ["bff", "quote_mgmt"]
      },
      {
        id: "ins_bff_003",
        severity: "WARNING",
        category: "security",
        title: "App Insights instrumentation key exposed in Development appsettings",
        description: "The appsettings.Development.json contains a full Application Insights connection string with InstrumentationKey, which while not a secret per se, should ideally not be in source control.",
        evidence: "File: appsettings.Development.json Line 32 - Full ApplicationInsights connection string with InstrumentationKey=227921b9..., IngestionEndpoint, LiveEndpoint, and ApplicationId visible.",
        recommendation: "Move Application Insights connection string to environment variables or Key Vault. While instrumentation keys have limited exposure risk, following the pattern of the other services (which leave this empty) is more consistent.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_004",
        severity: "WARNING",
        category: "code_quality",
        title: "No health check endpoints configured",
        description: "The BFF has no health check configuration. There are no AddHealthChecks() calls, no MapHealthChecks() calls, and no health check middleware. This makes it difficult to monitor BFF availability in production.",
        evidence: "File: Program.cs - No health check related code. Compare with QuoteManagement (/health/ready, /health/live), Orchestrator (ServiceBusHealthCheck), SchemaCache (/health), and CarrierConnector which all have health checks.",
        recommendation: "Add health check endpoints that verify connectivity to downstream services (Journal APIs, Quote Management, Configuration API, etc.).",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_005",
        severity: "WARNING",
        category: "code_quality",
        title: "No test project exists",
        description: "The BFF has no unit or integration test project despite being the critical middleware layer between the frontend and 15+ backend services.",
        evidence: "No test files found in the repository. The BFF Dockerfile has no test stage.",
        recommendation: "Add unit tests for service orchestration logic, particularly OpportunityRequestOrchestrator and PolicyApplicationOrchestrator which contain business logic.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_006",
        severity: "WARNING",
        category: "deployment",
        title: "Running on .NET 8.0 while backend services are on .NET 9.0",
        description: "The BFF Dockerfile uses .NET 8.0 base images, while the rating platform services (Orchestrator, CarrierConnector, QuoteManagement, SchemaCache) all run on .NET 9.0.",
        evidence: "File: Dockerfile Lines 3, 8 - 'FROM mcr.microsoft.com/dotnet/aspnet:8.0'. Rating services use aspnet:9.0.",
        recommendation: "Upgrade to .NET 9.0 for consistency and to benefit from performance improvements.",
        affectedComponents: ["bff", "rpm_client"]
      },
      {
        id: "ins_bff_007",
        severity: "WARNING",
        category: "code_quality",
        title: "Deprecated UserManagement models marked for removal",
        description: "Multiple UserManagement model classes have properties marked with TODO comments indicating they should be removed in favor of new role-based properties.",
        evidence: "Files: Models/UserManagement/Request/UserViewRequest.cs Line 15, Response/UserDetailResponse.cs Line 10, Response/UserViewResponse.cs Line 16 - All have '// TODO: To be removed (will be using SelectedRoles/Roles going forward)'",
        recommendation: "Complete the migration to the new role-based model and remove deprecated properties.",
        affectedComponents: ["bff", "rpm_client"]
      },
      {
        id: "ins_bff_008",
        severity: "INFO",
        category: "architecture",
        title: "Comprehensive service proxy layer with 15+ downstream integrations",
        description: "The BFF acts as a proper backend-for-frontend, proxying calls to Journal (Tasks, Renewals, Claims, BookOfBusiness, Opportunities, Referrals), Configuration, Apps, Store, Connections, Search, Insights, PolicyApplication, DocumentGen, QuoteManagement, and CentralSchema services.",
        evidence: "File: Program.cs Lines 21-44 - 15+ scoped service registrations. appsettings.json Lines 21-36 - 15 ConnectionStrings entries for downstream services.",
        recommendation: "This is a well-structured BFF pattern. Consider adding the resilience policies (currently commented out) for all downstream service calls.",
        affectedComponents: ["bff"]
      }
    ]
  },

  crossComponent: [
    {
      id: "ins_sys_001",
      severity: "CRITICAL",
      category: "integration",
      title: "Service Bus namespace and queue name mismatch between QuoteManagement and Rating Platform",
      description: "QuoteManagement publishes rating requests to 'sbq-rating-requests-dev' on namespace 'sbns-rating-dev-001', but the Rating Orchestrator listens on 'sbq-initial-rating-requests' on namespace 'sbns-ratingplatform-dev-001'. The Orchestrator then publishes to 'sbq-rating-jobs' which the CarrierConnector listens on. The Orchestrator-to-CarrierConnector link is aligned, but QuoteManagement-to-Orchestrator is broken at the namespace AND queue level. Rating responses also use different queue names.",
      affectedComponents: ["quote_mgmt", "orchestrator", "carrier_connector"]
    },
    {
      id: "ins_sys_002",
      severity: "CRITICAL",
      category: "integration",
      title: "QuoteManagement uses mock data instead of connecting to SchemaCache",
      description: "QuoteManagement has SchemaServiceSettings.UseMockData=true and a placeholder URL. The BFF connects to CentralSchema (not SchemaCache). The SchemaCache service exists and is deployed but appears disconnected from the rest of the platform. The intended flow (BFF -> QuoteManagement -> SchemaCache for bundle resolution) is not functional.",
      affectedComponents: ["quote_mgmt", "schema_cache", "bff"]
    },
    {
      id: "ins_sys_003",
      severity: "WARNING",
      category: "deployment",
      title: "Framework version split: .NET 8.0 (Web/BFF) vs .NET 9.0 (Rating Platform)",
      description: "The Rival Platform Web (RPMClient) and BFF run on .NET 8.0, while all rating platform services (QuoteManagement, Orchestrator, CarrierConnector, SchemaCache) run on .NET 9.0. This creates a framework version boundary that could cause issues with shared NuGet packages.",
      affectedComponents: ["rpm_client", "bff", "quote_mgmt", "orchestrator", "carrier_connector", "schema_cache"]
    },
    {
      id: "ins_sys_004",
      severity: "WARNING",
      category: "code_quality",
      title: "Testing gap in frontend and middleware layers",
      description: "The rating platform backend services (Orchestrator, CarrierConnector, QuoteManagement, SchemaCache) all have unit and integration tests with coverage in Docker builds. However, the RPMClient (Blazor frontend) and BFF (middleware) have ZERO tests. These are the two most critical user-facing layers.",
      affectedComponents: ["rpm_client", "bff"]
    },
    {
      id: "ins_sys_005",
      severity: "WARNING",
      category: "security",
      title: "Inconsistent authentication patterns across services",
      description: "RPMClient has full Azure AD authentication. BFF has UseAuthorization() but relies on token passthrough. QuoteManagement uses APIM key validation but no standard auth middleware. SchemaCache has NO authentication at all. CarrierConnector and Orchestrator are worker services (no HTTP endpoints exposed) so auth is N/A.",
      affectedComponents: ["rpm_client", "bff", "quote_mgmt", "schema_cache"]
    }
  ],

  healthScores: {
    "quote_mgmt": {
      overall: 48,
      activity: 25,
      ci: 85,
      deployment: 70,
      testing: 65,
      documentation: 40,
      busFactorScore: 35
    },
    "orchestrator": {
      overall: 68,
      activity: 90,
      ci: 85,
      deployment: 65,
      testing: 75,
      documentation: 50,
      busFactorScore: 40
    },
    "carrier_connector": {
      overall: 70,
      activity: 90,
      ci: 90,
      deployment: 65,
      testing: 80,
      documentation: 55,
      busFactorScore: 50
    },
    "schema_cache": {
      overall: 50,
      activity: 15,
      ci: 80,
      deployment: 70,
      testing: 70,
      documentation: 40,
      busFactorScore: 25
    },
    "rpm_client": {
      overall: 62,
      activity: 98,
      ci: 80,
      deployment: 80,
      testing: 5,
      documentation: 40,
      busFactorScore: 80
    },
    "bff": {
      overall: 55,
      activity: 92,
      ci: 75,
      deployment: 75,
      testing: 0,
      documentation: 35,
      busFactorScore: 70
    }
  },

  stories: {
    "quote_mgmt": {
      narrative: "Quote Management was created on January 12, 2026 as part of the new Rival Rating Platform initiative. Over 4 weeks, it received rapid development with 20 commits from 4 contributors, building out core quote CRUD operations, rating submission workflow, Service Bus integration, and an opportunity-to-quote pipeline. Development peaked in late January with integration test frameworks and pipeline setup, then slowed significantly. The last commit on February 10, 2026 added RealmId support. Since then, the service has been dormant for 44 days with several TODO items and incomplete features (delete endpoint, auth context, schema service connection) remaining unaddressed.",
      educate: '<h3>What This Service Does</h3>\n<p>Quote Management is the coordinator of the quoting process. When an insurance broker wants to get quotes from multiple carriers (like Aviva, SGI, Peace Hills) for a customer, this service creates a quote record, figures out which carriers to contact, packages the data, and drops it on a message queue for processing. It also receives pricing responses back and computes the best offer.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>Step 1: Creating a quote</h4>\n<p>An HTTP POST arrives at <code>/api/v1/quotes</code>. The controller checks for an APIM subscription key in the <code>Ocp-Apim-Subscription-Key</code> header. Then it validates the request has <code>Routing</code> (what kind of insurance) and <code>CdmData</code> (the actual form data).</p>\n<p>If the broker didn\'t explicitly list which carriers to quote with, the service extracts them from the CDM data. It looks for a field called <code>policy.insuranceCompanies</code> which might be comma-separated like <code>"WAWA,SGI"</code>. Each carrier ID gets turned into a "bundle ID" like <code>INTACT.AUTO.rate.csio-2023@1.0.0</code>.</p>\n\n<h4>Step 2: The quote document in MongoDB</h4>\n<p>The data gets saved as a MongoDB document:</p>\n<pre>{\n  "_id": "a1b2c3d4-...",\n  "docType": "quoteWip",\n  "status": "Draft",\n  "routing": {\n    "productCode": "PersAuto",\n    "intent": "quote",\n    "standard": "CSIO"\n  },\n  "carrierTargets": [\n    { "carrierId": "INTACT", "bundleId": "intact.PersAuto.quote.csio-1.49@3.0.0" },\n    { "carrierId": "AVIVA", "bundleId": "aviva.PersAuto.quote.csio-1.48@2.0.0" }\n  ],\n  "cdmData": {\n    "fields": {\n      "drivers[0].firstName": { "kind": "string", "raw": "John" },\n      "drivers[0].lastName": { "kind": "string", "raw": "Smith" },\n      "vehicle[0].year": { "kind": "number", "raw": "2024", "numberValue": 2024 }\n    }\n  },\n  "pricingSummary": { "state": "NotRated", "offers": [] },\n  "events": [{ "type": "QuoteCreated", "at": "2026-03-25T10:30:00" }]\n}</pre>\n\n<h4>Step 3: Submitting for rating</h4>\n<p>When the broker hits "Get Quotes", a POST to <code>/api/v1/quotes/{id}/rate</code> triggers rating. The service validates carrier targets exist, generates a job ID, and publishes a <code>RatingRequestMessage</code> to Service Bus queue <code>sbq-rating-requests-dev</code>:</p>\n<pre>{\n  "messageType": "RatingRequest",\n  "jobId": "e5f6g7h8-...",\n  "quoteId": "a1b2c3d4-...",\n  "carrierTargets": [...],\n  "cdmData": { "fields": {...} },\n  "meta": { "source": "rpm-quoting-service" }\n}</pre>\n\n<h4>Step 4: Receiving carrier responses</h4>\n<p>A background worker (<code>RatingResponseReader</code>) listens on <code>sbq-rating-responses-dev</code>. When a carrier response arrives, it creates an offer and computes the best price:</p>\n<pre>{\n  "carrierId": "INTACT",\n  "status": "Rated",\n  "termPremium": 1200.00,\n  "taxes": 180.00,\n  "totalPayable": 1380.00,\n  "currency": "CAD"\n}</pre>\n<p>The service finds the lowest <code>totalPayable</code> across all offers and sets it as the "best offer".</p>\n\n<h3>How It Connects</h3>\n<div class="connection-example">\n<strong>Upstream:</strong> RPM Client (Blazor) → Web BFF → Quote Management<br>\n<strong>Downstream:</strong> Quote Management → Service Bus → Rating Orchestrator → Carrier Connector → responses flow back through Service Bus<br>\n<strong>Database:</strong> MongoDB collection <code>quoteWip</code> in database <code>Quoting</code>\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>CDM (Common Data Model)</strong>: A flat key-value bag. Keys are dot-separated paths like <code>drivers[0].firstName</code>. This universal format gets translated to carrier-specific formats downstream.</li>\n<li><strong>Bundle</strong>: A config package defining how to talk to a specific carrier. The bundle ID encodes: carrier, product, intent, standard, and version.</li>\n<li><strong>PricingSummary</strong>: Tracks overall rating state (NotRated → PartiallyRated → Rated) and holds all carrier offers plus the best offer.</li>\n<li><strong>Events</strong>: The quote maintains an audit trail (QuoteCreated, QuoteUpdated, SubmittedForRating, OfferReceived).</li>\n</ul>',
      birthDate: "2026-01-12",
      phases: [
        { date: "2026-01-12", title: "Project Created", description: "Initial README and repo scaffold created." },
        { date: "2026-01-15", title: "Container App Setup", description: "Initial container app deployment and pipeline scripts (PR 6811)." },
        { date: "2026-01-16", title: "Dockerfile Added", description: "Docker file and NuGet config for containerization (PR 6824)." },
        { date: "2026-01-20", title: "Core Domain Logic", description: "Implemented core quote management domain logic, services, unit and integration tests (PRs 6842, 6848, 6865)." },
        { date: "2026-01-24", title: "CI/CD Pipeline", description: "Configured release pipeline, integration test skip logic for CI (PRs 6872, 6873)." },
        { date: "2026-01-27", title: "Test Coverage Expansion", description: "Added integration tests, coverage config, pipeline fixes (PRs 6876, 6878, 6881, 6883, 6891)." },
        { date: "2026-01-31", title: "APIM Security", description: "Added APIM key check for all endpoints (PR 6915)." },
        { date: "2026-02-05", title: "Opportunity Integration", description: "Added opportunity-to-quote integration and lookup endpoint (PRs 6959, 6972, 6977)." },
        { date: "2026-02-10", title: "Last Activity", description: "Added RealmId support and improved date handling (PR 6996). No activity since." }
      ],
      totalCommits: 20,
      totalContributors: 4,
      daysSinceLastCommit: 44,
      status: "stale"
    },
    "orchestrator": {
      narrative: "The Rating Orchestrator was created on January 12, 2026 alongside the other Rating Platform services. It serves as the central message processing hub, receiving rating requests via Service Bus, fanning them out to carrier-specific work queues, and collecting responses. Development progressed steadily through January with project restructuring and testing enhancements. A major v0.11 architecture modernization in March 2026 added storage blob integration, APIM response delivery, and permission updates. The service has 15 commits from 4 contributors, with the most recent activity just 2 days ago (March 24, 2026).",
      educate: '<h3>What This Service Does</h3>\n<p>The Rating Orchestrator is a background worker — it has no web pages or API endpoints. It watches a Service Bus queue and when a rating request arrives, it splits it into individual carrier-specific messages. Think of it as a dispatcher: one request comes in targeting 3 carriers, and 3 separate jobs go out.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>The fan-out pattern</h4>\n<p>When Quote Management submits a quote for rating, it puts ONE message on the <code>sbq-initial-rating-requests</code> queue. That message might target Aviva, SGI, and Peace Hills. The Orchestrator picks it up and creates THREE separate <code>CarrierRatingMessage</code> objects — one per carrier — and publishes each to the <code>sbq-rating-jobs</code> queue.</p>\n\n<h4>Step-by-step processing</h4>\n<ol>\n<li>Message arrives on <code>sbq-initial-rating-requests</code></li>\n<li>JSON is deserialized into <code>RatingRequestMessage</code>. If parsing fails → dead-letter.</li>\n<li><code>MessageProcessor</code> validates: must have JobId, QuoteId, at least one CarrierTarget, CdmData, and Routing</li>\n<li>Raw JSON is written to Azure Blob Storage (<code>rating-requests</code> container) as <code>{timestamp}-{correlationId}.json</code> — best-effort, failure doesn\'t block processing</li>\n<li>For each carrier target, a <code>CarrierRatingMessage</code> is published to <code>sbq-rating-jobs</code></li>\n<li>Original message is completed (removed from queue)</li>\n</ol>\n\n<h4>The response flow</h4>\n<p>A second background service (<code>RatingResponseProcessorService</code>) listens on <code>sbq-rating-responses</code>. When a carrier\'s response arrives, it forwards it via HTTP POST to the APIM callback endpoint with Polly retry (exponential backoff, handles 429/500/503).</p>\n\n<h3>Concrete Example</h3>\n<div class="connection-example">\nA broker quotes Ontario auto insurance for Aviva and Peace Hills:<br>\n1. ONE message arrives with <code>carrierTargets: [{carrierId: "aviva"}, {carrierId: "peacehills"}]</code><br>\n2. Orchestrator saves raw JSON to blob: <code>20260326-143045-corr-abc123.json</code><br>\n3. Orchestrator publishes TWO messages to <code>sbq-rating-jobs</code> — one for each carrier<br>\n4. Each message contains the same CDM data but carrier-specific routing\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Fan-out</strong>: One input message becomes N output messages (one per carrier). This lets carriers be rated in parallel.</li>\n<li><strong>Dead-lettering</strong>: Malformed messages are moved to a dead-letter queue instead of being retried forever.</li>\n<li><strong>Best-effort persistence</strong>: Blob storage writes are attempted but failures don\'t stop the pipeline — reliability over completeness.</li>\n<li><strong>OpenTelemetry</strong>: Every message gets a correlation ID that traces through all services for debugging.</li>\n</ul>',
      birthDate: "2026-01-12",
      phases: [
        { date: "2026-01-12", title: "Project Created", description: "Initial README created." },
        { date: "2026-01-14", title: "Infrastructure Setup", description: "Tofu deployment configuration, subscription ID setup (PRs 6829, 6836, 6841)." },
        { date: "2026-01-15", title: "Initial Implementation", description: "Rating Orchestrator with unit and integration tests (PR 6804)." },
        { date: "2026-01-18", title: "Project Restructure", description: "Refactored project structure, enhanced functionality (PR 6866)." },
        { date: "2026-01-22", title: "Testing Enhancement", description: "Enhanced testing framework, updated project structure, E2E tests for CDM v2 (PRs 6896, 6916)." },
        { date: "2026-01-27", title: "Infrastructure Tuning", description: "CPU scaling threshold adjustments, dev environment updates (PRs 6899, 6901, 6921)." },
        { date: "2026-03-17", title: "v0.11 Modernization", description: "Major architecture update: storage blob integration, deployment updates, role assignments (PRs 7174, 7176)." },
        { date: "2026-03-24", title: "Latest Activity", description: "Added storage blob contributor permissions (PR 7245)." }
      ],
      totalCommits: 15,
      totalContributors: 4,
      daysSinceLastCommit: 2,
      status: "active"
    },
    "carrier_connector": {
      narrative: "The Carrier Connector was created on January 12, 2026 as the outbound integration layer of the Rating Platform. It connects to external carrier APIs (PeaceHills via Guidewire, Aviva, AvivaTraders, and SGI) to submit rating requests and process responses. Early development focused on getting the Docker build working with multiple pipeline fixes for .NET 9.0 compatibility and Dockerfile capitalization issues. The service matured through January with API test frameworks, carrier adapter implementations with resilience policies, and Service Bus integration. March 2026 brought significant enhancements including carrier adapter routing, Service Bus integration refactoring, and storage blob permissions. The service is actively maintained with the most recent commit 2 days ago.",
      educate: '<h3>What This Service Does</h3>\n<p>The Carrier Connector is where the rubber meets the road — it actually talks to insurance companies. It picks up individual carrier rating jobs from the queue, translates the data into the carrier\'s expected format, calls their API, and publishes the result back. Currently running in <strong>simulator mode</strong> with a built-in premium calculator.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>The adapter pattern</h4>\n<p>Each insurance carrier has its own API with different protocols. The Carrier Connector uses the <strong>adapter pattern</strong> — one common interface, multiple implementations:</p>\n<ul>\n<li><strong>Aviva</strong>: REST API + OAuth2 Bearer token. Sends CSIO XML 1.48 format. Uses AWS API Gateway.</li>\n<li><strong>SGI</strong>: SOAP-over-REST + OAuth2 via Azure AD. Uses a custom <code>SgiSoapClient</code> for SOAP envelope construction.</li>\n<li><strong>Peace Hills</strong>: REST + OAuth2. Sends CSIO XML as <code>text/plain</code> to Guidewire Cloud Platform.</li>\n</ul>\n\n<h4>Premium calculation (simulator)</h4>\n<p>Currently, the service uses a <code>PremiumCalculator</code> instead of calling real carrier APIs. Here\'s how it works with real numbers:</p>\n<pre>Coverage base rates:\n  TPL (Third Party Liability) = $500\n  Collision = $400\n  Comprehensive = $350\n  DCPD = $150\n  Accident Benefits = $300\n\nModifiers applied:\n  Driver age 30, 12 years licensed → age factor 1.0, experience discount 0.85\n  Vehicle: 2023 Honda Civic (3 years old) → vehicle age factor 1.3\n  Province: Alberta → factor 1.1\n  Carrier: Aviva → multiplier 1.05x\n\nExample calculation for TPL + Collision + Comprehensive:\n  TPL: $500 × 1.0 × 0.85 × 1.1 = $467.50\n  Collision: $400 × 1.3 = $520.00\n  Comprehensive: $350 × 1.15 = $402.50\n  Subtotal: $1,390.00 × 1.05 (Aviva) = $1,459.50\n  Tax (5%): $72.98\n  Total: $1,532.48</pre>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>CSIO XML</strong>: Canadian Standard for Insurance Objects — the industry-standard XML format for communicating with Canadian insurance carriers.</li>\n<li><strong>Adapter pattern</strong>: Each carrier implements <code>ICarrierAdapter</code> with <code>RateAsync()</code> and <code>IsHealthyAsync()</code>. The factory selects the right adapter based on carrier ID.</li>\n<li><strong>Simulator mode</strong>: All responses include a <code>SIMULATED_RATING</code> warning code. The <code>PremiumCalculator</code> is deterministic — same inputs always produce the same outputs.</li>\n</ul>',
      birthDate: "2026-01-12",
      phases: [
        { date: "2026-01-12", title: "Project Created", description: "Initial README created." },
        { date: "2026-01-14", title: "Infrastructure Setup", description: "Tofu deployment configuration (PRs 6830, 6840)." },
        { date: "2026-01-15", title: "Initial Implementation", description: "Initial commit of Carrier Connector API with carrier adapters (PR 6849)." },
        { date: "2026-01-17", title: "Build Pipeline Struggles", description: "Multiple pipeline fixes: Dockerfile, NuGet config, .NET 9.0 build, file capitalization (PRs 6870-6887)." },
        { date: "2026-01-22", title: "Testing & Deployment", description: "Integration API test framework, release pipeline adjustments (PRs 6893, 6898, 6900)." },
        { date: "2026-01-27", title: "Scaling Configuration", description: "CPU scaling threshold added (PR 6922)." },
        { date: "2026-03-10", title: "Architecture Enhancement", description: "Deployment convention updates, carrier adapter routing implementation (PRs 7178, 7185, 7194)." },
        { date: "2026-03-20", title: "Service Bus Refactor", description: "Implemented Service Bus integration, removed HTTP endpoints (PR 7205)." },
        { date: "2026-03-24", title: "Latest Activity", description: "Added storage blob contributor permissions (PR 7244)." }
      ],
      totalCommits: 19,
      totalContributors: 5,
      daysSinceLastCommit: 2,
      status: "active"
    },
    "schema_cache": {
      narrative: "The SchemaCache API was created on January 12, 2026 to serve as the centralized repository for insurance form schemas and carrier bundle definitions. Development was concentrated in a 17-day sprint from January 12-29, producing 12 commits from 5 contributors. The service implements MongoDB-backed schema storage with form section and step support, duplicate detection, shard key support, and a Service Bus consumer for schema update events. However, development stopped abruptly on January 29, 2026 and has been dormant for 56 days. Notably, the QuoteManagement service that was intended to consume SchemaCache still uses mock data, suggesting the integration was never completed.",
      educate: '<h3>What This Service Does</h3>\n<p>Schema Cache is the form definition store. It answers: "When a broker wants to quote auto insurance from Aviva in Ontario, what fields should the form show?" It stores <strong>bundles</strong> — complete packages that define form fields, validation rules, UI layout, dropdown options, and translations.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>The bundle concept</h4>\n<p>A bundle contains everything needed to render a quoting form:</p>\n<ul>\n<li><strong>Manifest</strong>: metadata (hash, signature, effective dates)</li>\n<li><strong>Schema Fields</strong>: field definitions with key, type, required flag, constraints</li>\n<li><strong>Form Config</strong>: steps and sections defining UI layout (e.g., Step 1: Policy Details, Step 2: Driver Info)</li>\n<li><strong>Rules Engine</strong>: validation and business rules (when/then actions)</li>\n<li><strong>i18n</strong>: English and French label translations</li>\n<li><strong>Code Lists</strong>: dropdown option lists (provinces, vehicle makes, etc.)</li>\n</ul>\n\n<h4>Two-collection data model</h4>\n<p><code>schemaMetadata</code> maps carrier+product+intent to an active bundle ID. <code>schemaCache</code> stores the actual bundle documents. This separation allows multiple versions to coexist while only one is "active".</p>\n\n<h4>Example query</h4>\n<pre>GET /Schema/GetActiveSchema?carrierId=aviva&amp;productCode=PersAuto&amp;intent=NewBusiness\n\n1. Lookup: schemaMetadata["aviva:PersAuto:NewBusiness"] → activeBundleId\n2. Fetch: schemaCache[activeBundleId] → full bundle with 15 fields, 3 form steps\n3. Return: fields + formConfig + rules + codeLists + i18n</pre>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Schema-driven UI</strong>: The frontend doesn\'t hardcode form fields. It fetches them from SchemaCache at runtime. New fields can be added by updating the schema — no code deployment needed.</li>\n<li><strong>Activation</strong>: Only one bundle version is "active" per carrier/product/intent combination. This enables safe rollouts.</li>\n</ul>',
      birthDate: "2026-01-12",
      phases: [
        { date: "2026-01-12", title: "Project Created", description: "Initial README and container app deployment (PRs 6821)." },
        { date: "2026-01-16", title: "Docker Setup", description: "Docker file and NuGet config added (PR 6825)." },
        { date: "2026-01-18", title: "Core Implementation", description: "SchemaCache API service implementation with MongoDB (PRs 6845, 6856, 6858)." },
        { date: "2026-01-20", title: ".NET 9.0 Upgrade", description: "Upgraded to .NET 9.0 images (PRs 6862, 6867)." },
        { date: "2026-01-22", title: "CI Integration", description: "Updated TestBase to skip integration tests in CI (PR 6869)." },
        { date: "2026-01-24", title: "Multi-step Forms", description: "Added multi-step form support and case-insensitive queries (PR 6912)." },
        { date: "2026-01-27", title: "Duplicate Detection", description: "Prevent duplicate schema bundles, return 409 Conflict (PR 6926)." },
        { date: "2026-01-29", title: "Last Activity", description: "Added MongoDB shard key support and integration tests for duplicate detection (PR 6939). No activity since." }
      ],
      totalCommits: 12,
      totalContributors: 5,
      daysSinceLastCommit: 56,
      status: "dormant"
    },
    "rpm_client": {
      narrative: "Rival Platform Web (RPMClient) is the oldest and most actively developed service in the rating platform ecosystem, originally created on March 7, 2024. It is a Blazor Server application that serves as the primary user interface for the Rival insurance brokerage platform. With 1,310 total commits from 10+ contributors, it has a rich development history spanning 2 years. The application covers journal management (tasks, renewals, claims, book of business, opportunities, referrals), policy management, customer records, carrier credentials, quote management, and document generation. Recent development (March 2026) focuses on UI improvements, policy component refinements, carrier credential management, and schema-driven form support. Development velocity remains high with near-daily commits.",
      educate: '<h3>What This Service Does</h3>\n<p>RPM Client is the web application that insurance brokers use daily. It\'s built with Microsoft\'s Blazor framework — a C# web framework where the UI runs on the server and updates are sent to the browser via SignalR (WebSocket). Brokers use it to manage opportunities, tasks, customer records, and most importantly, to create and submit insurance quotes.</p>\n\n<h3>How The Quoting UI Works</h3>\n<h4>Schema-driven forms</h4>\n<p>The quoting form is NOT hardcoded. When a broker selects a province (e.g., Alberta), the app fetches a "form package" from SchemaCache that defines what fields to show, what validation rules to apply, and what dropdown options to offer. The <code>DynamicSectionRenderer</code> component reads this schema and renders the form dynamically.</p>\n\n<h4>The quote submission flow</h4>\n<ol>\n<li>Broker selects province → app loads schema from SchemaCache via BFF</li>\n<li><code>FormConfigParser</code> converts schema into renderable steps (Policy Details, Driver Info, Vehicle Info)</li>\n<li>Broker fills in fields. Each keystroke triggers <code>HandleFieldValueChanged()</code> → real-time validation via <code>RulesEngine</code></li>\n<li>Broker clicks "Get Quotes" → <code>OnGetQuote()</code> runs validation, creates/updates the quote via BFF, submits for rating</li>\n<li>Results are fetched via <code>GetOffersAsync()</code></li>\n</ol>\n\n<h4>Data transformation</h4>\n<p>Form values are converted to CDM format: <code>ConvertFormValuesToDynamicFields()</code> transforms typed values (bool, int, decimal, DateTime, arrays) into the universal <code>DynamicFieldValue</code> dictionary that flows through the entire system.</p>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Blazor Server</strong>: UI renders on the server, browser gets real-time updates via SignalR. The advantage: C# everywhere, no JavaScript needed. The disadvantage: requires persistent server connection.</li>\n<li><strong>Schema-driven rendering</strong>: Forms adapt to carrier/province/product without code changes.</li>\n<li><strong>CDM conversion</strong>: The bridge between "what the user typed" and "what the system processes."</li>\n</ul>',
      birthDate: "2024-03-07",
      phases: [
        { date: "2024-03-07", title: "Project Created", description: "Initial README and project scaffold." },
        { date: "2024-03-07", title: "Platform Foundation", description: "Core Blazor Server application with authentication, journal management, and multi-tenant support." },
        { date: "2025-01-01", title: "Feature Expansion", description: "Continued development with opportunities, referrals, customer records, and policy features." },
        { date: "2026-01-01", title: "Rating Platform Integration", description: "Added quote management UI, schema-driven forms, carrier credential management." },
        { date: "2026-03-01", title: "Current Sprint", description: "Active development on UI refinements, policy components, validation improvements, carrier credential management, and schema v0.0.7 support." },
        { date: "2026-03-25", title: "Latest Activity", description: "Policy UI labels, layout, and font style updates (PR 7249)." }
      ],
      totalCommits: 1310,
      totalContributors: 10,
      daysSinceLastCommit: 1,
      status: "active"
    },
    "bff": {
      narrative: "The Platform BFF (Backend for Frontend) was created on March 7, 2024 alongside the RPMClient. It acts as the API gateway between the Blazor frontend and 15+ microservices. With 285 total commits from 10+ contributors, it has evolved into a comprehensive service proxy layer handling journal operations, configuration, search, insights, policy management, quote management, and customer records. Recent development in March 2026 includes carrier credential management, CentralSchema integration (replacing SchemaCache direct access), static data refactoring, and quote management API integration with Key Vault-backed APIM key retrieval. Despite its critical role, it has no test coverage and the resilience policies for the QuoteService are commented out.",
      educate: '<h3>What This Service Does</h3>\n<p>The BFF (Backend For Frontend) is a thin API gateway between the Blazor frontend and all backend services. It has <strong>zero business logic</strong> — its only job is to proxy requests, add security headers (APIM subscription keys from Azure Key Vault), and return responses. Every API call from the browser goes through here.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>The proxy pattern</h4>\n<p>Each BFF controller maps 1:1 to a downstream service. When the frontend calls <code>POST /api/Quotes</code>, the BFF\'s <code>QuotesController</code> delegates to <code>QuoteService</code> which:</p>\n<ol>\n<li>Resolves the APIM subscription key (from config in dev, from Key Vault in prod)</li>\n<li>Adds <code>Ocp-Apim-Subscription-Key</code> header to the outbound request</li>\n<li>Forwards the request to the downstream <code>QuoteManagementApiUrl</code></li>\n<li>Wraps the response in a standard <code>ResponseGenerator</code> format</li>\n</ol>\n\n<h4>Why it exists</h4>\n<p>Without the BFF, the browser would need to know API keys, downstream service URLs, and handle auth tokens for each service individually. The BFF centralizes this — the frontend only needs to know one URL.</p>\n\n<h4>The 20+ controllers</h4>\n<p>The BFF proxies to many services beyond quoting: Journal (tasks, renewals, claims, opportunities), Customer Records, Search, Insights, Policy Applications, Store, Address Lookup, Configuration, Carrier Credentials, and more.</p>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>BFF pattern</strong>: One backend tailored for one frontend. Different frontends (mobile, web, partner API) could have different BFFs.</li>\n<li><strong>Key Vault integration</strong>: API keys stored in Azure Key Vault, never in code or browser.</li>\n<li><strong>No business logic</strong>: If you find business logic in the BFF, it\'s in the wrong place.</li>\n</ul>',
      birthDate: "2024-03-07",
      phases: [
        { date: "2024-03-07", title: "Project Created", description: "Initial README and BFF scaffold." },
        { date: "2024-03-07", title: "Core Proxy Layer", description: "Journal service proxying, configuration service, user management." },
        { date: "2025-01-01", title: "Service Expansion", description: "Added proxying for insights, referrals, customer records, policy management." },
        { date: "2026-01-01", title: "Rating Integration", description: "Added QuoteService with APIM key validation via Key Vault, CentralSchema service." },
        { date: "2026-02-01", title: "Feature Growth", description: "Opportunity orchestration, policy application orchestration, task management, document services." },
        { date: "2026-03-01", title: "Current Sprint", description: "CentralSchema migration, carrier credential management, static data refactoring, activity logs." },
        { date: "2026-03-23", title: "Latest Activity", description: "Carrier credentials management BFF integration (PR 7229)." }
      ],
      totalCommits: 285,
      totalContributors: 10,
      daysSinceLastCommit: 3,
      status: "active"
    }
  }
};
