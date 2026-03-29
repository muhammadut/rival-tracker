/* ═══════════════════════════════════════════════════════════════
   TASK DETAILS — Expandable explanations for every MVP checklist item
   Click any task in the MVP Tracker to see: what, why, how, example
   ═══════════════════════════════════════════════════════════════ */

window.TASK_DETAILS = {

  /* ═══ PHASE 0: Azure Access & Infrastructure ═══ */

  p0_1: {
    what: 'Request a sandbox Azure subscription with all required services enabled.',
    why: 'Every service in the Rating Platform runs on Azure. Without a subscription, we cannot provision Service Bus (queues), Cosmos DB (database), SQL Server (auth), or Container Apps (hosting). Nothing can be deployed or tested.',
    how: 'Go to Deji (DevOps) and request a new Azure subscription. Specify the exact services needed: Container Apps, Service Bus, Cosmos DB with MongoDB API, SQL Server, Key Vault, Blob Storage, API Management, Application Insights.',
    example: 'Required Azure services:\n- Azure Container Apps (hosting 4 microservices)\n- Azure Service Bus (3 message queues)\n- Azure Cosmos DB with MongoDB API (quote storage)\n- Azure SQL Server (ASP.NET Identity / user auth)\n- Azure Key Vault (secrets management)\n- Azure Blob Storage (response archival)\n- Application Insights (monitoring)\n\nResource group naming: rg-ratingplatform-sandbox-001',
    tilesInto: 'Everything. This is the foundation — Phases 1-5 all depend on Azure services existing.'
  },

  p0_2: {
    what: 'Request a dev subscription that the full team can access.',
    why: 'Sandbox is for initial experimentation. Dev is the shared environment where all team members deploy and test together. This mirrors what will become production.',
    how: 'Same process as p0_1 but with team-wide access. RBAC roles: Contributor for developers, Reader for stakeholders.',
    example: 'Same resource list as sandbox. Add RBAC assignments:\n- Tariq: Contributor\n- Mehul: Contributor\n- Bhoomika: Contributor\n- Luke: Contributor\n- Fabrizio: Reader',
    tilesInto: 'Team collaboration. Without this, developers cannot deploy their fixes and test against shared infrastructure.'
  },

  p0_3: {
    what: 'Request a prod subscription with restricted access.',
    why: 'Production environment should only be accessible via CI/CD pipelines, not by individual developers. This prevents accidental changes to live systems.',
    how: 'Request from DevOps with deployment-only access. Only CI/CD service principals get Contributor role.',
    example: 'Not urgent for MVP demo. Can be deferred until after Tier 1 is proven in dev.',
    tilesInto: 'Production readiness. Not blocking for MVP demo.'
  },

  p0_4: {
    what: 'Verify that Azure AD app registration is correctly configured for RPM Client authentication.',
    why: 'The RPM Client (Blazor frontend) requires Azure AD login on EVERY page. The code has FallbackPolicy = DefaultPolicy, which means unauthenticated users cannot access anything — not even the login page if the Azure AD app is misconfigured. If ClientSecret is missing or redirect URIs are wrong, the entire frontend is inaccessible.',
    how: 'Go to Azure Portal → Azure Active Directory → App registrations → find the RPM Client app. Check:\n1. ClientSecret exists and is not expired\n2. Redirect URIs include https://localhost:7xxx for dev and the deployed URL\n3. API permissions include User.Read',
    example: 'In Azure Portal:\nApp Registration: "Rival.Platform.Web"\nRedirect URIs:\n  - https://localhost:7001/signin-oidc (dev)\n  - https://rpm-client-dev.azurecontainerapps.io/signin-oidc (deployed)\n\nClient Secret: [verify not expired — create new if needed]\n\nIn appsettings.json:\n"AzureAd": {\n  "Instance": "https://login.microsoftonline.com/",\n  "TenantId": "your-tenant-id",\n  "ClientId": "your-client-id",\n  "ClientSecret": "your-secret"\n}',
    tilesInto: 'RPM Client login. Without this, nobody can access the frontend to submit quotes.'
  },

  p0_5: {
    what: 'Create the Azure Service Bus namespace for the Rating Platform.',
    why: 'Service Bus is the backbone of the async architecture. All messages between Quote Management, Rating Orchestrator, and Carrier Connector flow through Service Bus queues. The namespace is the container for all queues.',
    how: 'Create via Azure Portal or Bicep:\naz servicebus namespace create --name sbns-ratingplatform-dev-001 --resource-group rg-ratingplatform-dev-001 --sku Standard',
    example: 'Bicep template:\nresource serviceBusNamespace \'Microsoft.ServiceBus/namespaces@2022-10-01-preview\' = {\n  name: \'sbns-ratingplatform-${env}-001\'\n  location: resourceGroup().location\n  sku: { name: \'Standard\', tier: \'Standard\' }\n}',
    tilesInto: 'Service Bus queues (p0_6). Cannot create queues without a namespace.'
  },

  p0_6: {
    what: 'Create the three Service Bus queues used by the Rating Platform.',
    why: 'The data flow uses three queues:\n1. sbq-rating-requests — QuoteManagement publishes here when a broker submits a quote\n2. sbq-rating-jobs — Orchestrator fans out per-carrier messages here\n3. sbq-rating-responses — CarrierConnector publishes results here\n\nWithout these queues, messages have nowhere to go.',
    how: 'Create via Bicep (preferred — repeatable across environments) or Azure CLI:\naz servicebus queue create --namespace-name sbns-ratingplatform-dev-001 --name sbq-rating-requests\naz servicebus queue create --namespace-name sbns-ratingplatform-dev-001 --name sbq-rating-jobs\naz servicebus queue create --namespace-name sbns-ratingplatform-dev-001 --name sbq-rating-responses',
    example: 'Bicep template for one queue:\nresource ratingRequestsQueue \'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview\' = {\n  parent: serviceBusNamespace\n  name: \'sbq-rating-requests\'\n  properties: {\n    maxDeliveryCount: 10\n    deadLetteringOnMessageExpiration: true\n    lockDuration: \'PT2M\'\n  }\n}\n\nRepeat for sbq-rating-jobs and sbq-rating-responses.',
    tilesInto: 'The entire message flow. Quote Management → Orchestrator → Carrier Connector all communicate through these queues.'
  },

  p0_7: {
    what: 'Create a Cosmos DB account with MongoDB API enabled for storing quote records.',
    why: 'Quote Management stores all quote data (CDM fields, carrier targets, status, pricing results) in a MongoDB-compatible database. Cosmos DB with MongoDB API gives us a managed, scalable document database that standard MongoDB drivers can connect to.',
    how: 'az cosmosdb create --name cosmos-ratingplatform-dev-001 --resource-group rg-ratingplatform-dev-001 --kind MongoDB --server-version 4.2',
    example: 'After creation, get the connection string:\naz cosmosdb keys list --name cosmos-ratingplatform-dev-001 --type connection-strings\n\nAdd to QuoteManagement appsettings.json:\n"MongoDBDatabaseOptions": {\n  "ConnectionString": "mongodb://cosmos-ratingplatform-dev-001:xxxxx@cosmos-ratingplatform-dev-001.mongo.cosmos.azure.com:10255/?ssl=true",\n  "DatabaseName": "Quoting"\n}',
    tilesInto: 'Quote Management data persistence. Without this, quotes cannot be saved or retrieved.'
  },

  p0_8: {
    what: 'Create an Azure SQL Server instance for ASP.NET Identity (user authentication).',
    why: 'The RPM Client uses ASP.NET Identity for user management. Identity requires a SQL Server database to store users, roles, and claims. The code at Program.cs:128 calls UseSqlServer with "IdentityDatabase" connection string. If no SQL Server exists, the frontend will not start.',
    how: 'az sql server create --name sql-ratingplatform-dev-001 --resource-group rg-ratingplatform-dev-001 --admin-user sqladmin --admin-password <password>\naz sql db create --server sql-ratingplatform-dev-001 --name IdentityDb --service-objective S0',
    example: 'Connection string for appsettings.json:\n"ConnectionStrings": {\n  "IdentityDatabase": "Server=sql-ratingplatform-dev-001.database.windows.net;Database=IdentityDb;User Id=sqladmin;Password=<password>;"\n}',
    tilesInto: 'RPM Client startup. Without SQL Server, the app crashes on launch with "Cannot open database IdentityDb".'
  },

  p0_9: {
    what: 'Create Azure Key Vault for storing secrets securely.',
    why: 'Carrier OAuth2 credentials (client_id, client_secret for Aviva, Peace Hills, SGI), database connection strings, and APIM keys should be stored in Key Vault, not in appsettings.json. This is a security best practice.',
    how: 'az keyvault create --name kv-ratingplatform-dev-001 --resource-group rg-ratingplatform-dev-001 --sku standard',
    example: 'Store a secret:\naz keyvault secret set --vault-name kv-ratingplatform-dev-001 --name "Aviva-ClientSecret" --value "<secret>"\n\nReference from appsettings.json:\n"OAuth2Settings": {\n  "ClientSecret": "@Microsoft.KeyVault(VaultName=kv-ratingplatform-dev-001;SecretName=Aviva-ClientSecret)"\n}',
    tilesInto: 'Security. Not blocking for dev/sandbox (can use appsettings.json), but required for production.'
  },

  p0_10: {
    what: 'Run Entity Framework database migrations to create the ASP.NET Identity schema in SQL Server.',
    why: 'The SQL Server database is empty when first created. EF migrations create the tables needed by ASP.NET Identity: AspNetUsers, AspNetRoles, AspNetUserRoles, AspNetUserClaims, etc. Without these tables, user authentication fails with "Invalid object name AspNetUsers".',
    how: 'From the RPM Client project directory:\ndotnet ef database update --connection "Server=sql-ratingplatform-dev-001.database.windows.net;Database=IdentityDb;User Id=sqladmin;Password=<password>;"',
    example: 'This creates tables:\n- AspNetUsers (Id, Email, UserName, PasswordHash, ...)\n- AspNetRoles (Id, Name, NormalizedName)\n- AspNetUserRoles (UserId, RoleId)\n- AspNetUserClaims (Id, UserId, ClaimType, ClaimValue)\n\nVerify:\nSELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = \'dbo\'\n→ Should show 7 AspNet* tables',
    tilesInto: 'User seeding (p0_11). Cannot seed users until the tables exist.'
  },

  p0_11: {
    what: 'Insert demo user accounts into the AspNetUsers table so people can log in.',
    why: 'The RPM Client has an OnTokenValidated event that calls FindByEmailAsync. If the user\'s email (from Azure AD) is not found in the AspNetUsers table, they are redirected to /noaccess. Even with a valid Azure AD login, you cannot use the app without a matching database record.',
    how: 'Insert via SQL or a seed script:\nINSERT INTO AspNetUsers (Id, Email, NormalizedEmail, UserName, NormalizedUserName, EmailConfirmed, SecurityStamp)\nVALUES (NEWID(), \'tariq@rivalinsurance.com\', \'TARIQ@RIVALINSURANCE.COM\', \'tariq@rivalinsurance.com\', \'TARIQ@RIVALINSURANCE.COM\', 1, NEWID())',
    example: 'Seed script for demo users:\n-- Tariq\nINSERT INTO AspNetUsers (...) VALUES (NEWID(), \'tariq@rivalinsurance.com\', ...);\n-- Fabrizio\nINSERT INTO AspNetUsers (...) VALUES (NEWID(), \'fabrizio@rivalinsurance.com\', ...);\n-- Demo broker\nINSERT INTO AspNetUsers (...) VALUES (NEWID(), \'demo.broker@rivalinsurance.com\', ...);\n\nThe email must match what Azure AD returns in the id_token.',
    tilesInto: 'Frontend access. Without seeded users, Azure AD login succeeds but the app shows /noaccess.'
  },

  p0_12: {
    what: 'Hold a kickoff meeting to make 3 architectural decisions that block coding work.',
    why: 'Three design decisions must be made before developers start fixing code, because the fix depends on which direction is chosen:\n1. Response path: Should CarrierConnector change its flat response to nested, or should QuoteManagement change to accept flat?\n2. CarrierTargets: Should the frontend send them, or should QuoteManagement default to all enabled carriers?\n3. Contract fix approach: In-place fixes (faster) or shared NuGet package (cleaner)?',
    how: 'Schedule a 1-hour meeting with Tariq, Mehul, Bhoomika, Luke. Present each decision with pros/cons. Get a binding decision. Document in ADO wiki.',
    example: 'Recommended decisions (from analysis):\n1. Response format → QuoteManagement adapts to accept flat responses (less work, Connector is harder to change)\n2. CarrierTargets → QuoteManagement defaults to all enabled carriers when null (avoids frontend changes)\n3. Contract approach → In-place fixes for Tier 1, shared package for Tier 2 (fastest path to demo)',
    tilesInto: 'Phase 3 coding. Developers need to know WHICH direction before they start changing code.'
  },

  p0_13: {
    what: 'File requests with carrier partners for sandbox/test API credentials.',
    why: 'Real carrier APIs (Aviva, Peace Hills) require OAuth2 credentials. The onboarding process typically takes 2-6 weeks because it involves the carrier\'s IT team setting up a test environment, generating client_id/secret, and whitelisting IP addresses. Starting now means credentials arrive by the time Tier 2 development is ready.',
    how: 'Follow the carrier onboarding process documented in the ADO wiki. File through DevOps per the established process.',
    example: 'For Peace Hills (Okta OAuth2):\n- Request: "Need sandbox credentials for direct rating API integration test"\n- They provide: client_id, client_secret, token_url, rating_endpoint_url\n- Timeline: typically 2-4 weeks\n\nFor Aviva (Auth0 OAuth2):\n- Request: "Need QA environment credentials for Guidewire CSIO 1.48 rating"\n- They provide: client_id, client_secret, audience, Auth0 domain\n- Timeline: typically 3-6 weeks',
    tilesInto: 'Phase 5 (Tier 2 integration). Without credentials, we can only use the simulator.'
  },

  p0_14: {
    what: 'Check if the existing CSIO NuGet package (Cssi.Schemas.Csio.Xml) is compatible with .NET 9.',
    why: 'This is the single highest-leverage decision in the entire project. The CSIO package contains auto-generated C# classes for all CSIO XML elements (PersAutoPolicyQuoteInqRq, PersDriver, PersVeh, etc.). If it targets .NET Standard 2.0, it works with .NET 9 and the CDM-to-CSIO converter is 5-8 days of work. If it targets .NET Framework only, we must build XML manually — 12-18 days of work.',
    how: 'Open Rating.Csio.Packages.Data/Csio.Packages.Data.csproj and check the <TargetFramework> tag. If it says "netstandard2.0" → compatible. If it says "net48" or "net472" → incompatible.',
    example: 'Compatible:\n<TargetFramework>netstandard2.0</TargetFramework>\n→ Can reference from .NET 9 project. Use typed classes to build XML.\n\nIncompatible:\n<TargetFramework>net472</TargetFramework>\n→ Must build CSIO XML as raw strings/templates. 2-3x more work.',
    tilesInto: 'Phase 4 effort estimate. This 1-hour check determines whether Phase 4 takes 5 days or 18 days.'
  },

  p0_15: {
    what: 'Set up developer authentication for NuGet private feed and Azure Service Bus.',
    why: 'The Rating Platform references private NuGet packages from Rival\'s internal feed. Without a Personal Access Token (PAT), NuGet restore fails with 401 Unauthorized. Similarly, services that connect to Service Bus using DefaultAzureCredential need Azure RBAC roles assigned.',
    how: '1. NuGet PAT: Azure DevOps → User Settings → Personal Access Tokens → New Token with Packaging (Read) scope\n2. Service Bus RBAC: az role assignment create --assignee <dev-email> --role "Azure Service Bus Data Sender" --scope <service-bus-resource-id>',
    example: 'Add PAT to NuGet config:\nnuget sources add -name "rivalit" -source "https://pkgs.dev.azure.com/rivalitinc/_packaging/rivalit/nuget/v3/index.json" -username "yourname" -password "<PAT>"\n\nVerify: dotnet restore → should succeed without 401',
    tilesInto: 'Developer setup. Without PATs, developers cannot build the projects locally.'
  },

  /* ═══ PHASE 1: Deployment Pipelines ═══ */

  p1_1: {
    what: 'Create a CI/CD pipeline for Quote Management that builds, containerizes, and deploys automatically.',
    why: 'Currently, ZERO deployment pipelines exist for Rating Platform services. Code changes cannot be deployed without manual Docker builds and kubectl commands. CI/CD enables automated, repeatable deployments.',
    how: 'Create azure-pipelines.yml in the QuoteManagement repo root. Define stages: Build (.NET 9) → Docker Build → Push to ACR → Deploy to Container App.',
    example: 'trigger:\n  branches: [main]\nstages:\n- stage: Build\n  jobs:\n  - job: BuildAndPush\n    steps:\n    - task: DotNetCoreCLI@2\n      inputs: { command: build, projects: \'**/*.csproj\' }\n    - task: Docker@2\n      inputs:\n        command: buildAndPush\n        repository: acrplatformcommonagnostic001.azurecr.io/quotemanagement\n        tags: $(Build.BuildId)\n- stage: Deploy\n  jobs:\n  - job: DeployDev\n    steps:\n    - task: AzureContainerApps@1\n      inputs: { containerAppName: ca-quotemanagement-dev }',
    tilesInto: 'Automated deployment. Without this, every code change requires manual Docker commands.'
  },

  p1_2: { what: 'Create CI/CD pipeline for Rating Orchestrator.', why: 'Same as p1_1 — no pipeline exists.', how: 'Same pattern as QuoteManagement pipeline. Different repo, different Container App name.', example: 'Copy azure-pipelines.yml from QuoteManagement, update:\n- repository: acrplatformcommonagnostic001.azurecr.io/ratingorchestrator\n- containerAppName: ca-ratingorchestrator-dev', tilesInto: 'Orchestrator deployment.' },

  p1_3: { what: 'Create CI/CD pipeline for Carrier Connector.', why: 'Same as p1_1.', how: 'Same pattern.', example: 'Update repository and containerAppName for CarrierConnector.', tilesInto: 'CarrierConnector deployment.' },

  p1_4: { what: 'Create CI/CD pipeline for Schema Cache.', why: 'Lower priority than the three core services. SchemaCache serves form schemas but is not on the critical rating path.', how: 'Same pipeline pattern.', example: 'Update for SchemaCache. Not critical for MVP demo if bundles are already seeded.', tilesInto: 'SchemaCache deployment. Not blocking for MVP if data is pre-seeded.' },

  p1_5: {
    what: 'Create Bicep templates that define Container App infrastructure as code.',
    why: 'Infrastructure-as-Code means you can recreate the entire environment by running one command. This ensures dev and prod are identical and eliminates "works on my machine" deployment issues.',
    how: 'Write Bicep files that define: Container App Environment, individual Container Apps for each service, managed identity assignments, secrets references to Key Vault.',
    example: 'resource containerApp \'Microsoft.App/containerApps@2023-05-01\' = {\n  name: \'ca-quotemanagement-${env}\'\n  location: resourceGroup().location\n  properties: {\n    managedEnvironmentId: containerAppEnv.id\n    configuration: {\n      ingress: { external: true, targetPort: 8080 }\n      secrets: [{ name: \'mongodb-conn\', keyVaultUrl: \'...\' }]\n    }\n    template: {\n      containers: [{\n        name: \'quotemanagement\'\n        image: \'${acrName}.azurecr.io/quotemanagement:${imageTag}\'\n      }]\n    }\n  }\n}',
    tilesInto: 'Repeatable deployments. Run `az deployment group create --template-file main.bicep` to create everything.'
  },

  p1_6: { what: 'Verify every service has a Dockerfile that builds successfully.', why: 'Container Apps require Docker images. If a Dockerfile is missing or broken, the CI/CD pipeline cannot produce a deployable artifact.', how: 'For each repo: docker build -t test . && docker run --rm test dotnet --info', example: 'Expected: each repo has a Dockerfile in the root or project directory.\nTest: docker build -t quotemanagement-test ./Rival.Quoting.API.QuoteManagement/\nExpected output: Successfully built <image-id>', tilesInto: 'CI/CD pipelines. Pipelines call docker build — if it fails, nothing deploys.' },

  p1_7: { what: 'Create a Bicep template for Service Bus queues.', why: 'Queues should be created via infrastructure-as-code so dev/qa/prod environments are identical. Manual queue creation leads to naming mismatches.', how: 'Define queue resources in Bicep with consistent naming: sbq-rating-requests, sbq-rating-jobs, sbq-rating-responses.', example: 'See p0_6 for Bicep example. The queue names become constants shared across all environments.', tilesInto: 'Consistent environments. No more sbq-rating-requests-dev vs sbq-initial-rating-requests confusion.' },

  /* ═══ PHASE 2: Shared Contracts Package ═══ */

  p2_1: {
    what: 'Create a new repo with shared C# classes that all services will reference.',
    why: 'Currently, CdmData.cs exists in 4 different repos with subtle differences (different property names, different types). This causes deserialization failures when services communicate. A shared package means one definition, zero drift.',
    how: 'Create repo: Rival.Rating.Contracts. Add .csproj with netstandard2.0 target. Define classes: CdmData, DynamicFieldValue, CarrierContext, PremiumSummary, QueueNames constants.',
    example: 'public class DynamicFieldValue {\n  public string Kind { get; set; }\n  public string? Raw { get; set; }      // nullable — agreed\n  public decimal? NumberValue { get; set; } // decimal — agreed\n  public bool? BooleanValue { get; set; }\n  public string? DateValue { get; set; }\n}\n\npublic static class QueueNames {\n  public const string RatingRequests = "sbq-rating-requests";\n  public const string RatingJobs = "sbq-rating-jobs";\n  public const string RatingResponses = "sbq-rating-responses";\n}',
    tilesInto: 'All services. Once published, every service references this instead of maintaining its own copy.'
  },

  p2_2: { what: 'Define the message types that flow through Service Bus.', why: 'The Orchestrator sends "carrierTarget" but the Connector expects "carrierContext". A shared message class makes this impossible to mismatch.', how: 'Define RatingRequestMessage, CarrierRatingMessage, RatingResponseMessage with agreed JSON property names.', example: 'public class CarrierRatingMessage {\n  [JsonPropertyName("correlationId")]\n  public string CorrelationId { get; set; }\n  [JsonPropertyName("carrierContext")] // ONE name, forever\n  public CarrierContext CarrierContext { get; set; }\n  [JsonPropertyName("cdmData")]\n  public CdmData CdmData { get; set; }\n}', tilesInto: 'Fixes carrierTarget/carrierContext bug and response format mismatch.' },

  p2_3: { what: 'Publish the shared package to Azure DevOps Artifacts.', why: 'Services install the package via NuGet restore, like any other dependency.', how: 'dotnet pack -c Release\ndotnet nuget push bin/Release/Rival.Rating.Contracts.1.0.0.nupkg --source "rivalit"', example: 'After publishing, any service can reference it:\n<PackageReference Include="Rival.Rating.Contracts" Version="1.0.0" />', tilesInto: 'All service updates (p2_4 through p2_7).' },

  p2_4: { what: 'Update QuoteManagement to use the shared package.', why: 'Delete local CdmData.cs, RatingRequestMessage.cs, RatingResponseMessage.cs. Replace with: using Rival.Rating.Contracts;', how: 'dotnet add package Rival.Rating.Contracts --version 1.0.0\nDelete local model files. Fix using statements. Build.', example: 'Before: using Rival.Quoting.API.QuoteManagement.Models;\nAfter: using Rival.Rating.Contracts.Models;', tilesInto: 'Contract alignment. QuoteManagement now uses the same classes as Orchestrator and Connector.' },

  p2_5: { what: 'Update RatingOrchestrator to use the shared package.', why: 'Same as p2_4.', how: 'Same process. Delete local CDM models.', example: 'Delete: Models/Cdm/DynamicFieldValue.cs, Models/Messages/CarrierRatingMessage.cs\nAdd: using Rival.Rating.Contracts;', tilesInto: 'Contract alignment.' },

  p2_6: { what: 'Update CarrierConnector to use the shared package.', why: 'Same as p2_4.', how: 'Same process.', example: 'Delete: DTOs/CdmData.cs, DTOs/DynamicFieldValue.cs, Models/Messages/RatingRequestMessage.cs\nAdd: using Rival.Rating.Contracts;', tilesInto: 'Contract alignment.' },

  p2_7: { what: 'Update BFF to use the shared package.', why: 'Lower priority — BFF just passes CDM through. But alignment prevents future drift.', how: 'Same process.', example: 'Delete: Models/Quote/CdmData.cs\nAdd: using Rival.Rating.Contracts;', tilesInto: 'Full alignment. Not blocking for MVP.' },

  p2_8: { what: 'Run serialization tests to prove all services produce and consume identical JSON.', why: 'The whole point of shared contracts is that serialized JSON from one service deserializes correctly in another. This test proves it.', how: 'Write a test that serializes a CarrierRatingMessage in "Orchestrator mode" and deserializes in "Connector mode". Verify all fields survive the round-trip.', example: 'var message = new CarrierRatingMessage { CarrierContext = new CarrierContext { CarrierId = "aviva" } };\nvar json = JsonSerializer.Serialize(message);\nvar deserialized = JsonSerializer.Deserialize<CarrierRatingMessage>(json);\nAssert.Equal("aviva", deserialized.CarrierContext.CarrierId); // MUST pass', tilesInto: 'Confidence that contract fixes actually work before integration testing.' },

  /* ═══ PHASE 3: Component Readiness ═══ */

  p3_1: {
    what: 'Set the correct backend URL in the BFF configuration.',
    why: 'The BFF\'s appsettings.json has QuoteManagementApiUrl set to an empty string. Every HTTP call the BFF makes to Quote Management fails because it doesn\'t know where to send requests.',
    how: 'Edit Rival.Platform.BFF/Web.BFF/appsettings.json line 35.\nChange: "QuoteManagementApiUrl": ""\nTo: "QuoteManagementApiUrl": "https://ca-quotemanagement-dev.azurecontainerapps.io"',
    example: 'File: appsettings.json\nBefore: "QuoteManagementApiUrl": ""\nAfter: "QuoteManagementApiUrl": "https://ca-quotemanagement-dev.azurecontainerapps.io"\n\nFor local dev, appsettings.Development.json already has: "https://localhost:7124"',
    tilesInto: 'BFF → QuoteManagement communication. Without this, the frontend cannot create or retrieve quotes.'
  },

  p3_2: {
    what: 'Fix the thread-safety bug in the BFF\'s API key header injection.',
    why: 'The SetApiKeyHeader method (QuoteService.cs:77-88) modifies HttpClient.DefaultRequestHeaders, which is shared across all requests. When multiple brokers submit quotes simultaneously, the Remove/Add operations race against each other, causing intermittent "header already exists" exceptions or missing auth headers.',
    how: 'Instead of modifying DefaultRequestHeaders, create a new HttpRequestMessage per request and set headers on it.',
    example: 'Before (BROKEN):\nprivate void SetApiKeyHeader() {\n  _httpClient.DefaultRequestHeaders.Remove(ApiKeyHeaderName);\n  _httpClient.DefaultRequestHeaders.Add(ApiKeyHeaderName, _key);\n}\n\nAfter (FIXED):\nprivate HttpRequestMessage CreateRequest(HttpMethod method, string url) {\n  var request = new HttpRequestMessage(method, url);\n  request.Headers.Add(ApiKeyHeaderName, _key);\n  return request;\n}',
    tilesInto: 'BFF reliability under concurrent load. Without this fix, multi-user scenarios fail randomly.'
  },

  p3_3: { what: 'Uncomment the Polly resilience policies in BFF Program.cs.', why: 'Polly provides retry, circuit breaker, and timeout policies. These are configured in appsettings.json but the .AddResiliencePolicies() call is commented out at line 19. Without Polly, one slow QuoteManagement response blocks the BFF thread, and transient failures are not retried.', how: 'Uncomment line 19 in Program.cs:\nbuilder.Services.AddHttpClient<QuoteService>()\n  .AddResiliencePolicies(nameof(PollyPolicyOptions), builder.Configuration);', example: 'The Polly config already exists in appsettings.json (lines 41-53):\n"PollyPolicyOptions": {\n  "RetryCount": 3,\n  "CircuitBreakerCount": 5,\n  "TimeoutSeconds": 30\n}', tilesInto: 'BFF reliability. Not critical for MVP demo but important for production.' },

  p3_4: {
    what: 'Fix the Service Bus namespace in QuoteManagement configuration.',
    why: 'QuoteManagement is configured to send messages to sbns-rating-dev-001 (the old namespace). But the Rating Platform uses sbns-ratingplatform-dev-001. Messages are being sent to a namespace that the Orchestrator is not listening on — they vanish into the void.',
    how: 'Edit appsettings.json lines 16 and 23. Change both occurrences.\nFrom: "sbns-rating-dev-001.servicebus.windows.net"\nTo: "sbns-ratingplatform-dev-001.servicebus.windows.net"',
    example: 'File: appsettings.json\n"AzServiceBus": {\n  "FullyQualifiedServiceBusNamespace": "sbns-ratingplatform-dev-001.servicebus.windows.net"\n},\n"RatingServiceBus": {\n  "FullyQualifiedServiceBusNamespace": "sbns-ratingplatform-dev-001.servicebus.windows.net"\n}',
    tilesInto: 'QuoteManagement → Orchestrator message flow. THE most critical config fix.'
  },

  p3_5: { what: 'Fix queue names in QuoteManagement to match the agreed constants.', why: 'QuoteManagement uses sbq-rating-requests-dev but the Orchestrator listens on sbq-rating-requests (or sbq-initial-rating-requests in some configs). Mismatched names mean messages go to one queue but nobody reads from it.', how: 'Update queue names in appsettings.json to match the shared constants defined in Phase 2.', example: 'Before:\n"RequestQueueName": "sbq-rating-requests-dev"\nAfter:\n"RequestQueueName": "sbq-rating-requests"', tilesInto: 'Message routing. Both publisher and consumer must agree on queue names.' },

  p3_6: { what: 'Verify ServiceBusSettings is properly registered in DI.', why: 'The code injects IOptions<RatingServiceBusSettings> but the config section might not match. If DI registration points to the wrong section, the service gets empty settings and cannot connect.', how: 'Verify Program.cs line 28-33: builder.Services.Configure<RatingServiceBusSettings>(builder.Configuration.GetSection("RatingServiceBus")); matches the config section name in appsettings.json.', example: 'Check that the config section names match:\nProgram.cs: GetSection("RatingServiceBus")\nappsettings.json: "RatingServiceBus": { ... }\n→ They must be identical.', tilesInto: 'QuoteManagement Service Bus connectivity.' },

  p3_7: { what: 'Create environment-specific appsettings files.', why: 'Only one appsettings.json exists with hardcoded dev values. Production needs different connection strings, namespaces, and endpoints.', how: 'Create appsettings.Development.json, appsettings.Staging.json, appsettings.Production.json with environment-specific values.', example: 'appsettings.Production.json:\n{\n  "RatingServiceBus": {\n    "FullyQualifiedServiceBusNamespace": "sbns-ratingplatform-prod-001.servicebus.windows.net"\n  }\n}', tilesInto: 'Multi-environment deployment. Not blocking for MVP demo in dev.' },

  p3_8: {
    what: 'Fix the frontend so CarrierTargets is populated instead of null.',
    why: 'Quote.razor.cs line 734 explicitly sets CarrierTargets = null. This means QuoteManagement receives a quote with no carriers specified. Depending on the decision from p0_12, either the frontend sends them or QuoteManagement defaults to all enabled carriers.',
    how: 'Option A (frontend): Populate CarrierTargets from the insuranceCompanies selection in PolicyDetailsStep.\nOption B (backend): QuoteManagement defaults to all carriers from config when null.',
    example: 'Option B (recommended for MVP):\nIn RatingSubmissionService:\nif (request.CarrierTargets == null || !request.CarrierTargets.Any()) {\n  request.CarrierTargets = _enabledCarriers.Select(c => new CarrierTarget { CarrierId = c }).ToList();\n}',
    tilesInto: 'Rating pipeline. Without carrier targets, the Orchestrator has nothing to fan out to.'
  },

  p3_9: { what: 'Verify the Orchestrator receives messages after upstream fixes.', why: 'Once p3_4 and p3_5 are fixed, QuoteManagement will publish to the correct queue. The Orchestrator should pick up these messages and fan them out.', how: 'Submit a test quote, then check: az servicebus queue show --name sbq-rating-requests to see message count. If it increases, QuoteManagement is publishing. If Orchestrator logs show "Message received", it is consuming.', example: 'Log to look for in Orchestrator:\n"Processing rating request: CorrelationId=abc-123, QuoteId=Q-2026-000001"\n\nIf not seen: check queue name match, check Service Bus namespace, check Managed Identity roles.', tilesInto: 'Message flow verification. Critical checkpoint before testing CarrierConnector.' },

  p3_10: { what: 'Fix the CarrierConnector health check.', why: 'RatingHealthCheck.cs line 24 has var isHealthy = true hardcoded. This means Kubernetes/Container Apps thinks the service is healthy even if Service Bus is down.', how: 'Add real checks: ping Service Bus connection, verify Blob Storage accessibility.', example: 'var isHealthy = true;\ntry {\n  await _serviceBusClient.CreateSender("test").CloseAsync();\n} catch {\n  isHealthy = false;\n}', tilesInto: 'Operational reliability. Not blocking for MVP demo but important for production.' },

  p3_11: {
    what: 'Implement async polling in the RPM Client so brokers see rating results.',
    why: 'Currently, GetOffersAsync (QuoteService.cs:197-238) makes a single HTTP call and returns immediately. But carrier rating is async — it takes 5-15 seconds. The broker submits a quote and sees nothing because the results are not ready yet.',
    how: 'Implement a polling loop in Quote.razor.cs that calls GetOffers every 2 seconds until results arrive or timeout (30 seconds).',
    example: 'var timeout = DateTime.Now.AddSeconds(30);\nwhile (DateTime.Now < timeout) {\n  var offers = await _quoteService.GetOffersAsync(quoteId);\n  if (offers?.Data?.Any() == true) {\n    ratingResults = offers.Data;\n    StateHasChanged();\n    break;\n  }\n  await Task.Delay(2000);\n}\nif (!ratingResults.Any()) {\n  ShowTimeout("Rating is taking longer than expected...");\n}',
    tilesInto: 'Broker experience. Without polling, the broker never sees the quote results — they submit and get nothing back.'
  },

  p3_12: { what: 'Verify that SchemaCache has Alberta PersAuto bundle data.', why: 'The RPM Client form is entirely driven by schema bundles fetched from SchemaCache. If no bundle exists for carrierId=aviva, productCode=PersAuto, intent=quote, the form renders with zero fields — the broker cannot enter any data.', how: 'Query SchemaCache API: GET /Schema/GetActiveSchema?carrierId=aviva&productCode=PersAuto&intent=quote. If it returns 404, the bundle needs to be authored and seeded.', example: 'Check with Satish (SchemaCache owner):\n"Is there a seeded bundle for Alberta Personal Auto? If not, what fields does it need?"\n\nRisk: If the bundle needs authoring, this is multi-day effort that could block the MVP.', tilesInto: 'Frontend form rendering. Without schema data, there is no form to fill out.' },

  p3_13: {
    what: 'Fix the JSON property name mismatch between Orchestrator and CarrierConnector.',
    why: 'The Orchestrator sends a message with a "CarrierTarget" JSON property. The CarrierConnector tries to deserialize it as "carrierContext". Because the names differ, CarrierContext is always null — the Connector does not know which carrier to rate for.',
    how: 'Based on decision from p0_12, either rename the Orchestrator property or the Connector property. The shared contracts package (Phase 2) prevents this from ever happening again.',
    example: 'Option A (fix Connector — less risk):\nChange in RatingRequestMessage.cs:\nFrom: [JsonPropertyName("carrierContext")]\nTo: [JsonPropertyName("carrierTarget")]\n\nOption B (fix Orchestrator — cleaner name):\nChange in CarrierRatingMessage.cs:\nFrom: public CarrierTarget CarrierTarget { get; set; }\nTo: [JsonPropertyName("carrierContext")] public CarrierContext CarrierContext { get; set; }',
    tilesInto: 'Carrier identification. Without this fix, every rating request fails because the Connector does not know which carrier the message is for.'
  },

  p3_14: {
    what: 'Fix the response format mismatch between CarrierConnector and QuoteManagement.',
    why: 'CarrierConnector sends a flat response: { carrierId, status, ratingResult }. QuoteManagement expects a nested response: { carrierResult: { carrierId, status, premiumSummary } }. QuoteManagement tries to read message.carrierResult.carrierId, gets null, and silently discards the response. The broker never sees pricing.',
    how: 'Based on decision from p0_12, either update QuoteManagement to accept the flat format or update CarrierConnector to wrap its response.',
    example: 'Option A (fix QuoteManagement — recommended):\nChange the response reader to access properties directly:\nvar carrierId = response.CarrierId;  // flat access\nvar premium = response.RatingResult?.PremiumSummary?.TotalPayable;\n\nInstead of:\nvar carrierId = response.CarrierResult.CarrierId;  // nested access that NPEs',
    tilesInto: 'Response path. Without this fix, carrier prices are calculated but never reach the broker.'
  },

  p3_15: { what: 'Fix Raw property nullability mismatch in DynamicFieldValue.', why: 'QuoteManagement defines Raw as string? (nullable). CarrierConnector defines it as string (non-nullable). When QuoteManagement sends null for Raw, the Connector may throw a deserialization error.', how: 'Make Raw nullable in all copies (or use the shared contracts package where it is defined once).', example: 'Shared contracts approach:\npublic string? Raw { get; set; }  // nullable everywhere', tilesInto: 'Message deserialization. Prevents sporadic null reference exceptions.' },

  p3_16: { what: 'Fix the RatingResponseReader to dead-letter bad messages instead of retrying forever.', why: 'When QuoteManagement receives a response it cannot parse (e.g., malformed JSON), it currently abandons the message. Service Bus retries it. It fails again. Retry again. This loops until max delivery count (10), wasting resources and filling logs.', how: 'On JsonException, dead-letter the message immediately instead of abandoning.', example: 'catch (JsonException ex) {\n  await args.DeadLetterMessageAsync(args.Message,\n    "DeserializationFailed",\n    $"Cannot parse response: {ex.Message}");\n}', tilesInto: 'Operational health. Prevents message queue backup from malformed messages.' },

  p3_17: { what: 'Remove personally identifiable information (PII) from structured logs.', why: 'Current logging includes raw message bodies containing driver names, dates of birth, and addresses. If logs are sent to Application Insights or Log Analytics, this is a privacy violation. Must be fixed before any demo with real data.', how: 'Replace raw message body logging with sanitized summaries: log correlationId, carrierId, quoteId — NOT the CDM field values.', example: 'Before:\n_logger.LogInformation("Processing message: {Body}", messageBody); // LOGS EVERYTHING\n\nAfter:\n_logger.LogInformation("Processing rating: CorrelationId={CorrelationId}, CarrierId={CarrierId}",\n  request.CorrelationId, request.CarrierContext?.CarrierId);', tilesInto: 'Privacy compliance. Not blocking for MVP demo but important before any real data flows.' },

  /* ═══ PHASE 4: CDM-to-CSIO Converter ═══ */

  p4_1: { what: 'Check .NET 9 compatibility of the existing CSIO package.', why: 'This 1-hour check determines whether Phase 4 takes 5 days or 18 days. See p0_14 for full details.', how: 'Same as p0_14.', example: 'Check <TargetFramework> in .csproj file.', tilesInto: 'Effort estimate for all of Phase 4.' },

  p4_2: { what: 'Build the CDM-to-CSIO transformer interface and first implementation.', why: 'This is the core missing piece. Carrier adapters are built but have no XML to send. The transformer takes CDM fields and produces CSIO XML.', how: 'Create ICdmToCsioTransformer with Transform(CdmData, CarrierContext) → string method. Implement AlbertaPersAutoTransformer.', example: 'public interface ICdmToCsioTransformer {\n  string Transform(CdmData cdm, CarrierContext carrier);\n}\n\nThe implementation reads CDM fields like drivers[0].firstName and produces <GivenName>John</GivenName> etc.', tilesInto: 'Real carrier integration. Without this, only the simulator works.' },

  p4_3: { what: 'Map CDM fields to CSIO XML elements using czo-extractor data.', why: 'The czo-extractor plugin already extracted all coverage codes, endorsement mappings, and province-specific rules for 26 carriers. This data tells you exactly which CZO codes to use for Aviva vs Peace Hills.', how: 'Read the Aviva extraction (latest.json and latest-rules.md) from the czo-extractor analyst-kit. Use the coverage code mappings to build the XML.', example: 'From czo-extractor:\nAviva Alberta: endorsement 43RL → csio:43L (V148 Guidewire)\nPeace Hills: uses entirely generic CSIO codes (zero Z-codes)\n\nThis means Peace Hills is simpler to implement first.', tilesInto: 'Carrier-specific XML generation.' },

  p4_4: { what: 'Add CDM fields that carriers need but do not exist yet.', why: 'The real Aviva XML requires: maritalStatus, occupation, vehicleBodyType, winterTires, antiTheft, purchaseDate, etc. These fields do not exist in the CDM today.', how: 'Add new field keys to CdmFieldKeys.cs. Update the SchemaCache bundle to include these fields in the form.', example: 'New CDM field keys:\n"drivers[0].maritalStatus" → <MaritalStatusCd>csio:M</MaritalStatusCd>\n"drivers[0].occupation" → <OccupationDesc>Accountant</OccupationDesc>\n"vehicles[0].bodyType" → <VehBodyTypeCd>csio:SU</VehBodyTypeCd>\n"vehicles[0].winterTires" → <csio:WinterTiresInd>0</csio:WinterTiresInd>', tilesInto: 'Complete XML generation. Without all required fields, carriers reject the quote request.' },

  p4_5: { what: 'Add broker identity to CDM.', why: 'CSIO XML requires Producer/ContractNumber and PlacingOffice — these identify which brokerage is submitting the quote. They are not in the CDM at all today.', how: 'Add new CDM fields: broker.contractNumber, broker.placingOffice. Populate from the logged-in broker\'s profile.', example: '<Producer>\n  <ProducerInfo>\n    <ContractNumber>B004034</ContractNumber>\n    <PlacingOffice>101</PlacingOffice>\n  </ProducerInfo>\n</Producer>', tilesInto: 'Carrier acceptance. Without broker identity, carriers reject the quote.' },

  p4_6: { what: 'Build the CSIO response parser.', why: 'Carriers return CSIO XML with premiums embedded in <CurrentTermAmt> elements. The parser extracts: total premium, per-coverage breakdown, decline reasons, referral messages.', how: 'Parse the response XML, extract <CurrentTermAmt><Amt> values for each <Coverage>.', example: 'Input: <Coverage id="COV-VEH-1-2"><CoverageCd>csio:TPBI</CoverageCd><CurrentTermAmt><Amt>1111.00</Amt></CurrentTermAmt></Coverage>\nOutput: { coverageCode: "TPBI", premium: 1111.00 }', tilesInto: 'Price extraction. Without the parser, the Connector cannot tell QuoteManagement what the carrier quoted.' },

  p4_7: { what: 'Wire the transformer into RatingService, replacing the simulator path.', why: 'Currently RatingService always calls PremiumCalculator (the simulator). After the transformer is built, add a mode toggle: simulator for testing, real for production.', how: 'Add config flag: CarrierConnector.UseSimulator = true/false. When false, call ICdmToCsioTransformer → ICarrierAdapter → ICsioResponseParser.', example: 'if (_config.UseSimulator) {\n  return _premiumCalculator.CalculatePremium(request);\n} else {\n  var xml = _transformer.Transform(request.CdmData, request.CarrierContext);\n  var result = await _adapterFactory.GetAdapter(carrierId).RateAsync(new CsioRequest(xml));\n  return _responseParser.Parse(result);\n}', tilesInto: 'Mode switching. Allows demo with simulator AND production with real carriers.' },

  p4_8: { what: 'Test the transformer output against captured production XML.', why: 'The CarrierConnector test data folder has real Aviva request/response XML captured from the legacy system. Compare your transformer output against this golden reference to verify correctness.', how: 'Generate XML from sample CDM data, diff against the captured XML. Focus on: element names, namespace prefixes, attribute ordering, coverage codes.', example: 'Expected: Your generated XML should match the structure of log-20260218-132236-Request-PersAutoPolicyQuoteInqRq-ABMOD01.Aviva.xml\nKey checks:\n- <ACORD> root with correct namespaces\n- <InsuredOrPrincipal> with name, address, DOB\n- <PersDriver> with license info\n- <PersVeh> with year, make, model, VIN\n- <Coverage> elements with correct csio: codes', tilesInto: 'Confidence. If your XML matches the captured production XML, the carrier will accept it.' },

  /* ═══ PHASE 5: End-to-End Integration ═══ */

  p5_1: { what: 'Obtain sandbox API credentials from a carrier.', why: 'Real carrier APIs require OAuth2 credentials. For Peace Hills: Okta client_id/secret. For Aviva: Auth0 credentials. These must be requested from the carrier and typically take 2-6 weeks.', how: 'File through DevOps using the established carrier onboarding process.', example: 'Already started in p0_13. By the time Phase 5 starts, credentials should be available.', tilesInto: 'Real carrier calls (Tier 2). Not needed for simulator demo (Tier 1).' },

  p5_2: { what: 'Configure network access for carrier API calls.', why: 'Carrier APIs may require IP whitelisting. Azure Container Apps use shared outbound IPs unless a NAT Gateway is configured.', how: 'Provision NAT Gateway on the Container App Environment subnet. Provide the static IP to carriers for whitelisting.', example: 'az network nat gateway create --name nat-ratingplatform-dev\n→ Gives static IP: 20.x.x.x\n→ Send to carrier: "Please whitelist 20.x.x.x for sandbox API access"', tilesInto: 'Network connectivity to carrier APIs. Not needed for simulator demo.' },

  p5_3: { what: 'Submit a test quote and verify CDM arrives at BFF.', why: 'First integration checkpoint. Proves the frontend creates CDM correctly and the BFF receives it.', how: 'Fill out the quote form in RPM Client. Check BFF logs for the incoming request.', example: 'Expected log: "QuoteService.CreateQuote() -> Calling https://ca-quotemanagement-dev... with CDM data"\nIf not seen: check BFF URL config (p3_1), check Azure AD auth (p0_4).', tilesInto: 'First hop verified: Browser → BFF.' },

  p5_4: { what: 'Verify BFF forwards to QuoteManagement and quote is stored.', why: 'Second checkpoint. Proves BFF→QuoteManagement HTTP call works and data persists.', how: 'Check QuoteManagement logs for "Quote created". Query Cosmos DB for the quote document.', example: 'az cosmosdb mongodb collection find --db Quoting --collection quoteWip --query \'{"quoteId": "Q-2026-000001"}\'\n→ Should return the CDM data.', tilesInto: 'Second hop: BFF → QuoteManagement → Database.' },

  p5_5: { what: 'Verify QuoteManagement publishes to the correct Service Bus queue.', why: 'Third checkpoint. Proves messages leave QuoteManagement and enter the queue.', how: 'Check queue metrics: az servicebus queue show --name sbq-rating-requests → active message count should increase.', example: 'az servicebus queue show --namespace-name sbns-ratingplatform-dev-001 --name sbq-rating-requests --query "countDetails.activeMessageCount"', tilesInto: 'Third hop: QuoteManagement → Service Bus.' },

  p5_6: { what: 'Verify Orchestrator fans out per carrier.', why: 'Fourth checkpoint. Proves the Orchestrator reads from sbq-rating-requests and writes N messages to sbq-rating-jobs.', how: 'Check Orchestrator logs for "Routed to carrier: aviva" etc. Check sbq-rating-jobs queue count.', example: 'Expected logs:\n"Processing rating request: CorrelationId=abc-123"\n"Routed carrier: aviva"\n"Routed carrier: peacehills"\n\nsbq-rating-jobs active count should be 2 (one per carrier).', tilesInto: 'Fourth hop: Orchestrator → rating-jobs queue.' },

  p5_7: { what: 'Verify CarrierConnector processes the message.', why: 'Fifth checkpoint. The Connector picks up a per-carrier message, runs the simulator (or real converter in Tier 2), and produces a rating response.', how: 'Check Connector logs for "Rating calculation started" and "Rating calculation completed".', example: 'Tier 1 (simulator): "Calculated premium: $4,844.00 for aviva (SIMULATED_RATING)"\nTier 2 (real): "Sent CSIO XML to Aviva API, received response: Rated, $4,844.00"', tilesInto: 'Fifth hop: CarrierConnector processes rating.' },

  p5_8: { what: 'Verify the full response path back to the browser.', why: 'Final checkpoint. Price flows from Connector → response queue → QuoteManagement → BFF → RPM Client.', how: 'Check: sbq-rating-responses queue (message arrives), QuoteManagement logs (response stored), RPM Client UI (price displayed).', example: 'Broker sees:\n┌─────────────────────────────────┐\n│  Quote Results                  │\n│  Aviva:       $4,844.00         │\n│  Peace Hills: $3,200.00         │\n│  Status: Rated                  │\n└─────────────────────────────────┘', tilesInto: 'Complete pipeline. Data has traveled from browser to carrier and back.' },

  p5_9: { what: 'Celebrate.', why: 'You just got an insurance quote flowing through a distributed system with message queues, multiple carriers, and async processing. This is the foundation of the Rating Platform.', how: 'Screenshot the results. Send to Fabrizio. Schedule the demo.', example: 'Screenshot of broker seeing prices from multiple carriers, with Application Insights showing the full distributed trace from submission to response.', tilesInto: 'Business value. This is what we present to the business.' }
};
