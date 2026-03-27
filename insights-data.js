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
        example: "// QuoteManagement appsettings.json\n\"ServiceBus\": { \"Namespace\": \"sbns-rating-dev-001\", \"RequestQueue\": \"sbq-rating-requests-dev\" }\n\n// Orchestrator appsettings.json\n\"ServiceBus\": { \"FullyQualifiedNamespace\": \"sbns-ratingplatform-dev-001\", \"InputQueue\": \"sbq-initial-rating-requests\" }\n\n// Different namespace AND different queue names = zero communication",
        evidence: "File: appsettings.json - QuoteManagement: sbns-rating-dev-001 / sbq-rating-requests-dev. Orchestrator: sbns-ratingplatform-dev-001 / sbq-initial-rating-requests. Different namespace AND different queue names.",
        recommendation: "Align the Service Bus namespace and queue names. QuoteManagement should publish to 'sbq-initial-rating-requests' on 'sbns-ratingplatform-dev-001' to match what the Orchestrator consumes.",
        affectedComponents: ["quote_mgmt", "orchestrator"]
      },
      {
        id: "ins_qm_002",
        severity: "CRITICAL",
        category: "code_quality",
        title: "Schema service uses placeholder URL and mock data flag is ON",
        description: "SchemaServiceSettings.BaseUrl is set to 'https://schema-service-placeholder.azurewebsites.net' and UseMockData is set to true. This means the service is not actually connecting to the SchemaCache API for bundle resolution, relying on mock data instead. Why This Matters: Every quote that gets created uses fake bundle data, meaning carrier targeting is fictional - the system cannot actually route to real carriers.",
        example: "// appsettings.json\n\"SchemaServiceSettings\": {\n  \"BaseUrl\": \"https://schema-service-placeholder.azurewebsites.net\",  // <-- not a real URL\n  \"UseMockData\": true  // <-- hardcoded ON\n}\n\n// Models/ConfigurationOptions.cs\npublic bool UseMockData { get; set; } = true;  // default is also true",
        evidence: "File: appsettings.json, Lines 48-50 - BaseUrl: 'https://schema-service-placeholder.azurewebsites.net', UseMockData: true. Also in Models/ConfigurationOptions.cs: UseMockData defaults to true.",
        recommendation: "Update BaseUrl to point to the actual SchemaCache API URL and set UseMockData to false. The SchemaCache service exists and is deployed.",
        affectedComponents: ["quote_mgmt", "schema_cache"]
      },
      {
        id: "ins_qm_003",
        severity: "CRITICAL",
        category: "security",
        title: "No authentication middleware configured - UseAuthorization without UseAuthentication",
        description: "Program.cs calls app.UseAuthorization() but never calls app.UseAuthentication() or builder.Services.AddAuthentication(). The APIM key check added in PR 6915 provides API key validation, but there is no standard authentication middleware. Any [Authorize] attributes would be ineffective. Why This Matters: Without UseAuthentication(), the ClaimsPrincipal is always anonymous, so role-based or policy-based authorization silently fails open.",
        example: "// Program.cs\napp.UseRouting();\n// app.UseAuthentication();  <-- MISSING\napp.UseAuthorization();  // <-- present but useless without the line above\n\n// Any controller with [Authorize] will behave as if it's [AllowAnonymous]",
        evidence: "File: Program.cs, Line 163 - app.UseAuthorization() present but no AddAuthentication() or UseAuthentication() call anywhere in the file.",
        recommendation: "Add proper authentication middleware. If relying solely on APIM key validation, document this explicitly and ensure all endpoints are protected.",
        affectedComponents: ["quote_mgmt", "bff"]
      },
      {
        id: "ins_qm_004",
        severity: "CRITICAL",
        category: "code_quality",
        title: "Delete endpoint returns failure - not implemented",
        description: "The QuoteService.DeleteQuoteAsync method fetches the quote but then returns ServiceResult.Failure('Delete functionality not available'). The endpoint exists but always fails. Why This Matters: Any UI or API consumer that calls DELETE /api/v1/quotes/{id} will get a confusing 400-level error instead of a clear 501 Not Implemented.",
        example: "// Services/QuoteService.cs Lines 305-307\npublic async Task<ServiceResult> DeleteQuoteAsync(string id) {\n    var quote = await _repository.GetByIdAsync(id);\n    // TODO: Implement delete functionality when available in repository\n    return ServiceResult.Failure(\"Delete functionality not available\");\n}",
        evidence: "File: Services/QuoteService.cs, Lines 305-307 - '// TODO: Implement delete functionality when available in repository' followed by return ServiceResult.Failure.",
        recommendation: "Either implement the delete functionality or remove the endpoint to avoid confusion. A 501 Not Implemented status would be more appropriate than the current behavior.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_005",
        severity: "WARNING",
        category: "security",
        title: "Auth context hardcoded to 'system' user with random GUID",
        description: "Multiple locations in QuoteService generate a random GUID for systemUserId instead of extracting it from the authentication context. The UserName is hardcoded to 'system'. This means audit trails are meaningless - every action appears to come from a different random system user.",
        example: "// Services/QuoteService.cs (appears at lines 224, 257, 360, 380, 429, 449)\nvar systemUserId = Guid.NewGuid().ToString(); // TODO: Get from auth context\n...\nUserName = \"system\" // TODO: Get from auth context\n\n// Result: every quote event has a different random userId\n// Audit log becomes: \"User abc123 created quote\", \"User def456 updated quote\"\n// No way to trace actions back to actual humans",
        evidence: "File: Services/QuoteService.cs, Lines 224, 257, 360, 380, 429, 449 - 'var systemUserId = Guid.NewGuid().ToString(); // TODO: Get from auth context' and 'UserName = \"system\" // TODO: Get from auth context'",
        recommendation: "Inject the authenticated user context (e.g., via IHttpContextAccessor) and use actual user identity for audit trails.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_006",
        severity: "WARNING",
        category: "deployment",
        title: "MongoDB connection string not configured in appsettings.json",
        description: "The MongoDBDatabaseOptions section has DatabaseName and collection names but no ConnectionString property in the base appsettings.json. The MongoDB health check in Program.cs calls BuildServiceProvider() during registration which is an anti-pattern that creates a second DI container.",
        example: "// appsettings.json\n\"MongoDBDatabaseOptions\": {\n  \"DatabaseName\": \"QuoteManagement\",\n  \"QuoteCollection\": \"quotes\"\n  // ConnectionString: ???  <-- not here\n}\n\n// Program.cs Lines 136-137 (anti-pattern)\nvar sp = builder.Services.BuildServiceProvider();  // creates duplicate DI container\nvar mongoSettings = sp.GetRequiredService<IOptions<MongoDBDatabaseOptions>>();",
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
        example: "// Tests/IntegrationTests/Configuration/TestConfiguration.cs Lines 67-68\npublic string DevUrl => \"https://api-quotemanagement-dev.example.com\";  // TODO: Replace with actual URL\npublic string QaUrl => \"https://api-quotemanagement-qa.example.com\";   // TODO: Replace with actual URL",
        evidence: "File: Tests/IntegrationTests/Configuration/TestConfiguration.cs, Lines 67-68 - Dev URL: 'https://api-quotemanagement-dev.example.com' and QA URL: 'https://api-quotemanagement-qa.example.com' both marked with '// TODO: Replace with actual URL'",
        recommendation: "Update integration test configuration with actual deployed service URLs.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_008",
        severity: "WARNING",
        category: "code_quality",
        title: "Activity stalled - no commits in 44 days",
        description: "Last commit was on February 10, 2026. The service has 20 total commits with development appearing to have stalled after the opportunity-to-quote integration feature. Why This Matters: Multiple CRITICAL issues (Service Bus mismatch, mock data, no auth) remain unfixed while the service collects dust.",
        evidence: "Git log: Last commit ec412d5 on 2026-02-10. Total 20 commits since project creation on 2026-01-12.",
        recommendation: "Review whether this service is being actively developed or if work has shifted elsewhere. The service has several TODO items and incomplete features.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_009",
        severity: "CRITICAL",
        category: "code_quality",
        title: "SchemaVersion mismatch - document defaults to 2.1.0 but validation checks for 2.0.0",
        description: "The Quote document model defaults SchemaVersion to '2.1.0' in its constructor, but the validation logic checks for SchemaVersion == '2.0.0'. Every quote created with the default version will fail validation. Why This Matters: This is a silent data contract mismatch - quotes appear to save successfully but downstream processing rejects them.",
        example: "// Models/QuoteDocument.cs\npublic QuoteDocument() {\n    SchemaVersion = \"2.1.0\";  // default for new quotes\n}\n\n// Validators/QuoteValidator.cs\nRuleFor(x => x.SchemaVersion)\n    .Must(v => v == \"2.0.0\")  // only accepts 2.0.0!\n    .WithMessage(\"Unsupported schema version\");\n\n// Result: EVERY new quote fails validation",
        evidence: "Models/QuoteDocument.cs sets SchemaVersion = '2.1.0'. Validators/QuoteValidator.cs checks for '2.0.0'. Version mismatch causes all quotes to fail validation.",
        recommendation: "Align the SchemaVersion: either update the validator to accept '2.1.0' or change the document default to '2.0.0'. Consider supporting a range of versions.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_010",
        severity: "CRITICAL",
        category: "code_quality",
        title: "DI registration failure - RatingSubmissionService injects unregistered type",
        description: "RatingSubmissionService constructor injects IOptions<ServiceBusSettings> but Program.cs only registers AzServiceBusOptions via Configure<AzServiceBusOptions>(). The type names don't match, causing a runtime DI resolution failure. Why This Matters: The rating submission flow - the core purpose of this service - will throw an InvalidOperationException at runtime.",
        example: "// Services/RatingSubmissionService.cs\npublic RatingSubmissionService(IOptions<ServiceBusSettings> settings) {  // expects ServiceBusSettings\n    _settings = settings.Value;\n}\n\n// Program.cs\nbuilder.Services.Configure<AzServiceBusOptions>(  // registers AzServiceBusOptions\n    builder.Configuration.GetSection(\"AzServiceBus\")\n);\n\n// At runtime: No service for type 'IOptions<ServiceBusSettings>' has been registered",
        evidence: "Services/RatingSubmissionService.cs injects IOptions<ServiceBusSettings>. Program.cs registers Configure<AzServiceBusOptions>. Type mismatch = runtime DI failure.",
        recommendation: "Either rename AzServiceBusOptions to ServiceBusSettings, or add a second registration: builder.Services.Configure<ServiceBusSettings>(config.GetSection(\"AzServiceBus\")).",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_011",
        severity: "WARNING",
        category: "performance",
        title: "No MongoDB index on OpportunityId field - collection scans on every lookup",
        description: "The quote collection is frequently queried by OpportunityId (the opportunity-to-quote lookup), but there is no MongoDB index defined for this field. Every lookup performs a full collection scan. Why This Matters: As the quotes collection grows, the GET /api/v1/quotes/by-opportunity/{id} endpoint will slow linearly with collection size.",
        example: "// Repository/QuoteRepository.cs\npublic async Task<QuoteDocument?> GetByOpportunityIdAsync(string opportunityId) {\n    return await _collection\n        .Find(q => q.OpportunityId == opportunityId)  // no index = collection scan\n        .FirstOrDefaultAsync();\n}\n\n// No CreateIndex call anywhere in the codebase for OpportunityId\n// MongoDB will scan every document in the quotes collection",
        evidence: "Repository queries by OpportunityId field but no index is created. No EnsureIndex or CreateIndex call exists for OpportunityId in the repository or startup code.",
        recommendation: "Add a MongoDB index on OpportunityId: collection.Indexes.CreateOne(new CreateIndexModel<QuoteDocument>(Builders<QuoteDocument>.IndexKeys.Ascending(q => q.OpportunityId)));",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_012",
        severity: "WARNING",
        category: "code_quality",
        title: "DateTime.Now vs DateTime.UtcNow inconsistency across codebase",
        description: "The codebase mixes DateTime.Now (local server time) and DateTime.UtcNow across different files. Event timestamps, audit logs, and status updates use inconsistent time references. Why This Matters: When running in Azure (UTC servers) vs local dev (ET/PT), timestamps will differ by hours, making event ordering unreliable.",
        example: "// Services/QuoteService.cs Line 230\nevent.Timestamp = DateTime.Now;  // local time\n\n// Services/RatingResponseHandlerService.cs Line 45\nresponse.ReceivedAt = DateTime.UtcNow;  // UTC time\n\n// Models/QuoteDocument.cs\nCreatedAt = DateTime.Now;  // local time again\n\n// Result: event log shows 10:30 AM (local) then 3:30 PM (UTC) for events\n// that happened minutes apart",
        evidence: "Mixed usage of DateTime.Now and DateTime.UtcNow found in QuoteService.cs, RatingResponseHandlerService.cs, and QuoteDocument.cs.",
        recommendation: "Standardize on DateTime.UtcNow everywhere. Consider using DateTimeOffset for timezone-aware timestamps.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_013",
        severity: "INFO",
        category: "architecture",
        title: "Good test coverage structure with unit and integration test separation",
        description: "The project has a well-organized test structure with 14+ unit test files covering controllers, services, repositories, models, DTOs, and messaging. Integration tests cover CRUD operations, rating, and health endpoints.",
        evidence: "Test files cover: QuotesControllerTests, QuoteServiceTests, QuoteRepositoryTests, RatingSubmissionServiceTests, RatingResponseHandlerServiceTests, CarrierBundleResolutionServiceTests, OpportunityMessageConsumerTests, and 7+ integration test files.",
        recommendation: "Continue expanding test coverage, particularly around the delete functionality and error edge cases.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_014",
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
        description: "The appsettings.prod.json has empty FullyQualifiedServiceBusNamespace, empty StorageAccount.AccountName, and empty Apim.BaseUrl. While comments say to inject via environment variables, if those aren't set, the service will throw InvalidOperationException at startup. Why This Matters: A misconfigured deployment will crash the pod repeatedly with no clear error message unless you check container logs.",
        example: "// appsettings.prod.json\n\"ServiceBus\": {\n  \"FullyQualifiedServiceBusNamespace\": \"\",  // empty!\n},\n\"StorageAccount\": {\n  \"AccountName\": \"\"  // empty!\n},\n\"Apim\": {\n  \"BaseUrl\": \"\",  // empty!\n  \"SubscriptionKey\": \"\"  // empty!\n}\n\n// Program.cs will throw:\n// InvalidOperationException: 'OrchestratorConfiguration' section is required",
        evidence: "File: appsettings.prod.json - ServiceBus.FullyQualifiedServiceBusNamespace: '', StorageAccount.AccountName: '', Apim.BaseUrl: '', Apim.SubscriptionKey: ''",
        recommendation: "Verify that Azure Container App environment variables are properly configured for production. Consider adding startup validation that fails fast with descriptive error messages if required config is missing.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_002",
        severity: "WARNING",
        category: "code_quality",
        title: "Dead-letter logic not implemented (Phase 2 TODO)",
        description: "MessageProcessor.cs has a TODO comment indicating dead-letter logic for invalid messages is not yet implemented. In production, invalid messages could block the queue or be silently abandoned. Why This Matters: A single malformed message could cause the processor to crash-loop or silently drop messages, with no observability into what went wrong.",
        example: "// Services/MessageProcessor.cs Line 77\ncatch (ValidationException ex) {\n    _logger.LogWarning(\"Message failed validation: {Error}\", ex.Message);\n    // TODO: In Phase 2, implement dead-letter logic here\n    // For now, complete the message (silently drops it)\n    await receiver.CompleteMessageAsync(message);\n}\n\n// appsettings.prod.json\n\"DeadLetterOnValidationFailure\": true  // config exists but code ignores it",
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
        example: "// Tests/UnitTests/Services/StorageServiceTests.cs Line 188\n[Fact(Skip = \"TODO: v0.12+ - metadata storage not yet implemented\")]\npublic async Task StoreAsync_ShouldPersistMetadata() { ... }\n\n// MessageProcessorTests.cs Line 391\n// TODO: Re-enable when telemetry export is implemented\n// Assert.Equal(1, _metrics.MessagesProcessed);",
        evidence: "Files: Tests/UnitTests/Services/StorageServiceTests.cs Line 188, MessageProcessorTests.cs Lines 115, 391, 444, 464 - Multiple '// TODO: v0.12+' and '// TODO: Re-enable when...' comments with disabled test assertions.",
        recommendation: "Track these deferred items in the backlog. The disabled tests indicate feature gaps that should be prioritized.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_004",
        severity: "INFO",
        category: "architecture",
        title: "Excellent observability setup with OpenTelemetry and Application Insights",
        description: "The Orchestrator has comprehensive telemetry: custom ActivitySource and Meters, distributed tracing across HTTP/ServiceBus/Azure SDK, Azure Monitor exporters, and environment-aware console exporters for development. This is the gold standard for the platform.",
        example: "// Program.cs Lines 148-231\nservices.AddOpenTelemetry()\n  .WithTracing(builder => builder\n    .AddSource(\"RatingOrchestrator\")\n    .AddHttpClientInstrumentation()\n    .AddAzureServiceBusInstrumentation()\n    .AddAzureMonitorTraceExporter())\n  .WithMetrics(builder => builder\n    .AddMeter(\"RatingOrchestrator\")\n    .AddAzureMonitorMetricExporter());",
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
        example: "// Program.cs Lines 58-72\nvar orchConfig = config.GetSection(\"Orchestrator\").Get<OrchestratorConfiguration>()\n    ?? throw new InvalidOperationException(\"'Orchestrator' config section is required\");\nvar storageConfig = config.GetSection(\"StorageAccount\").Get<StorageAccountConfiguration>()\n    ?? throw new InvalidOperationException(\"'StorageAccount' config section is required\");",
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
        description: "The SGI carrier adapter BaseUrl is 'https://api.sgi.example.com' in all environment configs (default, dev, qa). This is clearly a placeholder domain that will never resolve. The SGI carrier is listed as active in the Carriers array. Why This Matters: Any quote that targets SGI will timeout or DNS-fail, and with the default retry policy (3 retries), it will burn 30+ seconds before failing.",
        example: "// appsettings.json, appsettings.dev.json, appsettings.qa.json\n\"SGI\": {\n  \"BaseUrl\": \"https://api.sgi.example.com\",  // placeholder in ALL environments\n  \"Auth\": {\n    \"TokenUrl\": \"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token\"  // {tenant} not replaced\n  }\n}\n\n// Also in appsettings.json:\n\"CarrierConnector\": { \"Carriers\": [\"peacehills\", \"aviva\", \"avivatraders\", \"sgi\"] }  // sgi is active!",
        evidence: "Files: appsettings.json, appsettings.dev.json, appsettings.qa.json - SGI.BaseUrl: 'https://api.sgi.example.com'. Also Auth.TokenUrl uses '{tenant}' placeholder. CarrierConnector.Carriers includes 'sgi'.",
        recommendation: "Either configure the real SGI API URL or remove 'sgi' from the active Carriers list until integration is ready. Current config will cause runtime failures for SGI rating requests.",
        affectedComponents: ["carrier_connector", "orchestrator"]
      },
      {
        id: "ins_cc_002",
        severity: "WARNING",
        category: "performance",
        title: "Console OTLP exporter enabled unconditionally in production",
        description: "The OpenTelemetry configuration in Program.cs adds AddConsoleExporter() without any environment check. This will write telemetry data to stdout in production, adding unnecessary I/O overhead and log noise.",
        example: "// Program.cs Lines 85, 97\n.WithTracing(builder => builder\n    .AddConsoleExporter()) // For dev/testing  <-- no environment guard!\n.WithMetrics(builder => builder\n    .AddConsoleExporter()) // For dev/testing  <-- no environment guard!\n\n// Compare with Orchestrator (correct pattern):\nif (builder.Environment.IsDevelopment()) {\n    tracerBuilder.AddConsoleExporter();\n}",
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
        example: "// appsettings.prod.json\n\"CarrierAdapters\": {\n  \"PeaceHills\": { \"BaseUrl\": \"\", \"Auth\": { \"ApiKey\": \"\" } },\n  \"Aviva\":      { \"BaseUrl\": \"\", \"Auth\": { \"TokenUrl\": \"\", \"ClientId\": \"\", \"ClientSecret\": \"\" } },\n  \"SGI\":        { \"BaseUrl\": \"\", \"Auth\": { \"TokenUrl\": \"\", \"ClientId\": \"\", \"ClientSecret\": \"\" } }\n}\n// ALL empty - relies entirely on env var injection at deploy time",
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
        example: "// Tests/UnitTests/UnitTest1.cs\nnamespace CarrierConnector.Tests.UnitTests;\n\npublic class UnitTest1 {\n    [Fact]\n    public void Test1() {\n        // empty - no assertions, no arrange, no act\n    }\n}",
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
        example: "// appsettings.json per carrier\n\"Resilience\": {\n  \"Retry\": { \"MaxRetries\": 3, \"BaseDelaySeconds\": 1, \"JitterMilliseconds\": 500 },\n  \"Timeout\": { \"PerRequestSeconds\": 30, \"TotalSeconds\": 90 },\n  \"CircuitBreaker\": { \"FailureThreshold\": 5, \"BreakDurationSeconds\": 30 }\n}\n// Each carrier can have different resilience settings based on their API reliability",
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
        description: "The Rating section has a hardcoded BasePremium of 1000.0 in all environment configs. This appears to be a test/placeholder value used by the PremiumCalculator simulator. Why This Matters: All simulated carrier quotes start from the same $1,000 base, making competitive comparisons between carriers meaningless in testing.",
        example: "// appsettings.json, appsettings.dev.json, appsettings.prod.json\n\"Rating\": {\n  \"BasePremium\": 1000.0  // same value everywhere\n}\n\n// PremiumCalculator uses this as starting point:\n// premium = BasePremium * ageFactor * provinceFactor * coverageFactor\n// e.g., 1000.0 * 1.2 * 0.95 * 1.1 = $1,254.00",
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
        description: "The SchemaCache API has no authentication middleware. Any client can read/write schema data without credentials. There is no UseAuthentication(), AddAuthentication(), or [Authorize] attribute usage. Why This Matters: A malicious actor could overwrite carrier schemas, changing form fields or bundle definitions, causing downstream rating failures or data exfiltration.",
        example: "// Program.cs - no auth middleware at all\napp.UseRouting();\n// app.UseAuthentication();   <-- MISSING\n// app.UseAuthorization();    <-- MISSING\napp.MapControllers();\n\n// Any HTTP client can:\n// PUT /api/v1/schemas/{id}  - overwrite any schema\n// POST /api/v1/schemas/{id}/activate  - activate any schema version\n// No credentials required",
        evidence: "File: Program.cs - No authentication/authorization middleware. The API exposes CRUD operations on schema data with no access control.",
        recommendation: "Add API key validation or Azure AD authentication. At minimum, write operations (upsert, activate) should require authentication.",
        affectedComponents: ["schema_cache", "quote_mgmt", "bff"]
      },
      {
        id: "ins_sc_002",
        severity: "WARNING",
        category: "code_quality",
        title: "Stale - no commits in 56 days",
        description: "Last commit was January 29, 2026. The service has only 12 total commits. Development appears to have stopped after the shard key support feature. Why This Matters: QuoteManagement still uses mock data instead of connecting to this service, meaning the integration that SchemaCache was built for has never been completed.",
        evidence: "Git log: Last commit a322400 on 2026-01-29. First commit on 2026-01-12. Only 12 total commits.",
        recommendation: "Determine if the SchemaCache is feature-complete or if development has stalled. QuoteManagement still uses mock data instead of connecting to this service.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_003",
        severity: "WARNING",
        category: "code_quality",
        title: "Bus factor = 1 (Satish Natarajan owns 50% of commits)",
        description: "Of 12 total commits, Satish Natarajan has 6. The next contributor (Alexander Vergeichik) has 3 which appear to be infrastructure/pipeline work. Only one person understands the domain logic.",
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
        example: "// Program.cs Lines 20-44\nBsonClassMap.RegisterClassMap<FormSection>(cm => {\n    cm.AutoMap();\n    cm.UnmapMember(c => c.Id);  // prevent MongoDB from treating this as _id\n    cm.MapMember(c => c.Id).SetElementName(\"id\");  // map it as a regular field\n});\n// Same pattern for Step.Id - prevents serialization conflicts",
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
        description: "The RPMClient Dockerfile uses mcr.microsoft.com/dotnet/aspnet:8.0 and sdk:8.0, while QuoteManagement, Orchestrator, CarrierConnector, and SchemaCache all use .NET 9.0. This version mismatch could cause issues with shared packages. Why This Matters: Shared NuGet packages targeting .NET 9.0 features (like the new System.Text.Json source generators) won't work in the .NET 8.0 client.",
        example: "// RPMClient/Dockerfile\nFROM mcr.microsoft.com/dotnet/aspnet:8.0    // <-- .NET 8\nFROM mcr.microsoft.com/dotnet/sdk:8.0       // <-- .NET 8\n\n// QuoteManagement/Dockerfile\nFROM mcr.microsoft.com/dotnet/aspnet:9.0    // <-- .NET 9\nFROM mcr.microsoft.com/dotnet/sdk:9.0       // <-- .NET 9\n\n// Same pattern in Orchestrator, CarrierConnector, SchemaCache",
        evidence: "File: RPMClient/Dockerfile Lines 3, 9 - 'FROM mcr.microsoft.com/dotnet/aspnet:8.0' and 'FROM mcr.microsoft.com/dotnet/sdk:8.0'. All other rating services use :9.0.",
        recommendation: "Plan an upgrade to .NET 9.0 for consistency across the platform. Check if shared NuGet packages have .NET 9.0 dependencies.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_002",
        severity: "WARNING",
        category: "code_quality",
        title: "No unit or integration tests found",
        description: "The RPMClient project has no test project. The only 'Tests' directory found is a Models/Tests folder which appears to contain test data models, not actual test cases. The Dockerfile has no test stage. Why This Matters: With 1,310 commits and 30+ service registrations, this is the highest-risk untested codebase. UI regressions go undetected until a user reports them.",
        example: "// What exists:\nModels/Tests/   <-- test DATA models, not actual tests\n\n// What's missing:\n// No *.Tests.csproj anywhere\n// No bUnit component tests\n// No integration tests\n// Dockerfile has no 'test' stage (compare with backend services)\n\n// Backend services all have:\n// FROM build AS test\n// RUN dotnet test --collect:\"XPlat Code Coverage\"",
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
        description: "The BFF appsettings.json has an empty QuoteManagementApiUrl while all other service URLs are populated with dev environment values. This means the BFF cannot proxy quote management requests in production without environment variable override. Why This Matters: The entire quoting workflow (create quote, submit for rating, view offers) is broken at the BFF layer.",
        example: "// appsettings.json\n\"ConnectionStrings\": {\n  \"JournalTasksApiUrl\": \"https://api-journal-tasks-dev.azurewebsites.net\",     // populated\n  \"ConfigurationApiUrl\": \"https://api-configuration-dev.azurewebsites.net\",    // populated\n  \"QuoteManagementApiUrl\": \"\",                                                  // EMPTY!\n  \"CentralSchemaApiUrl\": \"https://api-central-schema-dev.azurewebsites.net\"    // populated\n}",
        evidence: "File: appsettings.json Line 35 - 'QuoteManagementApiUrl': '' (empty). Compare with other URLs like JournalTasksApiUrl, ConfigurationApiUrl which have values.",
        recommendation: "Set the QuoteManagementApiUrl to the correct APIM or direct endpoint URL for each environment.",
        affectedComponents: ["bff", "quote_mgmt"]
      },
      {
        id: "ins_bff_002",
        severity: "CRITICAL",
        category: "code_quality",
        title: "Resilience policies commented out for QuoteService HTTP client",
        description: "The Polly resilience policies (retry, circuit breaker, fallback) are commented out for the QuoteService HTTP client registration. This means there is no retry or circuit breaker protection for quote management API calls. Why This Matters: A single transient failure from the Quote Management API will bubble up as a 500 to the user with no retry attempt.",
        example: "// Program.cs Line 19\nbuilder.Services.AddHttpClient<IQuoteService, QuoteService>(client => {\n    client.BaseAddress = new Uri(quoteManagementApiUrl);\n})\n//    .AddResiliencePolicies(nameof(PollyPolicyOptions), builder.Configuration);\n//    ^^^ COMMENTED OUT - no retry, no circuit breaker\n\n// The config exists but is unused:\n// appsettings.json: \"PollyPolicyOptions\": { \"RetryCount\": 3, \"CircuitBreakerCount\": 5 }",
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
        example: "// appsettings.Development.json Line 32\n\"ApplicationInsights\": {\n  \"ConnectionString\": \"InstrumentationKey=227921b9-...;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=...\"\n}",
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
        example: "// Program.cs - NO health checks\n// Compare with other services:\n// QuoteManagement: /health/ready, /health/live\n// Orchestrator: ServiceBusHealthCheck\n// SchemaCache: /health\n// CarrierConnector: health checks per carrier\n\n// BFF has NOTHING - Azure Container App cannot probe readiness",
        evidence: "File: Program.cs - No health check related code. Compare with QuoteManagement (/health/ready, /health/live), Orchestrator (ServiceBusHealthCheck), SchemaCache (/health), and CarrierConnector which all have health checks.",
        recommendation: "Add health check endpoints that verify connectivity to downstream services (Journal APIs, Quote Management, Configuration API, etc.).",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_005",
        severity: "WARNING",
        category: "code_quality",
        title: "No test project exists",
        description: "The BFF has no unit or integration test project despite being the critical middleware layer between the frontend and 15+ backend services. Why This Matters: The BFF contains orchestration logic (OpportunityRequestOrchestrator, PolicyApplicationOrchestrator) that combines data from multiple downstream services - exactly the kind of logic that needs tests.",
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
        example: "// Models/UserManagement/Request/UserViewRequest.cs Line 15\npublic string? UserType { get; set; }  // TODO: To be removed (will be using SelectedRoles/Roles going forward)\n\n// Response/UserDetailResponse.cs Line 10\npublic string? UserType { get; set; }  // TODO: To be removed\n\n// Response/UserViewResponse.cs Line 16\npublic string? UserType { get; set; }  // TODO: To be removed",
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
        example: "// Program.cs - 15+ service registrations\nbuilder.Services.AddScoped<IJournalTaskService, JournalTaskService>();\nbuilder.Services.AddScoped<IRenewalService, RenewalService>();\nbuilder.Services.AddScoped<IClaimService, ClaimService>();\nbuilder.Services.AddScoped<IBookOfBusinessService, BookOfBusinessService>();\nbuilder.Services.AddScoped<IOpportunityService, OpportunityService>();\nbuilder.Services.AddScoped<IQuoteService, QuoteService>();\nbuilder.Services.AddScoped<ICentralSchemaService, CentralSchemaService>();\n// ... 8 more services",
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
      educate: '<h3>What This Service Does</h3>\n<p>Quote Management is the coordinator of the quoting process. When an insurance broker wants to get quotes from multiple carriers (like Aviva, SGI, Peace Hills) for a customer, this service:</p>\n<ol>\n<li>Creates a quote record with all the customer/vehicle/property details</li>\n<li>Figures out which insurance carriers need to be contacted</li>\n<li>Packages the data and drops it on a message queue for processing</li>\n<li>Receives pricing responses back from carriers</li>\n<li>Computes the best offer and presents it</li>\n</ol>\n\n<h3>How It Works Under The Hood</h3>\n<h4>Step 1: A broker submits a quote</h4>\n<p>An HTTP POST arrives at <code>/api/v1/quotes</code>. The controller first checks for an APIM subscription key in the headers - without it, you get a 401. Then it validates the request has <code>Routing</code> (what kind of insurance) and <code>CdmData</code> (the actual form data).</p>\n\n<p>The service then does something clever: if the broker didn\'t explicitly list which carriers to quote with, it extracts them from the CDM data. It looks for a field called <code>policy.insuranceCompanies</code> which might be comma-separated like <code>"WAWA,SGI"</code> or indexed like <code>policy.insuranceCompanies[0]</code>, <code>policy.insuranceCompanies[1]</code>.</p>\n\n<p>Each carrier ID gets turned into a "bundle ID" - a string like <code>INTACT.AUTO.rate.csio-2023@1.0.0</code> that tells the rating system exactly what format and version to use for that carrier.</p>\n\n<h4>Step 2: The quote document</h4>\n<p>The data gets saved to MongoDB as a document that looks like this:</p>\n<pre>{\n  "_id": "a1b2c3d4-...",\n  "docType": "quoteWip",\n  "status": "Draft",\n  "routing": { "productCode": "PersAuto", "intent": "quote", "standard": "CSIO" },\n  "carrierTargets": [\n    { "carrierId": "INTACT", "bundleId": "intact.PersAuto.quote.csio-1.49@3.0.0" },\n    { "carrierId": "AVIVA", "bundleId": "aviva.PersAuto.quote.csio-1.48@2.0.0" }\n  ],\n  "cdmData": {\n    "fields": {\n      "drivers[0].firstName": { "kind": "string", "raw": "John" },\n      "drivers[0].lastName": { "kind": "string", "raw": "Smith" },\n      "vehicle[0].year": { "kind": "number", "raw": "2024", "numberValue": 2024 },\n      "vehicle[0].make": { "kind": "string", "raw": "Toyota" }\n    }\n  },\n  "pricingSummary": { "state": "NotRated", "offers": [] },\n  "events": [{ "type": "QuoteCreated", "at": "2026-03-25T10:30:00" }]\n}</pre>\n\n<h4>Step 3: Submitting for rating</h4>\n<p>When the broker hits "Get Quotes", a POST to <code>/api/v1/quotes/{id}/rate</code> triggers the rating submission. The service validates the quote has carrier targets and CDM data, generates a job ID, and publishes a message to Azure Service Bus queue <code>sbq-rating-requests-dev</code>.</p>\n\n<p>The message body looks like:</p>\n<pre>{\n  "messageType": "RatingRequest",\n  "jobId": "e5f6g7h8-...",\n  "quoteId": "a1b2c3d4-...",\n  "carrierTargets": [...],\n  "cdmData": { "fields": {...} },\n  "meta": { "source": "rpm-quoting-service" }\n}</pre>\n\n<h4>Step 4: Receiving responses</h4>\n<p>A background worker (<code>RatingResponseReader</code>) continuously listens on the <code>sbq-rating-responses-dev</code> queue. When a carrier response arrives, it updates the quote with an offer:</p>\n<pre>{\n  "carrierId": "INTACT",\n  "status": "Rated",\n  "termPremium": 1200.00,\n  "taxes": 180.00,\n  "totalPayable": 1380.00,\n  "currency": "CAD"\n}</pre>\n<p>The service then computes the "best offer" (lowest totalPayable) and updates the overall pricing state to "Rated" once all carriers have responded.</p>\n\n<h3>How It Connects to Other Services</h3>\n<div class="connection-example">\n  <strong>Upstream:</strong> The RPM Client (Blazor frontend) &rarr; Web BFF &rarr; Quote Management. The BFF adds the APIM subscription key and forwards the request.<br>\n  <strong>Downstream:</strong> Quote Management publishes to Service Bus &rarr; Rating Orchestrator picks it up &rarr; fans out to Carrier Connector &rarr; responses flow back through Service Bus &rarr; Quote Management updates the offers.\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>CDM (Common Data Model)</strong>: A flat key-value bag of all the form data. Keys are dot-separated paths like <code>drivers[0].firstName</code>. This is the universal format that gets translated to carrier-specific formats later.</li>\n<li><strong>Bundle</strong>: A configuration package that defines how to talk to a specific carrier. The bundle ID encodes: carrier, product, intent, standard, and version. Example: <code>intact.PersAuto.quote.csio-1.49@3.0.0</code> means "Intact, Personal Auto, quoting, CSIO standard version 1.49, bundle version 3.0.0".</li>\n<li><strong>PricingSummary</strong>: Tracks the overall state of rating (NotRated &rarr; PartiallyRated &rarr; Rated) and holds all carrier offers plus the computed best offer.</li>\n<li><strong>Events</strong>: The quote maintains an event log (QuoteCreated, QuoteUpdated, SubmittedForRating, OfferReceived) - a lightweight audit trail.</li>\n</ul>',
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
      educate: '<h3>What This Service Does</h3>\n<p>The Rating Orchestrator is a background worker service (no HTTP endpoints) that acts as the central nervous system of the rating pipeline. It sits between Quote Management and Carrier Connector, receiving rating requests from one side and fanning them out to multiple carriers on the other side. Think of it as a mail room: one envelope comes in addressed to "get me quotes from Aviva, SGI, and Peace Hills", and the orchestrator opens it and sends three separate letters out.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>Step 1: Consuming messages from Service Bus</h4>\n<p>The <code>RatingOrchestratorService</code> is an ASP.NET <code>BackgroundService</code> that runs in an infinite loop. On each iteration, it calls <code>ServiceBusReceiver.ReceiveMessageAsync()</code> on the <code>sbq-initial-rating-requests</code> queue. When a message arrives, it hands it to the <code>MessageProcessor</code>.</p>\n\n<h4>Step 2: Validation</h4>\n<p>The <code>MessageValidator</code> checks the incoming message for required fields:</p>\n<ul>\n<li>Must have a <code>jobId</code> and <code>quoteId</code></li>\n<li>Must have at least one entry in <code>carrierTargets</code></li>\n<li>Each carrier target must have a valid <code>bundleId</code></li>\n<li>The <code>cdmData.fields</code> object must not be empty</li>\n</ul>\n<p>The <code>BundleFieldValidator</code> then checks that the CDM data contains required fields for each bundle (e.g., a PersAuto bundle requires driver and vehicle data).</p>\n\n<h4>Step 3: Store to Blob</h4>\n<p>Before fanning out, the orchestrator stores the full rating request payload to Azure Blob Storage. The blob path follows the pattern: <code>rating-requests/{jobId}/{quoteId}.json</code>. This provides an audit trail and allows re-processing if needed.</p>\n\n<h4>Step 4: Fan-out per carrier</h4>\n<p>This is the core logic. If a quote targets INTACT, AVIVA, and SGI, the orchestrator creates 3 separate <code>CarrierRatingMessage</code> objects and publishes each to the <code>sbq-rating-jobs</code> queue:</p>\n<pre>// For a quote targeting 3 carriers, 3 messages are published:\n\n// Message 1:\n{\n  "messageType": "CarrierRatingJob",\n  "jobId": "e5f6g7h8-...",\n  "quoteId": "a1b2c3d4-...",\n  "carrierId": "INTACT",\n  "bundleId": "intact.PersAuto.quote.csio-1.49@3.0.0",\n  "cdmData": { "fields": { ... } }\n}\n\n// Message 2:\n{\n  "messageType": "CarrierRatingJob",\n  "carrierId": "AVIVA",\n  "bundleId": "aviva.PersAuto.quote.csio-1.48@2.0.0",\n  ...\n}\n\n// Message 3:\n{\n  "messageType": "CarrierRatingJob",\n  "carrierId": "SGI",\n  "bundleId": "sgi.PersAuto.quote.csio-1.48@1.0.0",\n  ...\n}</pre>\n\n<h4>Step 5: Response collection</h4>\n<p>A second background worker, <code>RatingResponseProcessorService</code>, listens on the <code>sbq-rating-responses</code> queue. As carrier responses arrive, it aggregates them and delivers the final result back to Quote Management via APIM (using the configured <code>Apim.BaseUrl</code> and <code>Apim.SubscriptionKey</code>).</p>\n\n<h4>Error Handling &amp; Dead-Lettering</h4>\n<p>Currently, invalid messages are logged and completed (silently dropped). The <code>DeadLetterOnValidationFailure</code> config flag exists in appsettings but the code to dead-letter messages is marked as a Phase 2 TODO. In the current state, a malformed message simply disappears.</p>\n\n<h3>How It Connects to Other Services</h3>\n<div class="connection-example">\n  <strong>Inbound:</strong> Quote Management &rarr; Service Bus queue <code>sbq-initial-rating-requests</code> &rarr; Orchestrator consumes<br>\n  <strong>Outbound (fan-out):</strong> Orchestrator &rarr; Service Bus queue <code>sbq-rating-jobs</code> &rarr; Carrier Connector consumes<br>\n  <strong>Inbound (responses):</strong> Carrier Connector &rarr; Service Bus queue <code>sbq-rating-responses</code> &rarr; Orchestrator consumes<br>\n  <strong>Outbound (delivery):</strong> Orchestrator &rarr; APIM &rarr; Quote Management HTTP endpoint to deliver final pricing<br>\n  <strong>Storage:</strong> Orchestrator &rarr; Azure Blob Storage for request archival\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Fan-out</strong>: The pattern of taking a single input message and producing N output messages, one per carrier. This allows each carrier rating to be processed independently and in parallel.</li>\n<li><strong>Background Service</strong>: Unlike the other APIs, the Orchestrator has no HTTP endpoints. It runs as a long-lived worker process using ASP.NET\'s <code>BackgroundService</code> base class.</li>\n<li><strong>Distributed Tracing</strong>: The Orchestrator propagates trace context through Service Bus message properties, so a single quote request can be traced from the BFF all the way through the Orchestrator to individual carrier calls in Application Insights.</li>\n<li><strong>Message Processor Pipeline</strong>: Messages flow through: Receive &rarr; Deserialize &rarr; Validate &rarr; Store to Blob &rarr; Fan-out &rarr; Complete message. Each step is instrumented with OpenTelemetry spans.</li>\n</ul>',
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
      educate: '<h3>What This Service Does</h3>\n<p>The Carrier Connector is the outbound gateway that translates universal insurance data (CDM format) into carrier-specific API calls. Each insurance carrier (Aviva, SGI, Peace Hills, etc.) has a different API: some use REST, some use SOAP, some require OAuth2, others use API keys. The Carrier Connector abstracts all of this behind a unified adapter pattern.</p>\n\n<p>Currently, the service operates in <strong>simulation mode</strong> - it does not actually call real carrier APIs. Instead, it uses a <code>PremiumCalculator</code> that generates realistic-looking premium quotes based on the input data (driver age, province, coverage type, vehicle details).</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>Step 1: Receiving a carrier rating job</h4>\n<p>The Carrier Connector listens on the <code>sbq-rating-jobs</code> Service Bus queue (published by the Orchestrator). Each message targets a single carrier:</p>\n<pre>{\n  "messageType": "CarrierRatingJob",\n  "jobId": "e5f6g7h8-...",\n  "quoteId": "a1b2c3d4-...",\n  "carrierId": "AVIVA",\n  "bundleId": "aviva.PersAuto.quote.csio-1.48@2.0.0",\n  "cdmData": {\n    "fields": {\n      "drivers[0].dateOfBirth": { "kind": "date", "raw": "1990-05-15" },\n      "drivers[0].province": { "kind": "string", "raw": "ON" },\n      "vehicle[0].year": { "kind": "number", "raw": "2024", "numberValue": 2024 },\n      "coverage.type": { "kind": "string", "raw": "comprehensive" }\n    }\n  }\n}</pre>\n\n<h4>Step 2: Adapter routing</h4>\n<p>The <code>CarrierAdapterFactory</code> selects the correct adapter based on the <code>carrierId</code>. Each carrier has a dedicated adapter class:</p>\n<ul>\n<li><strong>PeaceHillsAdapter</strong>: Talks to Guidewire ClaimCenter via REST. Auth: API Key in header.</li>\n<li><strong>AvivaAdapter</strong>: REST API with OAuth2 client_credentials flow. Gets a token from Azure AD, then calls the Aviva rating endpoint.</li>\n<li><strong>AvivaTraders</strong>: Similar to Aviva but different tenant and endpoints.</li>\n<li><strong>SgiAdapter</strong>: SOAP-based API with OAuth2. Would convert CDM data to CSIO XML format, wrap in a SOAP envelope, and POST. Currently simulated.</li>\n</ul>\n\n<h4>Step 3: CDM to carrier-specific translation</h4>\n<p>In production, the adapter would translate CDM fields to the carrier\'s expected format. For example, CSIO XML translation would convert:</p>\n<pre>// CDM input:\n"drivers[0].firstName" = "John"\n"drivers[0].lastName" = "Smith"\n"drivers[0].dateOfBirth" = "1990-05-15"\n\n// CSIO XML output:\n&lt;ACORD&gt;\n  &lt;InsuranceSvcRq&gt;\n    &lt;PersPkgPolicyQuoteInqRq&gt;\n      &lt;PersDriver&gt;\n        &lt;GeneralPartyInfo&gt;\n          &lt;NameInfo&gt;\n            &lt;PersonName&gt;\n              &lt;GivenName&gt;John&lt;/GivenName&gt;\n              &lt;Surname&gt;Smith&lt;/Surname&gt;\n            &lt;/PersonName&gt;\n          &lt;/NameInfo&gt;\n        &lt;/GeneralPartyInfo&gt;\n        &lt;DriverInfo&gt;\n          &lt;BirthDt&gt;1990-05-15&lt;/BirthDt&gt;\n        &lt;/DriverInfo&gt;\n      &lt;/PersDriver&gt;\n    &lt;/PersPkgPolicyQuoteInqRq&gt;\n  &lt;/InsuranceSvcRq&gt;\n&lt;/ACORD&gt;</pre>\n\n<h4>Step 4: Premium calculation (simulator)</h4>\n<p>Since real carrier APIs are not yet connected, the <code>PremiumCalculator</code> generates simulated premiums. Here\'s how the math works:</p>\n<pre>BasePremium = 1000.0  (from config)\n\n// Age factor (younger = more expensive)\nDriver age 20 &rarr; ageFactor = 1.8  (high risk)\nDriver age 35 &rarr; ageFactor = 1.0  (baseline)\nDriver age 65 &rarr; ageFactor = 1.2  (slightly elevated)\n\n// Province factor\nON (Ontario)  &rarr; provinceFactor = 1.3  (highest premiums in Canada)\nAB (Alberta)  &rarr; provinceFactor = 1.1\nBC (B.C.)     &rarr; provinceFactor = 1.15\nSK (Sask.)    &rarr; provinceFactor = 0.85 (public insurance)\n\n// Coverage factor\nliability      &rarr; coverageFactor = 0.7\ncollision      &rarr; coverageFactor = 1.0\ncomprehensive  &rarr; coverageFactor = 1.3\n\n// Final calculation:\npremium = BasePremium x ageFactor x provinceFactor x coverageFactor\n\n// Example: 35-year-old in Ontario with comprehensive\npremium = 1000 x 1.0 x 1.3 x 1.3 = $1,690.00\ntaxes (13% HST in ON) = $219.70\ntotalPayable = $1,909.70</pre>\n\n<h4>Step 5: Publishing the response</h4>\n<p>After calculating the premium, the adapter publishes a response to the <code>sbq-rating-responses</code> Service Bus queue:</p>\n<pre>{\n  "messageType": "CarrierRatingResponse",\n  "jobId": "e5f6g7h8-...",\n  "quoteId": "a1b2c3d4-...",\n  "carrierId": "AVIVA",\n  "status": "Rated",\n  "termPremium": 1690.00,\n  "taxes": 219.70,\n  "totalPayable": 1909.70,\n  "currency": "CAD",\n  "effectiveDate": "2026-04-01",\n  "expiryDate": "2027-04-01"\n}</pre>\n\n<h3>How It Connects to Other Services</h3>\n<div class="connection-example">\n  <strong>Inbound:</strong> Orchestrator &rarr; Service Bus queue <code>sbq-rating-jobs</code> &rarr; Carrier Connector consumes one message per carrier<br>\n  <strong>Outbound (responses):</strong> Carrier Connector &rarr; Service Bus queue <code>sbq-rating-responses</code> &rarr; Orchestrator consumes<br>\n  <strong>External (future):</strong> Carrier Connector &rarr; Aviva REST API, SGI SOAP API, PeaceHills Guidewire API<br>\n  <strong>Storage:</strong> Carrier Connector &rarr; Azure Blob Storage for request/response archival\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Adapter Pattern</strong>: Each carrier gets its own adapter class that implements <code>ICarrierAdapter</code>. The factory selects the right one based on carrierId. Adding a new carrier means writing one new adapter class - no changes to the core pipeline.</li>\n<li><strong>CSIO (Centre for Study of Insurance Operations)</strong>: The Canadian insurance industry standard for data exchange. CSIO XML defines the schema for policy, driver, vehicle, and coverage data. The Carrier Connector would translate CDM to CSIO XML for carriers that accept it.</li>\n<li><strong>Resilience Policies</strong>: Each carrier adapter has individually configurable retry (with exponential backoff and jitter), timeout (per-request and total), and circuit breaker policies. If Aviva\'s API goes down, the circuit breaks after 5 failures and stops trying for 30 seconds.</li>\n<li><strong>Simulation Mode</strong>: The current PremiumCalculator is a placeholder. Real carrier integration requires actual API credentials, CSIO XML mapping, and response parsing. The simulator provides realistic-looking data for UI development.</li>\n</ul>',
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
      educate: '<h3>What This Service Does</h3>\n<p>The SchemaCache is the "dictionary" of the rating platform. It stores the definitions of what data each insurance carrier needs, how forms should be rendered, and what validation rules apply. When a broker opens a quoting form in the RPM Client, the form fields, sections, steps, dropdowns, and validation rules all come from schemas stored in this service.</p>\n\n<p>Think of it like a recipe book: each "bundle" is a recipe that says "to quote personal auto with Aviva, you need these 47 fields, organized in these 5 sections, with these dropdown options for province, and these validation rules for driver age."</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>The Bundle Structure</h4>\n<p>A bundle is the core data unit. It\'s a JSON document stored in MongoDB that contains everything needed to render a quoting form and submit data to a carrier:</p>\n<pre>{\n  "_id": "intact.PersAuto.quote.csio-1.49@3.0.0",\n  "carrierId": "INTACT",\n  "productCode": "PersAuto",\n  "intent": "quote",\n  "standard": "CSIO",\n  "standardVersion": "1.49",\n  "bundleVersion": "3.0.0",\n  "status": "active",\n  "manifest": {\n    "schemaFields": [ ... ],\n    "formConfig": { ... },\n    "rulesEngine": { ... },\n    "i18n": { ... },\n    "codeLists": { ... }\n  }\n}</pre>\n\n<h4>Schema Fields</h4>\n<p>The <code>schemaFields</code> array defines every data field the carrier needs. Each field has a CDM path, data type, validation rules, and UI hints:</p>\n<pre>"schemaFields": [\n  {\n    "cdmPath": "drivers[0].firstName",\n    "label": { "en-CA": "First Name", "fr-CA": "Pr\\u00e9nom" },\n    "type": "string",\n    "required": true,\n    "maxLength": 50,\n    "section": "driver-info",\n    "order": 1\n  },\n  {\n    "cdmPath": "drivers[0].dateOfBirth",\n    "label": { "en-CA": "Date of Birth" },\n    "type": "date",\n    "required": true,\n    "validation": { "minAge": 16, "maxAge": 99 },\n    "section": "driver-info",\n    "order": 3\n  },\n  {\n    "cdmPath": "vehicle[0].province",\n    "label": { "en-CA": "Province" },\n    "type": "codeList",\n    "codeListRef": "CA-provinces",\n    "required": true,\n    "section": "vehicle-info",\n    "order": 1\n  }\n]</pre>\n\n<h4>Form Configuration</h4>\n<p>The <code>formConfig</code> defines how fields are grouped into sections and steps for the multi-step quoting wizard:</p>\n<pre>"formConfig": {\n  "steps": [\n    {\n      "id": "step-1",\n      "title": { "en-CA": "Driver Information" },\n      "sections": [\n        {\n          "id": "driver-info",\n          "title": { "en-CA": "Primary Driver" },\n          "fields": ["drivers[0].firstName", "drivers[0].lastName", "drivers[0].dateOfBirth"]\n        }\n      ]\n    },\n    {\n      "id": "step-2",\n      "title": { "en-CA": "Vehicle Details" },\n      "sections": [\n        {\n          "id": "vehicle-info",\n          "fields": ["vehicle[0].year", "vehicle[0].make", "vehicle[0].model"]\n        }\n      ]\n    }\n  ]\n}</pre>\n\n<h4>Code Lists</h4>\n<p>The <code>codeLists</code> section defines dropdown options (provinces, vehicle makes, coverage types, etc.):</p>\n<pre>"codeLists": {\n  "CA-provinces": [\n    { "code": "ON", "label": { "en-CA": "Ontario", "fr-CA": "Ontario" } },\n    { "code": "QC", "label": { "en-CA": "Quebec", "fr-CA": "Qu\\u00e9bec" } },\n    { "code": "AB", "label": { "en-CA": "Alberta" } }\n  ]\n}</pre>\n\n<h4>API Endpoints</h4>\n<ul>\n<li><code>GET /api/v1/schemas/{bundleId}</code> - Retrieve a bundle by ID</li>\n<li><code>PUT /api/v1/schemas/{bundleId}</code> - Upsert a bundle (returns 409 if duplicate)</li>\n<li><code>POST /api/v1/schemas/{bundleId}/activate</code> - Mark a bundle version as active</li>\n<li><code>GET /api/v1/schemas/active?carrierId=INTACT&amp;productCode=PersAuto</code> - Get the active bundle for a carrier/product</li>\n</ul>\n\n<h4>Service Bus Sync</h4>\n<p>The SchemaCache also listens on a Service Bus topic for schema update events. When a schema is published or updated in the central schema management system, a message triggers the SchemaCache to pull the latest version. This keeps the cache in sync without polling.</p>\n\n<h3>How It Connects to Other Services</h3>\n<div class="connection-example">\n  <strong>Consumers (intended):</strong> Quote Management would call SchemaCache to resolve bundle IDs and get schema definitions. Currently using mock data instead.<br>\n  <strong>Consumers (actual):</strong> The BFF connects to a separate "CentralSchema" service, not SchemaCache directly. The RPM Client\'s SchemaCacheManager may talk through the BFF.<br>\n  <strong>Inbound sync:</strong> Service Bus topic subscription delivers schema update notifications.<br>\n  <strong>Storage:</strong> MongoDB stores all bundle documents.\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Bundle</strong>: A self-contained package of everything needed for a specific carrier + product + intent combination. The bundle ID format is: <code>{carrier}.{product}.{intent}.{standard}-{version}@{bundleVersion}</code>.</li>\n<li><strong>Schema-Driven UI</strong>: Instead of hardcoding form fields in the Blazor UI, the RPM Client reads the schema from SchemaCache and dynamically renders form controls. This means adding a new carrier or field only requires updating the schema - no code changes.</li>\n<li><strong>Shard Key</strong>: MongoDB shard key support was added to enable horizontal scaling. The shard key is likely based on carrierId, distributing bundles across shards by carrier.</li>\n<li><strong>Active Version</strong>: Multiple versions of a bundle can exist, but only one is "active" at a time. The activate endpoint handles version promotion, ensuring brokers always see the latest approved form layout.</li>\n</ul>',
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
      educate: '<h3>What This Service Does</h3>\n<p>RPM Client is the web application that insurance brokers interact with every day. It\'s built with Blazor Server, which means the UI runs on the server and communicates with the browser via a persistent SignalR (WebSocket) connection. When a broker clicks a button, the click event travels over WebSocket to the server, the server updates the component state, and a DOM diff is sent back to the browser.</p>\n\n<p>The application covers the full insurance brokerage workflow: managing a book of business, handling renewals and claims, creating opportunities, generating quotes from multiple carriers, and managing policy documents.</p>\n\n<h3>How It Works Under The Hood</h3>\n<h4>Step 1: A broker opens the quoting page</h4>\n<p>When a broker navigates to the quoting section, the Blazor component calls the <code>SchemaCacheManager</code> to fetch the appropriate schema for the selected carrier and product type. The schema defines what form fields to render, in what order, with what validation rules.</p>\n\n<h4>Step 2: Schema-driven form rendering</h4>\n<p>The <code>DynamicUIServices</code> layer takes the schema and renders Syncfusion UI components dynamically:</p>\n<pre>// Simplified flow:\n// 1. SchemaCacheManager fetches schema from BFF &rarr; CentralSchema\nvar schema = await _schemaCacheManager.GetActiveSchema("INTACT", "PersAuto");\n\n// 2. Schema defines form structure:\n// schema.formConfig.steps[0].sections[0].fields = [\n//   "drivers[0].firstName",  &rarr; renders SfTextBox\n//   "drivers[0].dateOfBirth", &rarr; renders SfDatePicker\n//   "vehicle[0].province",   &rarr; renders SfDropDownList (from codeLists)\n// ]\n\n// 3. DynamicFormRenderer iterates and creates components:\nforeach (var field in section.Fields) {\n    var fieldDef = schema.GetFieldDefinition(field);\n    switch (fieldDef.Type) {\n        case "string":   &rarr; &lt;SfTextBox @bind-Value="cdmData[field]" /&gt;\n        case "date":     &rarr; &lt;SfDatePicker @bind-Value="cdmData[field]" /&gt;\n        case "codeList": &rarr; &lt;SfDropDownList DataSource="codeLists[fieldDef.CodeListRef]" /&gt;\n        case "number":   &rarr; &lt;SfNumericTextBox @bind-Value="cdmData[field]" /&gt;\n    }\n}</pre>\n\n<h4>Step 3: Form data becomes CDM data</h4>\n<p>As the broker fills in the form, each field value is stored in a CDM (Common Data Model) dictionary. The keys are the dot-notation paths from the schema:</p>\n<pre>// What the broker sees: a nice form with labeled fields\n// What the code stores:\ncdmData = {\n  "drivers[0].firstName": { kind: "string", raw: "John" },\n  "drivers[0].lastName": { kind: "string", raw: "Smith" },\n  "drivers[0].dateOfBirth": { kind: "date", raw: "1990-05-15" },\n  "vehicle[0].year": { kind: "number", raw: "2024", numberValue: 2024 },\n  "vehicle[0].make": { kind: "string", raw: "Toyota" },\n  "vehicle[0].province": { kind: "string", raw: "ON" }\n}</pre>\n\n<h4>Step 4: Submitting the quote</h4>\n<p>When the broker clicks "Get Quotes", the CDM data dictionary plus the selected carriers are sent to the BFF, which proxies to Quote Management. The UI then polls for rating responses and displays carrier offers as they arrive.</p>\n\n<h4>The CSIO Mapping Issue</h4>\n<p>There\'s a known issue with CSIO (Centre for Study of Insurance Operations) XML mapping. The code that would translate CDM data to CSIO XML format is commented out in several places. This is a blocking issue for real carrier integration, as most Canadian carriers expect data in CSIO XML format. The lead architect for CSIO mapping (Bhavesh Patel) is currently on leave.</p>\n\n<h3>How It Connects to Other Services</h3>\n<div class="connection-example">\n  <strong>Outbound (all via BFF):</strong> RPM Client &rarr; BFF &rarr; 15+ backend services. The client NEVER calls backend services directly.<br>\n  <strong>Authentication:</strong> RPM Client &rarr; Azure AD (MSAL) for broker login<br>\n  <strong>Schema:</strong> RPM Client &rarr; BFF &rarr; CentralSchema for form definitions<br>\n  <strong>Quotes:</strong> RPM Client &rarr; BFF &rarr; Quote Management for CRUD + rating<br>\n  <strong>Real-time:</strong> SignalR WebSocket connection for server-side Blazor rendering\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>Blazor Server</strong>: Unlike Blazor WebAssembly (which runs in the browser), Blazor Server runs all C# code on the server. The browser only receives DOM diffs over WebSocket. This means: faster initial load, access to server resources, but requires persistent connection and scales with connected users.</li>\n<li><strong>Syncfusion</strong>: The commercial UI component library used for rich form controls (grids, dropdowns, date pickers, file uploads). Licensed per developer seat.</li>\n<li><strong>Schema-Driven Forms</strong>: Forms are not hardcoded in .razor files. Instead, the <code>DynamicFormRenderer</code> reads schema definitions at runtime and generates form controls dynamically. This means adding a new carrier\'s quoting form requires only a schema change - no code deployment.</li>\n<li><strong>Multi-tenant</strong>: The application supports multiple brokerage "realms" (tenants). RealmId is passed in headers and used to scope data access. Each brokerage sees only their own opportunities, quotes, and policies.</li>\n<li><strong>Localization</strong>: Supports en-CA (Canadian English), en-US, and fr-CA (Canadian French). Labels, validation messages, and code list descriptions are all localized.</li>\n</ul>',
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
      educate: '<h3>What This Service Does</h3>\n<p>The BFF (Backend for Frontend) is the API gateway that sits between the Blazor frontend and all backend microservices. The RPM Client never calls backend services directly - every API call goes through the BFF. This pattern exists for several reasons:</p>\n<ol>\n<li><strong>Security</strong>: The BFF adds authentication tokens and APIM subscription keys that the browser should never see</li>\n<li><strong>Aggregation</strong>: Some UI pages need data from 3-4 services - the BFF combines them into one response</li>\n<li><strong>Translation</strong>: Backend APIs may return more data than the UI needs, or in a different shape</li>\n<li><strong>Resilience</strong>: The BFF can add retry policies, circuit breakers, and fallbacks (though these are currently commented out for QuoteService)</li>\n</ol>\n\n<h3>How It Works Under The Hood</h3>\n<h4>Step 1: A request arrives from the browser</h4>\n<p>The RPM Client (Blazor Server) makes an HTTP call to the BFF. Since Blazor Server runs on the same server, this is typically a localhost call. The request includes the broker\'s Azure AD bearer token in the Authorization header.</p>\n\n<h4>Step 2: The BFF controller handles it</h4>\n<p>The BFF has approximately 20 controllers covering different domains:</p>\n<pre>Controllers/\n  JournalTaskController.cs      &rarr; Journal task CRUD\n  RenewalController.cs          &rarr; Renewal management\n  ClaimController.cs            &rarr; Claims management\n  BookOfBusinessController.cs   &rarr; Book of business queries\n  OpportunityController.cs      &rarr; Opportunity management\n  ReferralController.cs         &rarr; Referral management\n  ConfigurationController.cs    &rarr; App configuration\n  UserManagementController.cs   &rarr; User/role management\n  SearchController.cs           &rarr; Cross-entity search\n  InsightsController.cs         &rarr; Analytics/reporting\n  PolicyApplicationController.cs &rarr; Policy CRUD\n  DocumentGenController.cs      &rarr; Document generation\n  QuoteController.cs            &rarr; Quote management proxy\n  CentralSchemaController.cs    &rarr; Schema/bundle access\n  CarrierCredentialController.cs &rarr; Carrier API credentials\n  CustomerRecordController.cs   &rarr; Customer data\n  ActivityLogController.cs      &rarr; Audit trail\n  ConnectionController.cs       &rarr; External connections\n  StoreController.cs            &rarr; Data store access\n  AppsController.cs             &rarr; App registry</pre>\n\n<h4>Step 3: Proxy to downstream service</h4>\n<p>Each controller delegates to a service class that makes HTTP calls to the actual backend. For quote management, the flow is:</p>\n<pre>// QuoteController.cs\n[HttpPost("quotes")]\npublic async Task&lt;IActionResult&gt; CreateQuote([FromBody] CreateQuoteRequest request) {\n    // BFF adds the APIM subscription key (from Key Vault)\n    var result = await _quoteService.CreateQuoteAsync(request);\n    return Ok(result);\n}\n\n// QuoteService.cs\npublic async Task&lt;QuoteResponse&gt; CreateQuoteAsync(CreateQuoteRequest request) {\n    // HttpClient has BaseAddress = QuoteManagementApiUrl from config\n    // APIM key is added via a DelegatingHandler:\n    // request.Headers.Add("Ocp-Apim-Subscription-Key", _apimKey);\n    var response = await _httpClient.PostAsJsonAsync("/api/v1/quotes", request);\n    return await response.Content.ReadFromJsonAsync&lt;QuoteResponse&gt;();\n}</pre>\n\n<h4>Step 4: Orchestration (for complex operations)</h4>\n<p>Some operations require coordinating across multiple services. The BFF has dedicated orchestrators for these:</p>\n<ul>\n<li><strong>OpportunityRequestOrchestrator</strong>: When creating an opportunity, it calls the Opportunity service, then the Customer Record service, then the Quote Management service to link them together.</li>\n<li><strong>PolicyApplicationOrchestrator</strong>: When binding a policy, it coordinates between the Quote Management service (to get the accepted offer), the Policy Application service (to create the policy), and the Document Generation service (to produce policy documents).</li>\n</ul>\n\n<h4>APIM Key Retrieval</h4>\n<p>The APIM subscription key for Quote Management is stored in Azure Key Vault. The BFF retrieves it at startup and passes it as a header on every request to Quote Management. This is configured via:</p>\n<pre>// Program.cs\nvar apimKey = await keyVaultClient.GetSecretAsync("apim-subscription-key-quote-mgmt");\nbuilder.Services.AddHttpClient&lt;IQuoteService, QuoteService&gt;(client =&gt; {\n    client.BaseAddress = new Uri(quoteManagementApiUrl);\n    client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", apimKey.Value);\n});</pre>\n\n<h3>How It Connects to Other Services</h3>\n<div class="connection-example">\n  <strong>Inbound:</strong> RPM Client (Blazor Server) &rarr; BFF (same server, localhost calls)<br>\n  <strong>Outbound (15+ services):</strong> BFF &rarr; Journal APIs, Configuration API, Search API, Insights API, Policy Application API, Document Gen API, Quote Management API (via APIM), CentralSchema API, Carrier Credentials API, and more<br>\n  <strong>Secrets:</strong> BFF &rarr; Azure Key Vault for APIM subscription keys and other secrets\n</div>\n\n<h3>Key Concepts</h3>\n<ul>\n<li><strong>BFF Pattern</strong>: Backend-for-Frontend. Instead of the browser calling 15 different APIs with different auth schemes, it calls one BFF that handles authentication, aggregation, and routing. This simplifies the frontend and centralizes cross-cutting concerns.</li>\n<li><strong>APIM (Azure API Management)</strong>: The cloud API gateway that sits in front of backend services. The BFF uses an APIM subscription key to authenticate requests to Quote Management. Other services may use different APIM products/subscriptions.</li>\n<li><strong>DelegatingHandler</strong>: An ASP.NET pattern for adding behavior to HTTP clients. The BFF uses delegating handlers to add APIM keys, propagate correlation IDs, and log outbound requests.</li>\n<li><strong>Service Registration</strong>: Each downstream service gets its own typed HttpClient registration in Program.cs with its own base URL, timeout, and (ideally) resilience policies. This allows per-service configuration and monitoring.</li>\n</ul>',
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
