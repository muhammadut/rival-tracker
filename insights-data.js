window.INSIGHTS_DATA = {
  generatedAt: "2026-03-27T10:00:00Z",
  generatedBy: "Claude Code 7-Lens Architecture Review",

  meta: {
    generatedAt: new Date().toISOString(),
    generatedBy: "Claude Code 7-Lens Architecture Review",
    reviewType: "full",
    totalFindings: 77,
    critical: 13,
    warning: 52,
    info: 12,
    executiveSummary: "The Rating Platform has 4 of 6 backend services with functional code, but NONE can be deployed due to critical infrastructure misalignments. The most urgent issue: QuoteManagement sends messages to a completely different Service Bus namespace than the Orchestrator, meaning the core rating pipeline is fundamentally broken. Additionally, production Azure credentials are committed to source control in two repos and must be rotated immediately. No production infrastructure exists (only dev/qa in Terraform), and the Manufactured Rating service has zero application code. The BFF has a thread-safety bug that will cause intermittent auth failures under concurrent load."
  },

  services: {
    "quote_mgmt": [
      {
        id: "ins_qm_001",
        severity: "critical",
        category: "code_quality",
        title: "BuildServiceProvider() creates second DI container",
        description: "Program.cs:136 calls builder.Services.BuildServiceProvider() inside a health check lambda. This creates a duplicate DI container, which means singletons are instantiated twice - one in the real container and one in this throwaway container. This can cause subtle bugs with stateful singletons (e.g., two separate caches, two separate connection pools).",
        evidence: "File: Program.cs, Line 136 - builder.Services.BuildServiceProvider() called during health check registration.",
        example: "// Program.cs Line 136\nvar sp = builder.Services.BuildServiceProvider();  // ANTI-PATTERN: second container\nvar mongoSettings = sp.GetRequiredService<IOptions<MongoDBDatabaseOptions>>();\n\n// This creates a SECOND instance of every singleton registered so far\n// The health check's MongoClient is different from the app's MongoClient",
        recommendation: "Replace with a typed IHealthCheck class that receives dependencies via constructor injection. Remove the BuildServiceProvider() call entirely.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_002",
        severity: "critical",
        category: "integration",
        title: "RatingSubmissionService depends on IOptions<ServiceBusSettings> which is never registered in DI",
        description: "RatingSubmissionService constructor injects IOptions<ServiceBusSettings> but Program.cs only registers AzServiceBusOptions via Configure<AzServiceBusOptions>(). The type names don't match, causing a runtime DI resolution failure when trying to rate a quote.",
        evidence: "Services/RatingSubmissionService.cs injects IOptions<ServiceBusSettings>. Program.cs registers Configure<AzServiceBusOptions>. Type mismatch = runtime DI failure.",
        example: "// Services/RatingSubmissionService.cs\npublic RatingSubmissionService(IOptions<ServiceBusSettings> settings) {  // expects ServiceBusSettings\n    _settings = settings.Value;\n}\n\n// Program.cs\nbuilder.Services.Configure<AzServiceBusOptions>(  // registers AzServiceBusOptions\n    builder.Configuration.GetSection(\"AzServiceBus\")\n);\n\n// At runtime: No service for type 'IOptions<ServiceBusSettings>' has been registered",
        recommendation: "Add builder.Services.Configure<ServiceBusSettings>(config.GetSection(\"AzServiceBus\")) to Program.cs, or rename AzServiceBusOptions to ServiceBusSettings.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_003",
        severity: "critical",
        category: "integration",
        title: "Service Bus namespace mismatch - messages go to wrong bus",
        description: "QuoteManagement publishes to Service Bus namespace 'sbns-rating-dev-001' but the Orchestrator listens on 'sbns-ratingplatform-dev-001'. These are two completely different Azure Service Bus instances. Messages published by QuoteManagement are never received by the Orchestrator.",
        evidence: "QuoteManagement appsettings.json: Namespace 'sbns-rating-dev-001'. Orchestrator appsettings.json: FullyQualifiedNamespace 'sbns-ratingplatform-dev-001'.",
        example: "// QuoteManagement appsettings.json\n\"ServiceBus\": { \"Namespace\": \"sbns-rating-dev-001\" }\n\n// Orchestrator appsettings.json\n\"ServiceBus\": { \"FullyQualifiedNamespace\": \"sbns-ratingplatform-dev-001\" }\n\n// Different namespace = messages sent into the void",
        recommendation: "Align QuoteManagement to use 'sbns-ratingplatform-dev-001' to match the Orchestrator's namespace.",
        affectedComponents: ["quote_mgmt", "orchestrator"]
      },
      {
        id: "ins_qm_004",
        severity: "critical",
        category: "integration",
        title: "Service Bus queue name mismatch",
        description: "QuoteManagement publishes to queue 'sbq-rating-requests-dev' but the Orchestrator consumes from queue 'sbq-initial-rating-requests'. Even if the namespace were correct, messages would land in a queue nobody reads.",
        evidence: "QuoteManagement appsettings.json: RequestQueue 'sbq-rating-requests-dev'. Orchestrator appsettings.json: InputQueue 'sbq-initial-rating-requests'.",
        example: "// QuoteManagement\n\"RequestQueue\": \"sbq-rating-requests-dev\"\n\n// Orchestrator\n\"InputQueue\": \"sbq-initial-rating-requests\"\n\n// Different queue name = messages pile up unread",
        recommendation: "Change QuoteManagement's RequestQueue to 'sbq-initial-rating-requests' to match the Orchestrator's input queue.",
        affectedComponents: ["quote_mgmt", "orchestrator"]
      },
      {
        id: "ins_qm_005",
        severity: "critical",
        category: "security",
        title: "Production credentials committed to source control",
        description: "docs/specs/azure-resources.json contains real Cosmos DB keys, Service Bus SAS keys, and Storage Account keys. These credentials are checked into the repository and visible to anyone with repo access.",
        evidence: "File: docs/specs/azure-resources.json - Contains Cosmos DB primary keys, Service Bus SAS connection strings, and Storage Account access keys.",
        example: "// docs/specs/azure-resources.json\n// Contains actual Azure credentials:\n// - Cosmos DB AccountKey\n// - Service Bus SAS Policy keys\n// - Storage Account access keys\n// These must be rotated IMMEDIATELY",
        recommendation: "1. Rotate ALL exposed credentials immediately. 2. Remove the file from the repo and add it to .gitignore. 3. Use Azure Key Vault references instead.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_006",
        severity: "warning",
        category: "security",
        title: "No authentication middleware - UseAuthorization without UseAuthentication",
        description: "Program.cs calls app.UseAuthorization() but never calls app.UseAuthentication() or builder.Services.AddAuthentication(). Any [Authorize] attributes are ineffective - the ClaimsPrincipal is always anonymous.",
        evidence: "File: Program.cs - app.UseAuthorization() present but no AddAuthentication() or UseAuthentication() call anywhere.",
        example: "// Program.cs\napp.UseRouting();\n// app.UseAuthentication();  <-- MISSING\napp.UseAuthorization();  // <-- present but useless without the line above",
        recommendation: "Add proper authentication middleware. If relying solely on APIM key validation, document this explicitly and ensure all endpoints are protected.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_007",
        severity: "warning",
        category: "security",
        title: "API key check only validates non-empty - any string passes",
        description: "The Ocp-Apim-Subscription-Key header check only verifies the header is present and non-empty. Any arbitrary string value is accepted as valid, providing no actual authentication.",
        evidence: "APIM key validation logic checks string.IsNullOrEmpty() only - no comparison against expected value.",
        example: "// Any of these would pass:\n// Ocp-Apim-Subscription-Key: literally-anything\n// Ocp-Apim-Subscription-Key: test\n// Ocp-Apim-Subscription-Key: 12345",
        recommendation: "Validate the subscription key against a known value from configuration or Azure Key Vault, or rely on APIM gateway to validate keys upstream.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_008",
        severity: "warning",
        category: "code_quality",
        title: "WeatherForecast.cs template leftover still present",
        description: "The default ASP.NET project template WeatherForecast.cs file was never removed during project setup.",
        evidence: "File: WeatherForecast.cs still present in the project.",
        example: "// WeatherForecast.cs - default template file\n// Has nothing to do with insurance quotes",
        recommendation: "Delete WeatherForecast.cs and any associated controller.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_009",
        severity: "warning",
        category: "code_quality",
        title: "DateTime.Now vs DateTime.UtcNow inconsistency across timestamps",
        description: "The codebase mixes DateTime.Now (local server time) and DateTime.UtcNow. Event timestamps, audit logs, and status updates use inconsistent time references, causing ordering issues between local dev and Azure (UTC) environments.",
        evidence: "Mixed usage of DateTime.Now and DateTime.UtcNow in QuoteService.cs, RatingResponseHandlerService.cs, and QuoteDocument.cs.",
        example: "// Services/QuoteService.cs Line 230\nevent.Timestamp = DateTime.Now;  // local time\n\n// Services/RatingResponseHandlerService.cs Line 45\nresponse.ReceivedAt = DateTime.UtcNow;  // UTC time",
        recommendation: "Standardize on DateTime.UtcNow everywhere. Consider using DateTimeOffset for timezone-aware timestamps.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_010",
        severity: "warning",
        category: "security",
        title: "Multiple TODO markers for auth context - user identity never resolved, uses random GUIDs",
        description: "Multiple locations in QuoteService generate a random GUID for systemUserId instead of extracting it from the authentication context. The UserName is hardcoded to 'system'. Audit trails are meaningless.",
        evidence: "File: Services/QuoteService.cs, Lines 224, 257, 360, 380, 429, 449 - 'var systemUserId = Guid.NewGuid().ToString(); // TODO: Get from auth context'",
        example: "// Services/QuoteService.cs (6 locations)\nvar systemUserId = Guid.NewGuid().ToString(); // TODO: Get from auth context\nUserName = \"system\" // TODO: Get from auth context\n\n// Every quote event has a different random userId - untraceable",
        recommendation: "Inject the authenticated user context (e.g., via IHttpContextAccessor) and use actual user identity for audit trails.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_011",
        severity: "warning",
        category: "code_quality",
        title: "DeleteQuoteAsync is a stub that always returns failure",
        description: "The QuoteService.DeleteQuoteAsync method fetches the quote but then returns ServiceResult.Failure('Delete functionality not available'). The endpoint exists but always fails.",
        evidence: "File: Services/QuoteService.cs, Lines 305-307 - TODO comment followed by return ServiceResult.Failure.",
        example: "// Services/QuoteService.cs\npublic async Task<ServiceResult> DeleteQuoteAsync(string id) {\n    var quote = await _repository.GetByIdAsync(id);\n    // TODO: Implement delete functionality\n    return ServiceResult.Failure(\"Delete functionality not available\");\n}",
        recommendation: "Either implement delete functionality or remove the endpoint. Return 501 Not Implemented instead of a generic failure.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_012",
        severity: "warning",
        category: "deployment",
        title: "SchemaServiceSettings uses placeholder URL with UseMockData=true",
        description: "SchemaServiceSettings.BaseUrl is set to a placeholder URL and UseMockData is hardcoded to true. The service never connects to the real SchemaCache API.",
        evidence: "File: appsettings.json - BaseUrl: 'https://schema-service-placeholder.azurewebsites.net', UseMockData: true.",
        example: "// appsettings.json\n\"SchemaServiceSettings\": {\n  \"BaseUrl\": \"https://schema-service-placeholder.azurewebsites.net\",\n  \"UseMockData\": true\n}",
        recommendation: "Update BaseUrl to point to the actual SchemaCache API and set UseMockData to false.",
        affectedComponents: ["quote_mgmt", "schema_cache"]
      },
      {
        id: "ins_qm_013",
        severity: "warning",
        category: "deployment",
        title: "No environment-specific appsettings files (no dev/qa/prod overrides)",
        description: "The project lacks appsettings.Development.json, appsettings.QA.json, and appsettings.Production.json files, meaning all configuration relies on environment variable injection with no documented defaults per environment.",
        evidence: "No environment-specific appsettings files found in the project directory.",
        example: "// Missing files:\n// appsettings.Development.json\n// appsettings.QA.json\n// appsettings.Production.json",
        recommendation: "Create environment-specific appsettings files with appropriate defaults for each environment.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_014",
        severity: "warning",
        category: "integration",
        title: "Duplicate/conflicting Service Bus config (3 sections with same queue names)",
        description: "The appsettings.json has three separate configuration sections for Service Bus with overlapping and conflicting queue name definitions.",
        evidence: "File: appsettings.json - Multiple ServiceBus-related configuration sections with different queue name values.",
        example: "// appsettings.json has 3 Service Bus sections:\n// \"ServiceBus\": { ... }\n// \"AzServiceBus\": { ... }\n// \"ServiceBusSettings\": { ... }\n// Queue names differ between sections",
        recommendation: "Consolidate into a single Service Bus configuration section and remove duplicates.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_015",
        severity: "warning",
        category: "integration",
        title: "Response queue name mismatch (sbq-rating-responses-dev vs sbq-rating-responses)",
        description: "QuoteManagement listens on 'sbq-rating-responses-dev' but the Orchestrator publishes responses to 'sbq-rating-responses'. Even if namespace is fixed, responses will never arrive.",
        evidence: "QuoteManagement config: 'sbq-rating-responses-dev'. Orchestrator config: 'sbq-rating-responses'.",
        example: "// QuoteManagement\n\"ResponseQueue\": \"sbq-rating-responses-dev\"\n\n// Orchestrator\n\"OutputQueue\": \"sbq-rating-responses\"\n\n// Mismatch: responses never delivered back",
        recommendation: "Align the response queue name across both services.",
        affectedComponents: ["quote_mgmt", "orchestrator"]
      },
      {
        id: "ins_qm_016",
        severity: "warning",
        category: "code_quality",
        title: "RatingResponseReader abandons malformed messages instead of dead-lettering - infinite retry loop",
        description: "When the RatingResponseReader encounters a malformed message it cannot deserialize, it abandons the message. Abandoned messages are re-delivered up to maxDeliveryCount times, then auto dead-lettered - but this causes N retries of known-bad messages.",
        evidence: "RatingResponseReader abandons messages on deserialization failure instead of explicitly dead-lettering them.",
        example: "// RatingResponseReader.cs\ncatch (JsonException ex) {\n    _logger.LogError(ex, \"Failed to deserialize message\");\n    await receiver.AbandonMessageAsync(message);  // will be retried N times\n    // Should be: await receiver.DeadLetterMessageAsync(message, \"InvalidFormat\");\n}",
        recommendation: "Replace AbandonMessageAsync with DeadLetterMessageAsync for messages that will never succeed on retry.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_017",
        severity: "warning",
        category: "performance",
        title: "No MongoDB index on OpportunityId field - collection scans",
        description: "The quote collection is frequently queried by OpportunityId but no MongoDB index exists for this field. Every lookup performs a full collection scan that degrades linearly with collection size.",
        evidence: "Repository queries by OpportunityId field but no index is created anywhere in the codebase.",
        example: "// Repository/QuoteRepository.cs\npublic async Task<QuoteDocument?> GetByOpportunityIdAsync(string opportunityId) {\n    return await _collection\n        .Find(q => q.OpportunityId == opportunityId)  // no index = collection scan\n        .FirstOrDefaultAsync();\n}",
        recommendation: "Add a MongoDB index on OpportunityId: collection.Indexes.CreateOne(new CreateIndexModel<QuoteDocument>(Builders<QuoteDocument>.IndexKeys.Ascending(q => q.OpportunityId)));",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_018",
        severity: "warning",
        category: "code_quality",
        title: "Health check uses BuildServiceProvider() anti-pattern",
        description: "The health check registration calls BuildServiceProvider() to resolve dependencies, creating a second DI container. This is a well-known anti-pattern that can cause singleton duplication.",
        evidence: "File: Program.cs Line 136 - BuildServiceProvider() in health check lambda.",
        example: "// Program.cs\nvar sp = builder.Services.BuildServiceProvider();  // anti-pattern\nvar mongoSettings = sp.GetRequiredService<IOptions<MongoDBDatabaseOptions>>();",
        recommendation: "Use a typed IHealthCheck class with constructor injection instead.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_019",
        severity: "info",
        category: "code_quality",
        title: "Copy-paste error: UpdateQuoteAsync logs 'CreateQuoteAsync' in error message",
        description: "The UpdateQuoteAsync method logs 'Error in CreateQuoteAsync' when an exception occurs, indicating a copy-paste error from CreateQuoteAsync.",
        evidence: "UpdateQuoteAsync error handler references CreateQuoteAsync in the log message.",
        example: "// Services/QuoteService.cs - UpdateQuoteAsync\ncatch (Exception ex) {\n    _logger.LogError(ex, \"Error in CreateQuoteAsync\");  // should be UpdateQuoteAsync\n}",
        recommendation: "Fix the log message to reference UpdateQuoteAsync.",
        affectedComponents: ["quote_mgmt"]
      },
      {
        id: "ins_qm_020",
        severity: "info",
        category: "code_quality",
        title: "Redundant null check on CdmData - second check unreachable",
        description: "CdmData is null-checked twice in sequence. The second null check is unreachable because the first already handles the null case.",
        evidence: "Duplicate null check on CdmData in service logic.",
        example: "// if (request.CdmData == null) return Failure(...);\n// ...\n// if (request.CdmData == null) return Failure(...);  // unreachable",
        recommendation: "Remove the redundant second null check.",
        affectedComponents: ["quote_mgmt"]
      }
    ],

    "orchestrator": [
      {
        id: "ins_orch_001",
        severity: "critical",
        category: "code_quality",
        title: "Single carrier routing failure aborts entire rating job - no partial success",
        description: "If publishing to carrier #2 fails during fan-out, the entire rating job is aborted. However, carrier #1's message was already published successfully. On retry of the full job, carrier #1 receives a duplicate message, potentially producing duplicate quotes.",
        evidence: "MessageProcessor fan-out loop does not track which carriers have been published. Failure on any carrier aborts the loop without compensating for already-published messages.",
        example: "// Fan-out logic:\nforeach (var carrier in carrierTargets) {\n    await publisher.PublishAsync(carrierMessage);  // carrier 1: succeeds\n    // carrier 2: FAILS - entire job aborted\n    // On retry: carrier 1 gets message AGAIN\n}",
        recommendation: "Track published carriers per job. On retry, skip already-published carriers. Consider idempotency keys on carrier messages.",
        affectedComponents: ["orchestrator", "carrier_connector"]
      },
      {
        id: "ins_orch_002",
        severity: "critical",
        category: "security",
        title: "Hardcoded credentials in docs/scripts/dev-config-1101.json",
        description: "docs/scripts/dev-config-1101.json contains real Service Bus SAS keys and Storage Account access keys committed to source control.",
        evidence: "File: docs/scripts/dev-config-1101.json - Contains Service Bus SAS connection strings and Storage Account keys.",
        example: "// docs/scripts/dev-config-1101.json\n// Contains actual Azure credentials:\n// - Service Bus SharedAccessKey values\n// - Storage Account access keys\n// Must be rotated immediately",
        recommendation: "1. Rotate ALL exposed credentials immediately. 2. Remove the file from the repo and add to .gitignore. 3. Use Azure Key Vault references.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_003",
        severity: "warning",
        category: "code_quality",
        title: "Dead-letter logic for validation failures deferred to Phase 2 (TODO)",
        description: "Invalid messages are logged and completed (silently dropped) instead of being dead-lettered. The DeadLetterOnValidationFailure config flag exists but the code to support it is marked TODO. Invalid messages retry 10 times before eventual dead-letter.",
        evidence: "File: Services/MessageProcessor.cs, Line 77 - '// TODO: In Phase 2, implement dead-letter logic here'.",
        example: "// Services/MessageProcessor.cs\ncatch (ValidationException ex) {\n    _logger.LogWarning(\"Message failed validation: {Error}\", ex.Message);\n    // TODO: In Phase 2, implement dead-letter logic here\n    await receiver.CompleteMessageAsync(message);  // silently drops\n}",
        recommendation: "Implement dead-letter queue handling for validation failures to prevent silent message loss.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_004",
        severity: "warning",
        category: "integration",
        title: "No circuit breaker on second Service Bus publishing",
        description: "The fan-out publishing to the carrier jobs queue has no circuit breaker. If the Service Bus is throttling, all publish attempts will fail sequentially, cascading the throttling impact.",
        evidence: "ServiceBusPublisher has no Polly circuit breaker or retry policy configured.",
        example: "// No resilience on publish:\nawait sender.SendMessageAsync(message);  // no circuit breaker\n// If SB is throttling, every carrier publish in the fan-out fails",
        recommendation: "Add a Polly circuit breaker policy to the Service Bus publisher to fail fast when throttling is detected.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_005",
        severity: "warning",
        category: "code_quality",
        title: "maxDeliveryCount hardcoded to 10 instead of reading from config",
        description: "The maximum delivery count for message retry is hardcoded to 10 in the processor instead of being read from configuration, making it inflexible across environments.",
        evidence: "maxDeliveryCount = 10 hardcoded in MessageProcessor.",
        example: "// MessageProcessor.cs\nconst int maxDeliveryCount = 10;  // hardcoded\n// Should read from config: _options.MaxDeliveryCount",
        recommendation: "Move maxDeliveryCount to appsettings.json configuration.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_006",
        severity: "warning",
        category: "code_quality",
        title: "Configurations registered as singletons instead of IOptions pattern",
        description: "Configuration objects are registered as singletons directly instead of using the IOptions<T> pattern. This prevents runtime configuration reloading and doesn't follow ASP.NET best practices.",
        evidence: "Program.cs registers config objects via AddSingleton instead of Configure<T>.",
        example: "// Current:\nservices.AddSingleton(orchConfig);  // static, no reload\n\n// Should be:\nservices.Configure<OrchestratorConfiguration>(config.GetSection(\"Orchestrator\"));",
        recommendation: "Use the IOptions<T> / IOptionsMonitor<T> pattern for configuration to enable runtime reloading.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_007",
        severity: "warning",
        category: "security",
        title: "Raw message bodies logged in error paths - potential PII exposure",
        description: "When message processing fails, the raw message body is logged. Message bodies contain CDM data which includes driver names, dates of birth, addresses, and other PII.",
        evidence: "Error logging includes raw message body content that may contain PII.",
        example: "// MessageProcessor.cs error path\n_logger.LogError(ex, \"Failed to process message: {Body}\", message.Body.ToString());\n// Body contains: drivers[0].firstName, drivers[0].dateOfBirth, etc.",
        recommendation: "Log only message metadata (messageId, jobId, quoteId) in error paths. Never log the full message body.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_008",
        severity: "info",
        category: "code_quality",
        title: "Environment defaults to 'dev' silently when null",
        description: "When the ASPNETCORE_ENVIRONMENT variable is not set, the service silently defaults to 'dev' without logging a warning.",
        evidence: "Environment fallback logic defaults to 'dev' with no warning log.",
        example: "var env = Environment.GetEnvironmentVariable(\"ASPNETCORE_ENVIRONMENT\") ?? \"dev\";",
        recommendation: "Log a warning when defaulting to 'dev' environment so misconfigurations are visible.",
        affectedComponents: ["orchestrator"]
      },
      {
        id: "ins_orch_009",
        severity: "info",
        category: "code_quality",
        title: "Multiple test TODOs for v0.12+ features",
        description: "Several test files have disabled tests waiting for v0.12+ features including metadata storage and telemetry methods.",
        evidence: "Files: StorageServiceTests.cs, MessageProcessorTests.cs - Multiple '// TODO: v0.12+' comments with disabled test assertions.",
        example: "// Tests/UnitTests/Services/StorageServiceTests.cs\n[Fact(Skip = \"TODO: v0.12+ - metadata storage not yet implemented\")]\npublic async Task StoreAsync_ShouldPersistMetadata() { ... }",
        recommendation: "Track these deferred items in the backlog and implement the missing features.",
        affectedComponents: ["orchestrator"]
      }
    ],

    "carrier_connector": [
      {
        id: "ins_cc_001",
        severity: "critical",
        category: "architecture",
        title: "Entire rating engine is a simulator - no real carrier integration active",
        description: "The CarrierConnector uses a PremiumCalculator with hardcoded rates to simulate carrier responses. No real carrier API is actually called. All quotes are fictional numbers generated from a formula.",
        evidence: "PremiumCalculator.cs contains hardcoded base rates, age factors, and province factors. No real HTTP calls to carrier APIs.",
        example: "// PremiumCalculator.cs\nvar premium = BasePremium * ageFactor * provinceFactor * coverageFactor;\n// BasePremium = 1000.0 (hardcoded)\n// All carriers return simulated premiums, not real quotes",
        recommendation: "Document simulator mode clearly. Plan the transition to real carrier API integration with proper feature flags to switch between modes.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_002",
        severity: "warning",
        category: "code_quality",
        title: "Tax rate hardcoded at 5% for all provinces",
        description: "The premium calculator applies a flat 5% tax rate for all provinces. Canadian insurance tax rates vary significantly by province (e.g., Ontario HST 13%, Alberta 0% PST, Quebec QST 9.975%).",
        evidence: "PremiumCalculator uses a constant tax rate of 5% regardless of province.",
        example: "// PremiumCalculator.cs\nvar taxRate = 0.05;  // 5% flat for all provinces\n// Ontario should be 13% HST, Alberta should be 0% PST, etc.",
        recommendation: "Implement province-specific tax rate lookup. Even for the simulator, realistic tax rates improve testing quality.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_003",
        severity: "warning",
        category: "code_quality",
        title: "Carrier multiplier map doesn't match configured carriers",
        description: "The premium calculator has carrier-specific multipliers but PeaceHills and SGI are not in the map, so they always get the default multiplier of 1.0.",
        evidence: "Carrier multiplier dictionary missing entries for PeaceHills and SGI.",
        example: "// PremiumCalculator.cs\nvar carrierMultipliers = new Dictionary<string, double> {\n    { \"AVIVA\", 1.1 },\n    { \"AVIVATRADERS\", 1.05 }\n    // PeaceHills? SGI? -> default 1.0\n};",
        recommendation: "Add multiplier entries for all configured carriers (PeaceHills, SGI) to produce differentiated simulated quotes.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_004",
        severity: "warning",
        category: "code_quality",
        title: "Storage write failure not wrapped in try/catch - unlike orchestrator pattern",
        description: "The blob storage write for archiving carrier responses lacks error handling, unlike the Orchestrator which wraps storage writes in try/catch. A storage failure will crash the entire message processing pipeline.",
        evidence: "Storage write call in carrier response handler has no try/catch, compared to Orchestrator which handles storage errors gracefully.",
        example: "// CarrierConnector: no try/catch\nawait _storageService.StoreAsync(blob);  // failure = message processing crashes\n\n// Orchestrator (correct pattern):\ntry { await _storageService.StoreAsync(blob); }\ncatch (Exception ex) { _logger.LogWarning(\"Storage failed, continuing...\"); }",
        recommendation: "Wrap storage writes in try/catch. Storage failure should not prevent the rating response from being delivered.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_005",
        severity: "warning",
        category: "deployment",
        title: "SGI BaseUrl is placeholder (api.sgi.example.com)",
        description: "The SGI carrier adapter BaseUrl is 'https://api.sgi.example.com' in all environment configs. This placeholder domain will never resolve, causing DNS failures for any SGI rating request.",
        evidence: "Files: appsettings.json, appsettings.dev.json, appsettings.qa.json - SGI.BaseUrl: 'https://api.sgi.example.com'.",
        example: "// All environments:\n\"SGI\": { \"BaseUrl\": \"https://api.sgi.example.com\" }  // placeholder in ALL envs\n// SGI is listed as active carrier - will DNS-fail",
        recommendation: "Either configure the real SGI API URL or remove 'sgi' from active carriers until integration is ready.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_006",
        severity: "warning",
        category: "code_quality",
        title: "IsTransientError uses fragile string matching for timeout",
        description: "The transient error detection logic uses string.Contains to match timeout error messages. This is fragile and locale-dependent - error messages can change between .NET versions.",
        evidence: "IsTransientError method checks exception message with string matching for 'timeout' keyword.",
        example: "// IsTransientError\nif (ex.Message.Contains(\"timeout\", StringComparison.OrdinalIgnoreCase))\n    return true;  // fragile - depends on exception message text",
        recommendation: "Check exception types (TaskCanceledException, TimeoutException) instead of message string matching.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_007",
        severity: "warning",
        category: "performance",
        title: "Console OTLP exporter enabled unconditionally in prod",
        description: "AddConsoleExporter() is called without an environment check, causing telemetry data to be written to stdout in production. This adds I/O overhead and log noise.",
        evidence: "File: Program.cs - .AddConsoleExporter() with no environment guard, unlike Orchestrator which guards behind IsDevelopment().",
        example: "// Program.cs\n.WithTracing(builder => builder.AddConsoleExporter())  // no env check!\n.WithMetrics(builder => builder.AddConsoleExporter())  // no env check!",
        recommendation: "Wrap AddConsoleExporter() in an environment check: if (builder.Environment.IsDevelopment()).",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_008",
        severity: "warning",
        category: "code_quality",
        title: "Health check hardcoded to always return Healthy",
        description: "The health check endpoint always returns Healthy regardless of actual service state. It does not verify Service Bus connectivity, carrier adapter availability, or storage access.",
        evidence: "Health check implementation returns HealthCheckResult.Healthy() unconditionally.",
        example: "// HealthCheck.cs\npublic Task<HealthCheckResult> CheckHealthAsync(...) {\n    return Task.FromResult(HealthCheckResult.Healthy());  // always healthy\n    // Doesn't check: Service Bus, storage, carrier endpoints\n}",
        recommendation: "Add meaningful health checks that verify connectivity to Service Bus, blob storage, and optionally carrier endpoints.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_009",
        severity: "warning",
        category: "deployment",
        title: "Prod appsettings has all carrier URLs/secrets blanked - runtime failure guaranteed without env var injection",
        description: "appsettings.prod.json has empty BaseUrl, TokenUrl, ClientId, ClientSecret for ALL carrier adapters. Without environment variable injection at deploy time, the service will fail.",
        evidence: "File: appsettings.prod.json - All CarrierAdapters entries have empty configuration values.",
        example: "// appsettings.prod.json\n\"PeaceHills\": { \"BaseUrl\": \"\", \"Auth\": { \"ApiKey\": \"\" } },\n\"Aviva\":      { \"BaseUrl\": \"\", \"Auth\": { \"ClientSecret\": \"\" } }",
        recommendation: "Add startup validation that fails fast with descriptive errors if required carrier configs are empty.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_010",
        severity: "info",
        category: "code_quality",
        title: "RateAsync uses Task.FromResult unnecessarily",
        description: "The RateAsync method wraps synchronous computation in Task.FromResult instead of making the method synchronous or using ValueTask.",
        evidence: "RateAsync returns Task.FromResult for synchronous premium calculation.",
        example: "// PremiumCalculator.cs\npublic Task<RatingResult> RateAsync(...) {\n    var result = Calculate(...);\n    return Task.FromResult(result);  // no async work happening\n}",
        recommendation: "Minor issue. Consider using ValueTask or documenting that async is for future real carrier API calls.",
        affectedComponents: ["carrier_connector"]
      },
      {
        id: "ins_cc_011",
        severity: "info",
        category: "code_quality",
        title: "Province factor map missing territories (YT, NT, NU)",
        description: "The province factor lookup map is missing entries for Yukon, Northwest Territories, and Nunavut. Quotes for these territories would use the default factor.",
        evidence: "Province factor dictionary missing YT, NT, NU entries.",
        example: "// Missing:\n// YT (Yukon), NT (Northwest Territories), NU (Nunavut)\n// These territories would get default factor 1.0",
        recommendation: "Add territory entries to the province factor map for completeness.",
        affectedComponents: ["carrier_connector"]
      }
    ],

    "schema_cache": [
      {
        id: "ins_sc_001",
        severity: "warning",
        category: "code_quality",
        title: "GetActiveSchema accepts 'locale' parameter but never uses it",
        description: "The GetActiveSchema endpoint accepts a locale query parameter but the service logic ignores it completely. Callers may pass locale expecting localized schemas but always get the default.",
        evidence: "GetActiveSchema method signature includes locale parameter but it is not used in the query.",
        example: "// SchemaController.cs\npublic async Task<IActionResult> GetActiveSchema(\n    [FromQuery] string carrierId,\n    [FromQuery] string productCode,\n    [FromQuery] string? locale)  // accepted but never used\n{\n    var schema = await _service.GetActiveSchema(carrierId, productCode);\n    // locale is ignored\n}",
        recommendation: "Either implement locale-based filtering or remove the parameter to avoid misleading callers.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_002",
        severity: "warning",
        category: "performance",
        title: "No in-memory caching despite being named 'SchemaCache' - every request hits MongoDB",
        description: "Despite the service being named SchemaCache, there is no caching layer. Every request goes directly to MongoDB. Schemas change infrequently, making them ideal candidates for in-memory caching.",
        evidence: "No IMemoryCache, IDistributedCache, or any caching mechanism found in the codebase.",
        example: "// SchemaService.cs\npublic async Task<Bundle?> GetActiveSchema(string carrierId, string productCode) {\n    return await _repository.FindActiveAsync(carrierId, productCode);  // always hits MongoDB\n    // No cache check, no cache population\n}",
        recommendation: "Add IMemoryCache with appropriate TTL for schema bundles. Schemas are read-heavy and change-infrequent - ideal for caching.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_003",
        severity: "warning",
        category: "code_quality",
        title: "CodeListItem.Metadata silently dropped during DTO-to-domain mapping",
        description: "When converting CodeListItem DTOs to domain objects, the Metadata property is not mapped. Any metadata attached to code list items is silently lost.",
        evidence: "DTO-to-domain mapping for CodeListItem does not include the Metadata property.",
        example: "// Mapping logic\nnew CodeListItem {\n    Code = dto.Code,\n    Label = dto.Label\n    // dto.Metadata is not mapped - silently dropped\n}",
        recommendation: "Include Metadata in the mapping or explicitly document why it is excluded.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_004",
        severity: "warning",
        category: "code_quality",
        title: "UpsertBundleAsync throws on duplicates despite 'Upsert' name",
        description: "The method is named UpsertBundleAsync (implying insert-or-update), but it throws a 409 Conflict exception when a bundle with the same ID already exists. The name is misleading.",
        evidence: "UpsertBundleAsync checks for existing bundle and throws ConflictException if found.",
        example: "// SchemaService.cs\npublic async Task UpsertBundleAsync(Bundle bundle) {\n    var existing = await _repo.FindByIdAsync(bundle.Id);\n    if (existing != null)\n        throw new ConflictException(\"Bundle already exists\");  // not an upsert!\n}",
        recommendation: "Either rename to CreateBundleAsync (since it doesn't upsert) or implement true upsert behavior.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_005",
        severity: "warning",
        category: "security",
        title: "No authentication on schema endpoints",
        description: "The SchemaCache API has no authentication middleware. Any client can read/write schema data without credentials, including overwriting carrier schemas.",
        evidence: "File: Program.cs - No authentication/authorization middleware. CRUD operations exposed without access control.",
        example: "// Program.cs - no auth\napp.UseRouting();\n// No UseAuthentication() or UseAuthorization()\napp.MapControllers();  // all endpoints publicly accessible",
        recommendation: "Add API key validation or Azure AD authentication. At minimum, write operations should require authentication.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_006",
        severity: "warning",
        category: "security",
        title: "CORS enabled with UseCors() but no policy defined",
        description: "UseCors() is called in the pipeline but no CORS policy is configured, which may result in default behavior that is either too permissive or too restrictive depending on the framework version.",
        evidence: "app.UseCors() called without a named policy or options configuration.",
        example: "// Program.cs\napp.UseCors();  // no policy name, no AddCors() with options\n// Default behavior is unpredictable",
        recommendation: "Define an explicit CORS policy with allowed origins, methods, and headers.",
        affectedComponents: ["schema_cache"]
      },
      {
        id: "ins_sc_007",
        severity: "info",
        category: "deployment",
        title: "AZServiceBusOptions missing FullyQualifiedServiceBusNamespace for managed identity",
        description: "The Service Bus configuration uses connection string authentication instead of managed identity (FullyQualifiedServiceBusNamespace). This is less secure and doesn't follow Azure best practices.",
        evidence: "AZServiceBusOptions lacks FullyQualifiedServiceBusNamespace property.",
        example: "// AZServiceBusOptions.cs\npublic string ConnectionString { get; set; }  // using connection string\n// Missing: public string FullyQualifiedServiceBusNamespace { get; set; }",
        recommendation: "Add support for managed identity authentication via FullyQualifiedServiceBusNamespace.",
        affectedComponents: ["schema_cache"]
      }
    ],

    "rpm_client": [
      {
        id: "ins_rpmw_001",
        severity: "warning",
        category: "code_quality",
        title: "Client ID hardcoded as 'JOHTO4991'",
        description: "A client ID is hardcoded as 'JOHTO4991' in the source code instead of being read from configuration. This may be a test tenant ID that should be configurable per environment.",
        evidence: "Hardcoded client ID 'JOHTO4991' found in application code.",
        example: "// Hardcoded client ID\nvar clientId = \"JOHTO4991\";  // should come from config",
        recommendation: "Move the client ID to appsettings.json configuration.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_002",
        severity: "warning",
        category: "code_quality",
        title: "CSIO mapping code commented out - integration incomplete",
        description: "The code that would translate CDM data to CSIO XML format (required for most Canadian carriers) is commented out in several places. The lead architect for CSIO mapping (Bhavesh Patel) is on leave.",
        evidence: "Multiple commented-out CSIO mapping code blocks found in the application.",
        example: "// CSIO XML translation - commented out\n// var csioXml = _csioMapper.MapToCsioXml(cdmData);\n// await _carrierAdapter.SubmitAsync(csioXml);",
        recommendation: "Track CSIO mapping as a critical path item. Plan for knowledge transfer since the lead architect is on leave.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_003",
        severity: "warning",
        category: "code_quality",
        title: "Timer-based debounce race condition with Blazor render thread",
        description: "A System.Timers.Timer is used for debouncing state updates, but the timer callback executes on a thread pool thread while Blazor Server requires UI updates on the render thread. This can cause race conditions and InvalidOperationException.",
        evidence: "Timer-based debounce pattern found without InvokeAsync marshaling to Blazor render thread.",
        example: "// Timer fires on thread pool thread\n_debounceTimer.Elapsed += (s, e) => {\n    UpdateState();  // NOT on Blazor render thread\n    StateHasChanged();  // UNSAFE - must be called via InvokeAsync\n};",
        recommendation: "Use InvokeAsync(() => StateHasChanged()) in the timer callback to marshal back to the Blazor render thread.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_004",
        severity: "warning",
        category: "code_quality",
        title: "stateUpdateDebounceTimer never disposed - resource leak",
        description: "The debounce timer is created but never disposed when the component is disposed. This causes a resource leak and can trigger callbacks on disposed components.",
        evidence: "Timer field never disposed in component's Dispose/DisposeAsync method.",
        example: "// Timer created but never cleaned up\nprivate Timer _stateUpdateDebounceTimer = new Timer(300);\n\n// Component's Dispose() does not dispose the timer\npublic void Dispose() {\n    // _stateUpdateDebounceTimer.Dispose();  <-- missing\n}",
        recommendation: "Implement IDisposable and dispose the timer when the component is disposed.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_005",
        severity: "warning",
        category: "code_quality",
        title: "Hardcoded 3-second Task.Delay before scroll detection",
        description: "A Task.Delay(3000) is used before initializing scroll detection, presumably to wait for the DOM to render. This is fragile and wastes 3 seconds on every page load.",
        evidence: "Task.Delay(3000) found before JavaScript interop scroll detection setup.",
        example: "await Task.Delay(3000);  // wait 3 seconds for DOM\nawait JSRuntime.InvokeVoidAsync(\"initScrollDetection\");",
        recommendation: "Use OnAfterRenderAsync with firstRender check instead of a fixed delay. Or use JavaScript MutationObserver to detect when the DOM is ready.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_006",
        severity: "warning",
        category: "code_quality",
        title: "QuoteService swallows error response bodies - no details surfaced to user",
        description: "When HTTP requests to the BFF fail, the QuoteService reads the status code but discards the response body. Error details from downstream services are lost.",
        evidence: "QuoteService error handling checks IsSuccessStatusCode but does not read the error response body.",
        example: "// QuoteService.cs\nif (!response.IsSuccessStatusCode) {\n    return new QuoteResult { Success = false };\n    // response.Content is never read - error details lost\n}",
        recommendation: "Read and log the error response body. Surface meaningful error messages to the user.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_007",
        severity: "warning",
        category: "code_quality",
        title: "OnGetQuote calls GetOffersAsync immediately after RateQuoteAsync - rating is async, offers will be empty",
        description: "After submitting a quote for rating (an async operation that fans out to multiple carriers), the code immediately calls GetOffersAsync. Since rating takes seconds to minutes, the offers list will always be empty at this point.",
        evidence: "Sequential call to RateQuoteAsync followed immediately by GetOffersAsync without waiting for rating completion.",
        example: "// OnGetQuote handler\nawait _quoteService.RateQuoteAsync(quoteId);  // starts async rating\nvar offers = await _quoteService.GetOffersAsync(quoteId);  // immediately - offers empty!\n// Should poll or use SignalR notification",
        recommendation: "Implement polling with a timer or use SignalR to notify the UI when rating responses arrive.",
        affectedComponents: ["rpm_client"]
      },
      {
        id: "ins_rpmw_008",
        severity: "info",
        category: "code_quality",
        title: "LOB hardcoded to 'Auto' in LoadSchemaAndInitializeForm",
        description: "The Line of Business is hardcoded to 'Auto' when loading schemas and initializing forms. Only auto insurance quoting is supported.",
        evidence: "LOB parameter hardcoded to 'Auto' in schema loading logic.",
        example: "// LoadSchemaAndInitializeForm\nvar schema = await _schemaCacheManager.GetActiveSchema(carrierId, \"Auto\");  // hardcoded",
        recommendation: "Make LOB configurable when multi-LOB support is needed.",
        affectedComponents: ["rpm_client"]
      }
    ],

    "bff": [
      {
        id: "ins_bff_001",
        severity: "critical",
        category: "code_quality",
        title: "SetApiKeyHeader mutates HttpClient.DefaultRequestHeaders on every request - not thread-safe",
        description: "The BFF modifies HttpClient.DefaultRequestHeaders on every outbound request. DefaultRequestHeaders is shared across all concurrent requests using that HttpClient instance. Under concurrent load, one request can overwrite the header while another is mid-flight, causing intermittent auth failures.",
        evidence: "SetApiKeyHeader modifies HttpClient.DefaultRequestHeaders instead of per-request HttpRequestMessage.Headers.",
        example: "// QuoteService.cs\nprivate void SetApiKeyHeader() {\n    _httpClient.DefaultRequestHeaders.Remove(\"Ocp-Apim-Subscription-Key\");\n    // Thread B reads headers HERE - header is missing!\n    _httpClient.DefaultRequestHeaders.Add(\"Ocp-Apim-Subscription-Key\", _apiKey);\n}\n// Remove + Add is NOT atomic - race condition under concurrent requests",
        recommendation: "Set headers on the individual HttpRequestMessage instead of DefaultRequestHeaders. Or use a DelegatingHandler to add the header to each request.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_002",
        severity: "critical",
        category: "integration",
        title: "QuoteManagementApiUrl is empty - all quote operations silently fail",
        description: "The BFF appsettings.json has an empty QuoteManagementApiUrl while all other service URLs are populated. The HttpClient's BaseAddress is empty, so all quote management requests go to a relative URL with no host, silently failing.",
        evidence: "File: appsettings.json - 'QuoteManagementApiUrl': '' (empty). All other service URLs have values.",
        example: "// appsettings.json\n\"QuoteManagementApiUrl\": \"\",  // EMPTY!\n\"JournalTasksApiUrl\": \"https://api-journal-tasks-dev.azurewebsites.net\",  // populated\n\n// Result: _httpClient.BaseAddress = new Uri(\"\")  // invalid\n// All quote CRUD and rating operations silently fail",
        recommendation: "Set QuoteManagementApiUrl to the correct endpoint URL for each environment.",
        affectedComponents: ["bff", "quote_mgmt"]
      },
      {
        id: "ins_bff_003",
        severity: "warning",
        category: "security",
        title: "No authentication middleware - all BFF endpoints publicly accessible",
        description: "The BFF has UseAuthorization() but relies on token passthrough from the RPM Client. There is no UseAuthentication() middleware, meaning the BFF endpoints are accessible to anyone who can reach the service, not just the RPM Client.",
        evidence: "File: Program.cs - No AddAuthentication() or UseAuthentication() calls.",
        example: "// Program.cs\napp.UseRouting();\n// app.UseAuthentication();  <-- MISSING\napp.UseAuthorization();\n// Any HTTP client can call BFF endpoints directly",
        recommendation: "Add authentication middleware to verify bearer tokens from the RPM Client.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_004",
        severity: "warning",
        category: "code_quality",
        title: "Polly retry/circuit breaker policies commented out",
        description: "The Polly resilience policies (retry, circuit breaker) for the QuoteService HTTP client are commented out. There is no retry or circuit breaker protection for quote management API calls.",
        evidence: "File: Program.cs - .AddResiliencePolicies() call is commented out for QuoteService.",
        example: "// Program.cs\nbuilder.Services.AddHttpClient<IQuoteService, QuoteService>(...)\n//    .AddResiliencePolicies(nameof(PollyPolicyOptions), builder.Configuration);\n//    ^^^ COMMENTED OUT\n\n// Config exists but is unused:\n// \"PollyPolicyOptions\": { \"RetryCount\": 3, \"CircuitBreakerCount\": 5 }",
        recommendation: "Uncomment and configure resilience policies for the QuoteService HTTP client.",
        affectedComponents: ["bff", "quote_mgmt"]
      },
      {
        id: "ins_bff_005",
        severity: "warning",
        category: "deployment",
        title: "API key resolved synchronously in constructor via Key Vault - blocks startup",
        description: "The APIM subscription key is fetched from Azure Key Vault synchronously during service construction, blocking the application startup. If Key Vault is slow or unavailable, startup hangs.",
        evidence: "API key retrieval from Key Vault happens synchronously in constructor or service registration.",
        example: "// Synchronous Key Vault call during construction\nvar apimKey = keyVaultClient.GetSecretAsync(\"apim-key\").Result;  // .Result blocks thread\n// If Key Vault takes 5 seconds, startup is blocked 5 seconds",
        recommendation: "Use async initialization pattern or lazy initialization for the Key Vault secret.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_006",
        severity: "warning",
        category: "code_quality",
        title: "Every QuoteService method duplicates identical boilerplate (DRY violation)",
        description: "Every method in QuoteService repeats the same pattern: set API key header, make HTTP call, check status, deserialize. This boilerplate is duplicated 8+ times.",
        evidence: "QuoteService methods all contain identical boilerplate for header setting, HTTP calls, and error handling.",
        example: "// Every method follows this pattern:\npublic async Task<T> SomeMethodAsync(...) {\n    SetApiKeyHeader();  // duplicated\n    var response = await _httpClient.GetAsync(url);  // same pattern\n    if (!response.IsSuccessStatusCode) return default;  // duplicated\n    return await response.Content.ReadFromJsonAsync<T>();  // duplicated\n}\n// Repeated 8+ times with only the URL and return type changing",
        recommendation: "Extract common HTTP call logic into a private helper method or use a DelegatingHandler for the API key.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_007",
        severity: "warning",
        category: "code_quality",
        title: "Non-success HTTP responses don't read error body - details lost",
        description: "When downstream service calls return non-success status codes, the BFF returns a generic error without reading the response body. Error details from backend services are lost.",
        evidence: "QuoteService and other service classes check IsSuccessStatusCode but discard error response bodies.",
        example: "// QuoteService.cs\nif (!response.IsSuccessStatusCode) {\n    _logger.LogError(\"Request failed with {Status}\", response.StatusCode);\n    return default;  // response.Content never read\n    // Backend may have returned: { \"error\": \"Quote not found\", \"quoteId\": \"abc\" }\n}",
        recommendation: "Read and log error response bodies for debugging. Consider surfacing meaningful error messages upstream.",
        affectedComponents: ["bff"]
      },
      {
        id: "ins_bff_008",
        severity: "info",
        category: "deployment",
        title: "Swagger only enabled in Development, not in Dev/QA environments",
        description: "Swagger UI is gated behind IsDevelopment() check, which means it's unavailable in deployed Dev/QA environments where it would be useful for debugging.",
        evidence: "Swagger enabled only when Environment.IsDevelopment() is true.",
        example: "// Program.cs\nif (app.Environment.IsDevelopment()) {\n    app.UseSwagger();\n    app.UseSwaggerUI();\n}\n// Deployed dev/qa environments have ASPNETCORE_ENVIRONMENT != Development",
        recommendation: "Enable Swagger in Dev and QA environments by checking for Production specifically: if (!app.Environment.IsProduction()).",
        affectedComponents: ["bff"]
      }
    ]
  },

  crossComponent: [
    {
      id: "ins_sys_001",
      severity: "critical",
      category: "integration",
      title: "Service Bus namespace mismatch across rating pipeline",
      description: "QuoteManagement publishes to Service Bus namespace 'sbns-rating-dev-001', but Orchestrator and CarrierConnector both use 'sbns-ratingplatform-dev-001'. These are two completely different Azure Service Bus instances. The core rating pipeline is fundamentally broken - messages from QuoteManagement never reach the Orchestrator.",
      affectedComponents: ["quote_mgmt", "orchestrator", "carrier_connector"]
    },
    {
      id: "ins_sys_002",
      severity: "critical",
      category: "deployment",
      title: "QuoteManagement and SchemaCache CI pipelines push to wrong ACR",
      description: "The CI/CD pipelines for QuoteManagement and SchemaCache push Docker images to the old ACR (acrrivalplatformcommonagnostictest001) instead of the new rating platform ACR (acrratingplatformdev001). Container Apps configured to pull from the new ACR will never find these images.",
      affectedComponents: ["quote_mgmt", "schema_cache"]
    },
    {
      id: "ins_sys_003",
      severity: "critical",
      category: "deployment",
      title: "No production infrastructure exists",
      description: "Only dev and qa environments are defined in Terraform/OpenTofu configurations. There is no production environment infrastructure provisioned. The platform cannot go to production without significant infrastructure work.",
      affectedComponents: ["quote_mgmt", "orchestrator", "carrier_connector", "schema_cache", "rpm_client", "bff"]
    },
    {
      id: "ins_sys_004",
      severity: "warning",
      category: "code_quality",
      title: "DynamicFieldValue.NumberValue type mismatch: decimal vs double between services",
      description: "QuoteManagement uses decimal for NumberValue while Orchestrator uses double. When rating data flows through the pipeline, precision loss occurs during decimal-to-double conversion. For insurance premiums, even small precision differences can compound.",
      affectedComponents: ["quote_mgmt", "orchestrator"]
    },
    {
      id: "ins_sys_005",
      severity: "warning",
      category: "architecture",
      title: "Services duplicate RatingRequestMessage independently - no shared contract package",
      description: "QuoteManagement, Orchestrator, and CarrierConnector each define their own version of the RatingRequestMessage class independently. There is no shared NuGet package for message contracts, creating a contract drift risk.",
      affectedComponents: ["quote_mgmt", "orchestrator", "carrier_connector"]
    },
    {
      id: "ins_sys_006",
      severity: "warning",
      category: "deployment",
      title: "APIM gateway not provisioned in infrastructure",
      description: "The Orchestrator requires APIM for response delivery (configured in appsettings) and QuoteManagement expects APIM subscription key validation, but no APIM resource is provisioned in the Terraform infrastructure.",
      affectedComponents: ["orchestrator", "quote_mgmt", "bff"]
    },
    {
      id: "ins_sys_007",
      severity: "warning",
      category: "deployment",
      title: "Manufacture service has zero application code - only Terraform scaffolding",
      description: "The Rival.Rating.API.Manufacture service exists as a repository with Terraform infrastructure code but zero application code. Additionally, the pipeline references an ACR with a typo in the name.",
      affectedComponents: ["quote_mgmt", "orchestrator", "carrier_connector", "schema_cache", "rpm_client", "bff"]
    },
    {
      id: "ins_sys_008",
      severity: "warning",
      category: "code_quality",
      title: "SchemaCache stale 57 days, QuoteManagement stale 45 days",
      description: "Two critical backend services in the quoting infrastructure have had no development activity for extended periods. SchemaCache has been dormant for 57 days and QuoteManagement for 45 days, while multiple critical bugs remain unfixed.",
      affectedComponents: ["quote_mgmt", "schema_cache"]
    },
    {
      id: "ins_sys_009",
      severity: "warning",
      category: "code_quality",
      title: "Bhavesh Patel (53% of CarrierConnector commits) is on leave",
      description: "The primary contributor to the CarrierConnector and CSIO architecture lead (Bhavesh Patel, 53% of commits) is on leave. CSIO mapping code is commented out and no other team member has this domain expertise.",
      affectedComponents: ["carrier_connector"]
    },
    {
      id: "ins_sys_010",
      severity: "warning",
      category: "code_quality",
      title: "Zero test coverage in RPM Client (1310 commits, 0 tests) and BFF (285 commits, 0 tests)",
      description: "The two most user-facing layers - RPM Client (Blazor frontend) and BFF (middleware) - have zero automated tests despite being the most actively developed services. Any regression goes undetected until a user reports it.",
      affectedComponents: ["rpm_client", "bff"]
    },
    {
      id: "ins_sys_011",
      severity: "warning",
      category: "code_quality",
      title: "Activity concentrated in frontend (81% of recent commits) while backend is stale",
      description: "81% of recent commit activity is in the RPM Client frontend, while backend rating services have stalled. The frontend is building against APIs that have critical bugs and integration mismatches.",
      affectedComponents: ["rpm_client", "quote_mgmt", "schema_cache"]
    },
    {
      id: "ins_sys_012",
      severity: "info",
      category: "integration",
      title: "Orchestrator to CarrierConnector queue contracts verified correct",
      description: "The Service Bus queue names and message contracts between Orchestrator and CarrierConnector are correctly aligned. The Orchestrator publishes to 'sbq-rating-jobs' and CarrierConnector consumes from the same queue. This portion of the pipeline works.",
      affectedComponents: ["orchestrator", "carrier_connector"]
    },
    {
      id: "ins_sys_013",
      severity: "info",
      category: "architecture",
      title: "BFF correctly implements proxy pattern - no business logic leakage",
      description: "The BFF properly acts as a thin proxy layer with no business logic. Orchestration logic is contained in dedicated orchestrator classes (OpportunityRequestOrchestrator, PolicyApplicationOrchestrator) and business rules stay in backend services.",
      affectedComponents: ["bff"]
    },
    {
      id: "ins_sys_014",
      severity: "info",
      category: "deployment",
      title: "All Dockerfiles follow best practices - multi-stage, non-root, .NET 9.0",
      description: "All backend service Dockerfiles use multi-stage builds (base, build, test, publish, final stages), run as non-root users, and target .NET 9.0. This is a consistent, secure containerization pattern across the platform.",
      affectedComponents: ["quote_mgmt", "orchestrator", "carrier_connector", "schema_cache"]
    }
  ],

  healthScores: {
    "quote_mgmt": {
      overall: 35,
      activity: 25,
      ci: 85,
      deployment: 70,
      testing: 65,
      documentation: 40,
      busFactorScore: 35
    },
    "orchestrator": {
      overall: 60,
      activity: 90,
      ci: 85,
      deployment: 65,
      testing: 75,
      documentation: 50,
      busFactorScore: 40
    },
    "carrier_connector": {
      overall: 55,
      activity: 90,
      ci: 90,
      deployment: 65,
      testing: 80,
      documentation: 55,
      busFactorScore: 50
    },
    "schema_cache": {
      overall: 45,
      activity: 15,
      ci: 80,
      deployment: 70,
      testing: 70,
      documentation: 40,
      busFactorScore: 25
    },
    "rpm_client": {
      overall: 50,
      activity: 98,
      ci: 80,
      deployment: 80,
      testing: 5,
      documentation: 40,
      busFactorScore: 80
    },
    "bff": {
      overall: 40,
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
