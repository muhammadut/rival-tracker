/**
 * Rival Rating Platform - Architecture Explorer Data
 * Drives the Cytoscape.js interactive architecture visualization.
 *
 * Generated: 2026-03-26
 */

window.ARCH_DATA = {

  // ──────────────────────────────────────────────
  // NODES (Cytoscape compound-node model)
  // ──────────────────────────────────────────────
  nodes: [

    // ── L0 Groups ──────────────────────────────
    { data: { id: 'rpm',             label: 'RPM Platform',          level: 0, type: 'group' } },
    { data: { id: 'rating_platform', label: 'Rating Platform',       level: 0, type: 'group' } },
    { data: { id: 'external',        label: 'External Systems',      level: 0, type: 'group' } },
    { data: { id: 'data_infra',      label: 'Data & Infrastructure', level: 0, type: 'group' } },

    // ── L1 Services inside RPM ─────────────────
    { data: { id: 'rpm_client',      label: 'RPM Client (Blazor)',   parent: 'rpm', level: 1, type: 'webapp',  repo: 'Rival.Platform.Web' } },
    { data: { id: 'bff',             label: 'Web BFF',               parent: 'rpm', level: 1, type: 'api',     repo: 'Rival.Platform.BFF' } },
    { data: { id: 'quote_mgmt',      label: 'Quote Management',      parent: 'rpm', level: 1, type: 'api',     repo: 'Rival.Quoting.API.QuoteManagement' } },
    { data: { id: 'platform_config', label: 'Platform Config',       parent: 'rpm', level: 1, type: 'api',     repo: 'Rival.Platform.API.Configuration' } },

    // ── L1 Services inside Rating Platform ─────
    { data: { id: 'apim',              label: 'APIM Gateway',          parent: 'rating_platform', level: 1, type: 'gateway' } },
    { data: { id: 'service_bus',       label: 'Azure Service Bus',     parent: 'rating_platform', level: 1, type: 'queue' } },
    { data: { id: 'orchestrator',      label: 'Rating Orchestrator',   parent: 'rating_platform', level: 1, type: 'worker',  repo: 'Rival.Rating.API.RatingOrchestrator' } },
    { data: { id: 'carrier_connector', label: 'Carrier Connector',     parent: 'rating_platform', level: 1, type: 'api',     repo: 'Rival.Rating.API.CarrierConnector' } },
    { data: { id: 'manufacture',       label: 'Manufactured Rating',   parent: 'rating_platform', level: 1, type: 'api',     repo: 'Rival.Rating.API.Manufacture' } },
    { data: { id: 'schema_cache',      label: 'Schema Cache',          parent: 'rating_platform', level: 1, type: 'api',     repo: 'Rival.Quoting.API.SchemaCache' } },

    // ── L1 Nodes inside External ───────────────
    { data: { id: 'aviva',          label: 'Aviva',            parent: 'external', level: 1, type: 'carrier' } },
    { data: { id: 'sgi',            label: 'SGI',              parent: 'external', level: 1, type: 'carrier' } },
    { data: { id: 'peace_hills',    label: 'Peace Hills',      parent: 'external', level: 1, type: 'carrier' } },
    { data: { id: 'third_party_api', label: 'Third Party API', parent: 'external', level: 1, type: 'external_api' } },

    // ── L1 Nodes inside Data & Infrastructure ──
    { data: { id: 'cosmos_db',     label: 'CosmosDB (MongoDB)', parent: 'data_infra', level: 1, type: 'database' } },
    { data: { id: 'azure_sql',     label: 'Azure SQL',          parent: 'data_infra', level: 1, type: 'database' } },
    { data: { id: 'blob_storage',  label: 'Blob Storage',       parent: 'data_infra', level: 1, type: 'storage' } },
    { data: { id: 'key_vault',     label: 'Key Vault',          parent: 'data_infra', level: 1, type: 'security' } },
    { data: { id: 'data_estate',   label: 'Data Estate',        parent: 'data_infra', level: 1, type: 'analytics' } },

    // ── L2 Components inside quote_mgmt ────────
    { data: { id: 'qm_controller',   label: 'QuotesController',        parent: 'quote_mgmt', level: 2, type: 'controller' } },
    { data: { id: 'qm_service',      label: 'QuoteService',            parent: 'quote_mgmt', level: 2, type: 'service' } },
    { data: { id: 'qm_rating_sub',   label: 'RatingSubmissionService', parent: 'quote_mgmt', level: 2, type: 'service' } },
    { data: { id: 'qm_mongo_repo',   label: 'QuoteRepository (MongoDB)', parent: 'quote_mgmt', level: 2, type: 'repository' } },
    { data: { id: 'qm_sb_publisher', label: 'ServiceBus Publisher',    parent: 'quote_mgmt', level: 2, type: 'publisher' } },

    // ── L2 Components inside orchestrator ──────
    { data: { id: 'orch_consumer',  label: 'RatingOrchestratorService', parent: 'orchestrator', level: 2, type: 'worker' } },
    { data: { id: 'orch_processor', label: 'MessageProcessor',          parent: 'orchestrator', level: 2, type: 'service' } },
    { data: { id: 'orch_response',  label: 'ResponseProcessorService',  parent: 'orchestrator', level: 2, type: 'worker' } },
    { data: { id: 'orch_storage',   label: 'StorageService',            parent: 'orchestrator', level: 2, type: 'service' } },
    { data: { id: 'orch_sb_pub',    label: 'ServiceBusPublisher',       parent: 'orchestrator', level: 2, type: 'publisher' } },
    { data: { id: 'orch_validator', label: 'MessageValidator',          parent: 'orchestrator', level: 2, type: 'service' } },

    // ── L2 Components inside carrier_connector ─
    { data: { id: 'cc_consumer',     label: 'CarrierRatingConsumer',              parent: 'carrier_connector', level: 2, type: 'worker' } },
    { data: { id: 'cc_rating_svc',   label: 'RatingService',                      parent: 'carrier_connector', level: 2, type: 'service' } },
    { data: { id: 'cc_aviva_adapter', label: 'AvivaAdapter (REST+OAuth2)',        parent: 'carrier_connector', level: 2, type: 'adapter' } },
    { data: { id: 'cc_sgi_adapter',  label: 'SgiAdapter (SOAP+OAuth2)',           parent: 'carrier_connector', level: 2, type: 'adapter' } },
    { data: { id: 'cc_ph_adapter',   label: 'PeaceHillsAdapter (API Key)',        parent: 'carrier_connector', level: 2, type: 'adapter' } },
    { data: { id: 'cc_premium_calc', label: 'PremiumCalculator (Simulator)',      parent: 'carrier_connector', level: 2, type: 'engine' } },
    { data: { id: 'cc_validators',   label: 'FluentValidation (11 validators)',  parent: 'carrier_connector', level: 2, type: 'validator' } },

    // ── L2 Components inside schema_cache ──────
    { data: { id: 'sc_controller',  label: 'SchemaController',        parent: 'schema_cache', level: 2, type: 'controller' } },
    { data: { id: 'sc_sync_ctrl',   label: 'InternalSyncController',  parent: 'schema_cache', level: 2, type: 'controller' } },
    { data: { id: 'sc_service',     label: 'SchemaService',           parent: 'schema_cache', level: 2, type: 'service' } },
    { data: { id: 'sc_mongo_repo',  label: 'SchemaCacheRepository',   parent: 'schema_cache', level: 2, type: 'repository' } },
    { data: { id: 'sc_sb_consumer', label: 'SchemaUpdateConsumer',    parent: 'schema_cache', level: 2, type: 'consumer' } }
  ],

  // ──────────────────────────────────────────────
  // EDGES
  // ──────────────────────────────────────────────
  edges: [

    // ── L0 edges (between groups) ──────────────
    { data: { id: 'e_rpm_rp',        source: 'rpm',             target: 'rating_platform', label: 'Quote Requests / Responses',   level: 0 } },
    { data: { id: 'e_rp_ext',        source: 'rating_platform', target: 'external',        label: 'CSIO XML Rating Requests',     level: 0 } },
    { data: { id: 'e_ext_rp',        source: 'external',        target: 'rating_platform', label: 'Rating Responses',             level: 0 } },
    { data: { id: 'e_rp_di',         source: 'rating_platform', target: 'data_infra',      label: 'Store/Retrieve Data',          level: 0 } },
    { data: { id: 'e_rpm_di',        source: 'rpm',             target: 'data_infra',      label: 'Config & Auth',                level: 0 } },

    // ── L1 edges (between services) ────────────
    { data: { id: 'e_client_bff',    source: 'rpm_client',      target: 'bff',              label: 'HTTP (all API calls)',                              level: 1 } },
    { data: { id: 'e_bff_qm',        source: 'bff',             target: 'quote_mgmt',       label: 'HTTP: /api/quotes/*',                               level: 1 } },
    { data: { id: 'e_bff_config',    source: 'bff',             target: 'platform_config',  label: 'HTTP: /api/config',                                 level: 1 } },
    { data: { id: 'e_qm_sb',         source: 'quote_mgmt',      target: 'service_bus',      label: 'Publish: RatingRequest',                            level: 1 } },
    { data: { id: 'e_qm_cosmos',     source: 'quote_mgmt',      target: 'cosmos_db',        label: 'Store: Quote records',                              level: 1 } },
    { data: { id: 'e_sb_orch',       source: 'service_bus',     target: 'orchestrator',     label: 'Consume: initial-rating-requests',                  level: 1 } },
    { data: { id: 'e_orch_blob',     source: 'orchestrator',    target: 'blob_storage',     label: 'Store: Request copy',                               level: 1 } },
    { data: { id: 'e_orch_sb',       source: 'orchestrator',    target: 'service_bus',      label: 'Publish: CarrierRatingMessage to rating-jobs',      level: 1 } },
    { data: { id: 'e_sb_cc',         source: 'service_bus',     target: 'carrier_connector', label: 'Consume: rating-jobs',                             level: 1 } },
    { data: { id: 'e_cc_aviva',      source: 'carrier_connector', target: 'aviva',           label: 'REST+OAuth2: CSIO XML',                            level: 1 } },
    { data: { id: 'e_cc_sgi',        source: 'carrier_connector', target: 'sgi',             label: 'SOAP+OAuth2: CSIO XML',                            level: 1 } },
    { data: { id: 'e_cc_ph',         source: 'carrier_connector', target: 'peace_hills',     label: 'REST+API Key: CSIO XML',                           level: 1 } },
    { data: { id: 'e_cc_sb',         source: 'carrier_connector', target: 'service_bus',     label: 'Publish: RatingResponse to rating-responses',      level: 1 } },
    { data: { id: 'e_cc_blob',       source: 'carrier_connector', target: 'blob_storage',    label: 'Store: XML request/response',                      level: 1 } },
    { data: { id: 'e_sb_orch_resp',  source: 'service_bus',     target: 'orchestrator',     label: 'Consume: rating-responses',                        level: 1, flowType: 'response' } },
    { data: { id: 'e_orch_qm',       source: 'orchestrator',    target: 'quote_mgmt',       label: 'HTTP: Update quote with results',                  level: 1, flowType: 'response' } },
    { data: { id: 'e_sc_cosmos',     source: 'schema_cache',    target: 'cosmos_db',        label: 'Store/Retrieve: Schema bundles',                   level: 1 } },
    { data: { id: 'e_sc_sql',        source: 'schema_cache',    target: 'azure_sql',        label: 'Read: Rating rules',                               level: 1 } },
    { data: { id: 'e_qm_sc',         source: 'quote_mgmt',      target: 'schema_cache',     label: 'HTTP: Resolve carrier bundles',                    level: 1 } },
    { data: { id: 'e_apim_sb',       source: 'apim',            target: 'service_bus',      label: 'Forward authenticated requests',                   level: 1 } },
    { data: { id: 'e_tpa_apim',      source: 'third_party_api', target: 'apim',             label: 'External rating requests',                         level: 1 } },
    { data: { id: 'e_bff_apim',      source: 'bff',             target: 'apim',             label: 'HTTP: APIM subscription key',                      level: 1 } },

    // ── L2 edges (inside quote_mgmt) ───────────
    { data: { id: 'e_qm_ctrl_svc',   source: 'qm_controller',  target: 'qm_service',       label: 'Method call',        level: 2 } },
    { data: { id: 'e_qm_svc_repo',   source: 'qm_service',     target: 'qm_mongo_repo',    label: 'Save/Update quote',  level: 2 } },
    { data: { id: 'e_qm_svc_sub',    source: 'qm_service',     target: 'qm_rating_sub',    label: 'Submit for rating',  level: 2 } },
    { data: { id: 'e_qm_sub_pub',    source: 'qm_rating_sub',  target: 'qm_sb_publisher',  label: 'Publish message',    level: 2 } },

    // ── L2 edges (inside orchestrator) ─────────
    { data: { id: 'e_orch_con_proc',  source: 'orch_consumer',  target: 'orch_processor',   label: 'Process message',    level: 2 } },
    { data: { id: 'e_orch_proc_val',  source: 'orch_processor', target: 'orch_validator',   label: 'Validate',           level: 2 } },
    { data: { id: 'e_orch_proc_stor', source: 'orch_processor', target: 'orch_storage',     label: 'Store to blob',      level: 2 } },
    { data: { id: 'e_orch_proc_pub',  source: 'orch_processor', target: 'orch_sb_pub',      label: 'Fan out to carriers', level: 2 } },
    { data: { id: 'e_orch_resp_stor', source: 'orch_response',  target: 'orch_storage',     label: 'Store response',     level: 2 } },

    // ── L2 edges (inside carrier_connector) ────
    { data: { id: 'e_cc_con_svc',    source: 'cc_consumer',     target: 'cc_rating_svc',    label: 'Process rating job',   level: 2 } },
    { data: { id: 'e_cc_svc_aviva',  source: 'cc_rating_svc',   target: 'cc_aviva_adapter', label: 'Aviva requests',       level: 2 } },
    { data: { id: 'e_cc_svc_sgi',    source: 'cc_rating_svc',   target: 'cc_sgi_adapter',   label: 'SGI requests',         level: 2 } },
    { data: { id: 'e_cc_svc_ph',     source: 'cc_rating_svc',   target: 'cc_ph_adapter',    label: 'Peace Hills requests', level: 2 } },
    { data: { id: 'e_cc_svc_calc',   source: 'cc_rating_svc',   target: 'cc_premium_calc',  label: 'Calculate premiums',   level: 2 } },
    { data: { id: 'e_cc_svc_val',    source: 'cc_rating_svc',   target: 'cc_validators',    label: 'Validate CDM data',    level: 2 } }
  ],

  // ──────────────────────────────────────────────
  // FLOWS (predefined request-flow animations)
  // ──────────────────────────────────────────────
  flows: [
    {
      id: 'quote_submission',
      name: 'Quote Submission',
      description: 'End-to-end flow when a broker submits a quote through RPM Client, all the way to carrier rating and response.',
      steps: [
        { seq: 1, source: 'rpm_client',        target: 'bff',              edgeId: 'e_client_bff',   title: 'Broker submits quote form',   detail: 'HTTP POST with QuoteFormData' },
        { seq: 2, source: 'bff',               target: 'quote_mgmt',       edgeId: 'e_bff_qm',      title: 'Forward to Quote Management', detail: 'HTTP POST /api/quotes with CreateQuoteRequest + APIM subscription key' },
        { seq: 3, source: 'quote_mgmt',        target: 'cosmos_db',        edgeId: 'e_qm_cosmos',    title: 'Save quote record',           detail: 'MongoDB insert' },
        { seq: 4, source: 'quote_mgmt',        target: 'schema_cache',     edgeId: 'e_qm_sc',       title: 'Resolve carrier bundles',      detail: 'HTTP GET carrier bundle configs' },
        { seq: 5, source: 'quote_mgmt',        target: 'service_bus',      edgeId: 'e_qm_sb',       title: 'Submit for rating',            detail: 'Publish RatingRequest to initial-rating-requests queue' },
        { seq: 6, source: 'orchestrator',       target: 'blob_storage',     edgeId: 'e_orch_blob',    title: 'Archive request',              detail: 'Store JSON to blob storage' },
        { seq: 7, source: 'orchestrator',       target: 'service_bus',      edgeId: 'e_orch_sb',      title: 'Fan out to carriers',          detail: 'Publish CarrierRatingMessage per carrier to rating-jobs queue' },
        { seq: 8, source: 'carrier_connector',  target: 'aviva',            edgeId: 'e_cc_aviva',     title: 'Rate with carrier',            detail: 'CSIO XML via REST/SOAP to Aviva/SGI/PeaceHills' },
        { seq: 9, source: 'carrier_connector',  target: 'service_bus',      edgeId: 'e_cc_sb',        title: 'Return results',               detail: 'Publish RatingResponse to rating-responses queue' }
      ]
    },
    {
      id: 'direct_carrier_rating',
      name: 'Direct Rating (Carrier)',
      description: 'Detailed flow within the Carrier Connector when it picks up a rating job, validates, sends to the carrier, and publishes the result.',
      steps: [
        { seq: 1, source: 'service_bus',       target: 'carrier_connector', edgeId: 'e_sb_cc',       title: 'Pick up rating job',   detail: 'Consume from rating-jobs queue' },
        { seq: 2, source: 'cc_consumer',        target: 'cc_rating_svc',    edgeId: 'e_cc_con_svc',  title: 'Validate CDM data',    detail: '11 FluentValidation validators' },
        { seq: 3, source: 'carrier_connector',  target: 'aviva',            edgeId: 'e_cc_aviva',    title: 'Send to carrier',      detail: 'REST+OAuth2, CSIO 1.48 XML' },
        { seq: 4, source: 'aviva',              target: 'carrier_connector', edgeId: null,            title: 'Receive response',     detail: 'Rating response XML' },
        { seq: 5, source: 'carrier_connector',  target: 'blob_storage',     edgeId: 'e_cc_blob',     title: 'Archive XML',          detail: 'Store request + response XML' },
        { seq: 6, source: 'carrier_connector',  target: 'service_bus',      edgeId: 'e_cc_sb',       title: 'Publish result',       detail: 'RatingResponse to rating-responses queue' }
      ]
    }
  ],

  // ──────────────────────────────────────────────
  // STATUS (deployment readiness per L1 service)
  // ──────────────────────────────────────────────
  status: {
    rpm_client:        { code: 'functional', deployed: true,  ciPipeline: true,  owner: 'Luke Ahrens-Townsend',       lastCommit: '2026-03-25', commits: 'Active daily',    blocker: null },
    bff:               { code: 'functional', deployed: true,  ciPipeline: true,  owner: 'Team',                       lastCommit: '2026-03-23', commits: 'Active',          blocker: null },
    quote_mgmt:        { code: 'functional', deployed: false, ciPipeline: true,  owner: 'Mehul Dumasia',              lastCommit: '2026-02-10', commits: '20 total',        blocker: 'CI pushes to wrong ACR. BFF QuoteManagementApiUrl empty in prod config.' },
    platform_config:   { code: 'functional', deployed: true,  ciPipeline: true,  owner: 'Team',                       lastCommit: 'Sparse',     commits: '5 in 6 months',   blocker: null },
    apim:              { code: 'not_built',  deployed: false, ciPipeline: false, owner: 'DevOps (Philip West)',       lastCommit: 'N/A',        commits: 'N/A',             blocker: 'Not provisioned in infrastructure. Critical missing component.' },
    service_bus:       { code: 'infra_only', deployed: true,  ciPipeline: false, owner: 'Philip West',               lastCommit: '2026-03-20', commits: 'N/A',             blocker: 'Queues defined (initial-rating-requests, rating-jobs, rating-responses). Schema SB removed from dev.' },
    orchestrator:      { code: 'functional', deployed: false, ciPipeline: false, owner: 'Bhoomika Jodhani',          lastCommit: '2026-03-24', commits: '15 total',        blocker: 'No CI pipeline to build Docker image. No CD pipeline.' },
    carrier_connector: { code: 'functional', deployed: false, ciPipeline: false, owner: 'Bhavesh Patel / Philip West', lastCommit: '2026-03-24', commits: '19 total',      blocker: 'No CI pipeline. PremiumCalculator is simulator mode. Bhavesh on leave.' },
    manufacture:       { code: 'empty',      deployed: false, ciPipeline: false, owner: 'Nobody',                    lastCommit: '2026-01-28', commits: '2 (infra only)',   blocker: 'Zero application code. Only Terraform scaffolding exists. No owner assigned.' },
    schema_cache:      { code: 'functional', deployed: false, ciPipeline: true,  owner: 'Satish Natarajan',          lastCommit: '2026-01-29', commits: '12 total',        blocker: 'CI pushes to wrong ACR. Wired to old platform infrastructure.' }
  },

  // ──────────────────────────────────────────────
  // META (side-panel detail per node)
  // ──────────────────────────────────────────────
  meta: {

    // ── L0 Groups ──────────────────────────────

    rpm: {
      description: 'The frontend ecosystem powering the Rival Platform Management suite. Includes the Blazor WebAssembly client, Backend-for-Frontend API, Quote Management API, and Platform Configuration API.',
      tech: ['Blazor WASM', '.NET 8', 'Azure App Service'],
      team: 'RPM Platform Team'
    },

    rating_platform: {
      description: 'The backend asynchronous rating engine. Receives quote requests, fans them out to multiple insurance carriers via Service Bus, and aggregates responses.',
      tech: ['.NET 8', 'Azure Service Bus', 'Docker', 'Azure Container Apps'],
      team: 'Rating Platform Team'
    },

    external: {
      description: 'Third-party insurance carriers and external APIs that the platform integrates with for real-time rating.',
      tech: ['CSIO XML 1.48', 'REST', 'SOAP', 'OAuth2'],
      team: 'External'
    },

    data_infra: {
      description: 'Shared data and infrastructure services including databases, blob storage, secrets management, and analytics.',
      tech: ['Azure CosmosDB', 'Azure SQL', 'Azure Blob Storage', 'Azure Key Vault'],
      team: 'DevOps / Infrastructure'
    },

    // ── L1 Services ────────────────────────────

    rpm_client: {
      description: 'Blazor WebAssembly single-page application that provides the broker-facing UI for quote creation, management, and submission. All API calls are proxied through the Web BFF.',
      repo: 'Rival.Platform.Web',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Platform.Web',
      tech: ['Blazor WASM', '.NET 8', 'MudBlazor', 'MSAL.js'],
      azure: { resource: 'Container App', name: 'ca-rpmclient-dev-001', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [],
      owner: 'Luke Ahrens-Townsend',
      team: 'RPM Platform Team',
      lastCommit: '2026-03-25',
      contributors: ['Luke Ahrens-Townsend', 'Mehul Dumasia', 'Satish Natarajan']
    },

    bff: {
      description: 'Backend-for-Frontend API that aggregates calls to downstream microservices. Acts as the single entry point for the Blazor client, handling authentication passthrough and request routing.',
      repo: 'Rival.Platform.BFF',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Platform.BFF',
      tech: ['.NET 8', 'ASP.NET Core', 'YARP Reverse Proxy', 'Azure AD B2C'],
      azure: { resource: 'Container App', name: 'ca-platformwebbff-dev-002', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [
        'GET/POST /api/quotes/* (proxied to Quote Management)',
        'GET /api/config (proxied to Platform Config)',
        'POST /api/rating/* (proxied via APIM)'
      ],
      owner: 'Team',
      team: 'RPM Platform Team',
      lastCommit: '2026-03-23',
      contributors: ['Luke Ahrens-Townsend', 'Mehul Dumasia']
    },

    quote_mgmt: {
      description: 'Core quote management service. Handles CRUD for quotes, resolves carrier schemas from SchemaCache, and publishes rating requests to Service Bus for asynchronous processing.',
      repo: 'Rival.Quoting.API.QuoteManagement',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Quoting.API.QuoteManagement',
      tech: ['.NET 8', 'ASP.NET Core', 'MongoDB Driver', 'Azure.Messaging.ServiceBus', 'MediatR'],
      azure: { resource: 'Container App', name: 'ca-quotemanagement-dev-002', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [
        'POST /api/quotes - Create a new quote',
        'GET /api/quotes/{id} - Retrieve quote by ID',
        'PUT /api/quotes/{id} - Update quote',
        'POST /api/quotes/{id}/submit - Submit quote for rating',
        'PUT /api/quotes/{id}/rating-result - Update with rating results (called by orchestrator)'
      ],
      owner: 'Mehul Dumasia',
      team: 'RPM Platform Team',
      lastCommit: '2026-02-10',
      contributors: ['Mehul Dumasia', 'Satish Natarajan']
    },

    platform_config: {
      description: 'Configuration API serving platform-wide settings, feature flags, and lookup data used by the RPM Client and other services.',
      repo: 'Rival.Platform.API.Configuration',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Platform.API.Configuration',
      tech: ['.NET 8', 'ASP.NET Core', 'Azure App Configuration'],
      azure: { resource: 'Container App', name: 'ca-platformconfig-dev-001', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [
        'GET /api/config - Retrieve platform configuration',
        'GET /api/config/features - Feature flags'
      ],
      owner: 'Team',
      team: 'RPM Platform Team',
      lastCommit: 'Sparse',
      contributors: ['Luke Ahrens-Townsend']
    },

    apim: {
      description: 'Azure API Management gateway intended to front all external and internal API traffic. Provides subscription-key authentication, rate limiting, and request routing. Currently NOT provisioned.',
      repo: null,
      repoUrl: null,
      tech: ['Azure API Management'],
      azure: { resource: 'API Management', name: 'apim-ratingplatform-dev-001', sku: 'Developer', region: 'Canada Central' },
      endpoints: [],
      owner: 'DevOps (Philip West)',
      team: 'DevOps',
      lastCommit: 'N/A',
      contributors: []
    },

    service_bus: {
      description: 'Azure Service Bus namespace providing asynchronous messaging between platform services. Three primary queues: initial-rating-requests, rating-jobs, and rating-responses.',
      repo: null,
      repoUrl: null,
      tech: ['Azure Service Bus', 'Standard Tier'],
      azure: { resource: 'Service Bus', name: 'sbns-ratingplatform-dev-001', sku: 'Standard', region: 'Canada Central' },
      endpoints: [],
      owner: 'Philip West',
      team: 'DevOps',
      lastCommit: '2026-03-20',
      contributors: ['Philip West'],
      queues: [
        { name: 'initial-rating-requests', publisher: 'quote_mgmt', consumer: 'orchestrator' },
        { name: 'rating-jobs', publisher: 'orchestrator', consumer: 'carrier_connector' },
        { name: 'rating-responses', publisher: 'carrier_connector', consumer: 'orchestrator' }
      ]
    },

    orchestrator: {
      description: 'Background worker service that consumes rating requests from Service Bus, archives them to Blob Storage, fans out per-carrier messages to the rating-jobs queue, and aggregates responses back to Quote Management.',
      repo: 'Rival.Rating.API.RatingOrchestrator',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Rating.API.RatingOrchestrator',
      tech: ['.NET 8', 'Worker Service', 'Azure.Messaging.ServiceBus', 'Azure.Storage.Blobs', 'Docker'],
      azure: { resource: 'Container App', name: 'ca-ratingorchestrator-dev-001', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [
        'Health: /health',
        'No HTTP API endpoints - consumes Service Bus messages'
      ],
      owner: 'Bhoomika Jodhani',
      team: 'Rating Platform Team',
      lastCommit: '2026-03-24',
      contributors: ['Bhoomika Jodhani', 'Philip West']
    },

    carrier_connector: {
      description: 'Service that handles direct communication with insurance carriers. Consumes rating-jobs from Service Bus, validates CDM data, transforms to CSIO XML, sends to carriers via REST/SOAP, and publishes responses. Includes adapter pattern for each carrier.',
      repo: 'Rival.Rating.API.CarrierConnector',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Rating.API.CarrierConnector',
      tech: ['.NET 8', 'Worker Service', 'FluentValidation', 'Azure.Messaging.ServiceBus', 'Azure.Storage.Blobs', 'Docker', 'CSIO XML 1.48'],
      azure: { resource: 'Container App', name: 'ca-carrierconnector-dev-001', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [
        'Health: /health',
        'No HTTP API endpoints - consumes Service Bus messages'
      ],
      owner: 'Bhavesh Patel / Philip West',
      team: 'Rating Platform Team',
      lastCommit: '2026-03-24',
      contributors: ['Bhavesh Patel', 'Philip West', 'Bhoomika Jodhani']
    },

    manufacture: {
      description: 'Intended as the manufactured/manual rating engine for carriers not supporting real-time API rating. Currently contains zero application code -- only Terraform infrastructure scaffolding. No owner assigned.',
      repo: 'Rival.Rating.API.Manufacture',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Rating.API.Manufacture',
      tech: ['.NET 8 (scaffolding only)', 'Terraform'],
      azure: { resource: 'Container App', name: 'ca-manufacturedrating-dev-001', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [],
      owner: 'Nobody',
      team: 'Unassigned',
      lastCommit: '2026-01-28',
      contributors: ['Philip West']
    },

    schema_cache: {
      description: 'Caching service for carrier schema bundles. Syncs rating rule definitions from Azure SQL into CosmosDB for fast retrieval. Consumed by Quote Management to resolve which fields and validators apply per carrier.',
      repo: 'Rival.Quoting.API.SchemaCache',
      repoUrl: 'https://dev.azure.com/rivalitinc/Rival%20Insurance%20Technology/_git/Rival.Quoting.API.SchemaCache',
      tech: ['.NET 8', 'ASP.NET Core', 'MongoDB Driver', 'Entity Framework Core', 'Azure.Messaging.ServiceBus'],
      azure: { resource: 'Container App', name: 'ca-centralschema-dev-001', sku: 'Consumption', region: 'Canada Central' },
      endpoints: [
        'GET /api/schemas/{carrierId} - Get schema bundle for carrier',
        'GET /api/schemas/{carrierId}/fields - Get field definitions',
        'POST /internal/sync - Trigger manual schema sync'
      ],
      owner: 'Satish Natarajan',
      team: 'Rating Platform Team',
      lastCommit: '2026-01-29',
      contributors: ['Satish Natarajan', 'Mehul Dumasia']
    },

    aviva: {
      description: 'Aviva Canada -- major insurance carrier. Integration uses REST API with OAuth2 authentication, sending CSIO 1.48 XML rating requests.',
      tech: ['REST API', 'OAuth2', 'CSIO XML 1.48'],
      team: 'External Carrier'
    },

    sgi: {
      description: 'Saskatchewan Government Insurance -- provincial carrier. Integration uses SOAP web service with OAuth2 authentication, sending CSIO 1.48 XML rating requests.',
      tech: ['SOAP', 'OAuth2', 'CSIO XML 1.48'],
      team: 'External Carrier'
    },

    peace_hills: {
      description: 'Peace Hills Insurance -- regional carrier. Integration uses REST API with API Key authentication, sending CSIO 1.48 XML rating requests.',
      tech: ['REST API', 'API Key', 'CSIO XML 1.48'],
      team: 'External Carrier'
    },

    third_party_api: {
      description: 'External third-party consumers that submit rating requests into the platform via APIM. Not yet active as APIM is not provisioned.',
      tech: ['REST', 'APIM Subscription Key'],
      team: 'External'
    },

    cosmos_db: {
      description: 'Azure CosmosDB with MongoDB API used as the primary document store for quotes and schema cache bundles. Shared across Quote Management and Schema Cache services.',
      tech: ['Azure CosmosDB', 'MongoDB API 4.2', 'RU-based throughput'],
      azure: { resource: 'Cosmos DB', name: 'cosdb-quotemanagement-dev-001', sku: 'MongoDB 7.0', region: 'Canada Central' },
      team: 'DevOps',
      collections: ['quotes', 'schema-bundles', 'rating-results']
    },

    azure_sql: {
      description: 'Azure SQL Database storing relational rating rule definitions, carrier configurations, and platform metadata. Source of truth for schema data that gets synced to CosmosDB.',
      tech: ['Azure SQL', 'SQL Server 2022', 'Entity Framework Core'],
      azure: { resource: 'SQL Server', name: 'sqlsrv-ratingplatform-dev-001', sku: 'S0 (10GB)', region: 'Canada Central' },
      team: 'DevOps'
    },

    blob_storage: {
      description: 'Azure Blob Storage used for archiving rating request/response payloads. The orchestrator stores JSON request copies; the carrier connector stores raw CSIO XML exchanges.',
      tech: ['Azure Blob Storage', 'Hot tier'],
      azure: { resource: 'Storage Account', name: 'strvlratingplatformdev1', sku: 'Standard LRS', region: 'Canada Central' },
      team: 'DevOps',
      containers: ['rating-requests', 'rating-responses', 'carrier-xml']
    },

    key_vault: {
      description: 'Azure Key Vault storing secrets, certificates, and connection strings used by all platform services. Includes carrier OAuth2 credentials, Service Bus connection strings, and database keys.',
      tech: ['Azure Key Vault', 'RBAC', 'Managed Identity'],
      azure: { resource: 'Key Vault', name: 'kvratingplatformdev001', sku: 'Standard', region: 'Canada Central' },
      team: 'DevOps'
    },

    data_estate: {
      description: 'Analytics and reporting data platform. Consumes data from operational databases for business intelligence, dashboards, and regulatory reporting.',
      tech: ['Azure Data Factory', 'Azure Synapse', 'Power BI'],
      azure: { resource: 'Synapse + Data Factory', name: 'Various', sku: 'N/A', region: 'Canada Central' },
      team: 'Data Team'
    },

    // ── L2 Components ──────────────────────────

    // Quote Management internals
    qm_controller: {
      description: 'ASP.NET Core API controller handling HTTP requests for quote CRUD operations and rating submission. Routes requests to QuoteService via dependency injection.',
      tech: ['ASP.NET Core Controller', 'MediatR'],
      owner: 'Mehul Dumasia'
    },

    qm_service: {
      description: 'Core business logic service for quote operations. Orchestrates between the MongoDB repository for persistence and the RatingSubmissionService for sending quotes to be rated.',
      tech: ['.NET 8', 'MediatR Handlers'],
      owner: 'Mehul Dumasia'
    },

    qm_rating_sub: {
      description: 'Service responsible for preparing and submitting rating requests. Resolves carrier bundles from SchemaCache, builds the RatingRequest message, and hands off to the ServiceBus publisher.',
      tech: ['.NET 8', 'Azure.Messaging.ServiceBus'],
      owner: 'Mehul Dumasia'
    },

    qm_mongo_repo: {
      description: 'Repository implementation using the MongoDB C# driver for persisting quote documents to CosmosDB. Handles serialization of the quote aggregate root.',
      tech: ['MongoDB.Driver', 'CosmosDB MongoDB API'],
      owner: 'Mehul Dumasia'
    },

    qm_sb_publisher: {
      description: 'Thin wrapper around Azure.Messaging.ServiceBus that publishes RatingRequest messages to the initial-rating-requests queue with proper serialization and correlation IDs.',
      tech: ['Azure.Messaging.ServiceBus', 'JSON serialization'],
      owner: 'Mehul Dumasia'
    },

    // Orchestrator internals
    orch_consumer: {
      description: 'Background hosted service that listens on the initial-rating-requests Service Bus queue. Deserializes incoming RatingRequest messages and delegates to MessageProcessor.',
      tech: ['.NET Worker Service', 'Azure.Messaging.ServiceBus'],
      owner: 'Bhoomika Jodhani'
    },

    orch_processor: {
      description: 'Core processing logic that validates incoming messages, archives them to blob storage, and fans out per-carrier CarrierRatingMessage messages to the rating-jobs queue.',
      tech: ['.NET 8'],
      owner: 'Bhoomika Jodhani'
    },

    orch_response: {
      description: 'Background hosted service listening on the rating-responses queue. Aggregates carrier responses and calls back to Quote Management with the combined rating results.',
      tech: ['.NET Worker Service', 'Azure.Messaging.ServiceBus'],
      owner: 'Bhoomika Jodhani'
    },

    orch_storage: {
      description: 'Service for persisting request and response payloads to Azure Blob Storage. Provides archive and retrieval capabilities for audit and debugging.',
      tech: ['Azure.Storage.Blobs'],
      owner: 'Bhoomika Jodhani'
    },

    orch_sb_pub: {
      description: 'Publishes CarrierRatingMessage messages to the rating-jobs queue, one per carrier in the rating request. Handles message correlation and metadata.',
      tech: ['Azure.Messaging.ServiceBus'],
      owner: 'Bhoomika Jodhani'
    },

    orch_validator: {
      description: 'Validates incoming RatingRequest messages for required fields, valid carrier IDs, and schema conformance before processing.',
      tech: ['FluentValidation', '.NET 8'],
      owner: 'Bhoomika Jodhani'
    },

    // Carrier Connector internals
    cc_consumer: {
      description: 'Background hosted service consuming CarrierRatingMessage from the rating-jobs queue. Routes each message to the RatingService for processing.',
      tech: ['.NET Worker Service', 'Azure.Messaging.ServiceBus'],
      owner: 'Bhavesh Patel'
    },

    cc_rating_svc: {
      description: 'Core rating orchestration within the connector. Validates CDM data, selects the appropriate carrier adapter, transforms data to CSIO XML, and coordinates the rating call.',
      tech: ['.NET 8', 'Strategy Pattern'],
      owner: 'Bhavesh Patel'
    },

    cc_aviva_adapter: {
      description: 'Carrier adapter for Aviva. Implements REST-based integration with OAuth2 token management. Transforms CDM to Aviva-specific CSIO 1.48 XML format and parses responses.',
      tech: ['HttpClient', 'OAuth2', 'CSIO XML 1.48', 'REST'],
      owner: 'Bhavesh Patel'
    },

    cc_sgi_adapter: {
      description: 'Carrier adapter for SGI. Implements SOAP-based integration with OAuth2 token management. Handles WS-Security and CSIO 1.48 XML serialization/deserialization.',
      tech: ['WCF Client', 'OAuth2', 'CSIO XML 1.48', 'SOAP'],
      owner: 'Philip West'
    },

    cc_ph_adapter: {
      description: 'Carrier adapter for Peace Hills. Implements REST-based integration with API Key authentication. Simpler auth model compared to OAuth2 carriers.',
      tech: ['HttpClient', 'API Key Auth', 'CSIO XML 1.48', 'REST'],
      owner: 'Bhavesh Patel'
    },

    cc_premium_calc: {
      description: 'Local premium calculation engine currently running in SIMULATOR mode. Returns mock premium calculations for testing when live carrier APIs are unavailable. Must be replaced with real carrier integrations for production.',
      tech: ['.NET 8', 'Simulator Mode'],
      owner: 'Bhavesh Patel'
    },

    cc_validators: {
      description: 'Suite of 11 FluentValidation validators that ensure CDM (Common Data Model) data meets carrier requirements before submission. Validates driver info, vehicle data, coverage selections, and policy details.',
      tech: ['FluentValidation', '.NET 8'],
      owner: 'Bhavesh Patel',
      validatorCount: 11
    },

    // Schema Cache internals
    sc_controller: {
      description: 'Public API controller exposing schema retrieval endpoints. Used by Quote Management to fetch carrier-specific field definitions and validation rules.',
      tech: ['ASP.NET Core Controller'],
      owner: 'Satish Natarajan'
    },

    sc_sync_ctrl: {
      description: 'Internal controller for triggering manual schema synchronization from Azure SQL to CosmosDB. Not exposed externally.',
      tech: ['ASP.NET Core Controller'],
      owner: 'Satish Natarajan'
    },

    sc_service: {
      description: 'Business logic for schema resolution, caching, and synchronization. Reads rule definitions from Azure SQL and caches compiled bundles in CosmosDB for fast retrieval.',
      tech: ['.NET 8', 'Entity Framework Core', 'MongoDB.Driver'],
      owner: 'Satish Natarajan'
    },

    sc_mongo_repo: {
      description: 'Repository for storing and retrieving compiled schema bundles from CosmosDB. Provides fast read access for schema lookups during quote creation.',
      tech: ['MongoDB.Driver', 'CosmosDB MongoDB API'],
      owner: 'Satish Natarajan'
    },

    sc_sb_consumer: {
      description: 'Service Bus consumer that listens for schema update events. Triggers re-sync of affected carrier schemas when rating rules change.',
      tech: ['Azure.Messaging.ServiceBus', '.NET Worker Service'],
      owner: 'Satish Natarajan'
    }
  }
};
