#!/usr/bin/env node
/**
 * enrich-data.js
 *
 * Pulls real data from Azure DevOps REST API and local git repos,
 * then generates an enriched data.js that merges with the existing
 * data-base.js for the Architecture Explorer.
 *
 * Usage:
 *   node enrich-data.js            # full run
 *   node enrich-data.js --dry-run  # print what would be fetched, no writes
 *
 * Requirements: Node.js >= 18 (built-in fetch not used; uses https module)
 * No npm dependencies.
 */

'use strict';

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────

const PAT = process.env.ADO_PAT;
if (!PAT) {
  console.error('ERROR: Set ADO_PAT environment variable before running.\n  export ADO_PAT="your-personal-access-token"');
  process.exit(1);
}
const ORG = 'rivalitinc';
const PROJECT = 'Rival Insurance Technology';
const PROJECT_ENCODED = encodeURIComponent(PROJECT);
const AUTH_HEADER = 'Basic ' + Buffer.from(':' + PAT).toString('base64');
const BASE_URL = `https://dev.azure.com/${ORG}/${PROJECT_ENCODED}`;

const REPOS_ROOT = '/Users/tariqusama/Documents/azure_devops/knowledge/repos';
const SCRIPT_DIR = path.dirname(path.resolve(__filename));
const DATA_BASE_PATH = path.join(SCRIPT_DIR, 'data-base.js');
const DATA_OUTPUT_PATH = path.join(SCRIPT_DIR, 'data.js');

const DRY_RUN = process.argv.includes('--dry-run');

const SERVICE_REPO_MAP = {
  rpm_client:        'Rival.Platform.Web',
  bff:               'Rival.Platform.BFF',
  quote_mgmt:        'Rival.Quoting.API.QuoteManagement',
  orchestrator:      'Rival.Rating.API.RatingOrchestrator',
  carrier_connector: 'Rival.Rating.API.CarrierConnector',
  manufacture:       'Rival.Rating.API.Manufacture',
  schema_cache:      'Rival.Quoting.API.SchemaCache',
  platform_config:   'Rival.Platform.API.Configuration',
};

const API_DELAY_MS = 250; // delay between API calls to avoid rate limits

// ─── Utilities ───────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function warn(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.warn(`[${ts}] WARNING: ${msg}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an HTTPS GET/POST request to Azure DevOps.
 * Returns parsed JSON or null on error.
 */
function apiRequest(urlPath, { method = 'GET', body = null } = {}) {
  return new Promise((resolve) => {
    const url = urlPath.startsWith('https://') ? urlPath : `${BASE_URL}${urlPath}`;
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          warn(`HTTP ${res.statusCode} for ${method} ${parsed.pathname} — ${data.slice(0, 200)}`);
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          warn(`JSON parse error for ${parsed.pathname}: ${e.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      warn(`Request error for ${url}: ${e.message}`);
      resolve(null);
    });

    req.setTimeout(30000, () => {
      warn(`Timeout for ${url}`);
      req.destroy();
      resolve(null);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Run a shell command in a given directory. Returns stdout or empty string on failure.
 */
function git(repoDir, cmd) {
  try {
    return execSync(cmd, {
      cwd: repoDir,
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (e) {
    warn(`git command failed in ${repoDir}: ${cmd} — ${(e.message || '').slice(0, 100)}`);
    return '';
  }
}

// ─── Local Git Data Collection ───────────────────────────────────────────────

function collectGitData(serviceId, repoName) {
  const repoDir = path.join(REPOS_ROOT, repoName);

  if (!fs.existsSync(repoDir)) {
    warn(`Repo directory not found: ${repoDir}`);
    return null;
  }

  log(`  Git: ${repoName}`);

  // Recent commits
  const commitRaw = git(repoDir, 'git log -15 --format="%H|%ai|%an|%s"');
  const recentCommits = commitRaw
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [hash, date, author, ...msgParts] = line.split('|');
      return {
        hash: (hash || '').slice(0, 8),
        date: (date || '').slice(0, 10),
        author: author || 'Unknown',
        message: msgParts.join('|') || '',
      };
    });

  // Active branches
  const branchRaw = git(repoDir, 'git branch -r --format="%(refname:short)|%(creatordate:iso)"');
  const activeBranches = branchRaw
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|');
      return parts[0] || line;
    })
    .map(b => b.replace(/^origin\//, ''))
    .filter(b => b && !b.startsWith('HEAD'));

  // File stats
  let totalFiles = 0;
  let totalCsFiles = 0;
  try {
    const allFiles = git(repoDir, 'find . -type f -not -path "./.git/*" | wc -l');
    totalFiles = parseInt(allFiles, 10) || 0;
  } catch (_) { /* ignore */ }

  try {
    const csFiles = git(repoDir, 'find . -name "*.cs" -not -path "./.git/*" | wc -l');
    totalCsFiles = parseInt(csFiles, 10) || 0;
  } catch (_) { /* ignore */ }

  // Last commit date
  const lastCommitDate = recentCommits.length > 0 ? recentCommits[0].date : 'Unknown';

  return {
    recentCommits,
    gitStats: {
      totalFiles,
      totalCsFiles,
      activeBranches: activeBranches.slice(0, 30), // cap for sanity
      lastCommitDate,
    },
  };
}

// ─── Azure DevOps API Collection ─────────────────────────────────────────────

async function fetchPullRequests(repoName) {
  log(`  API: PRs for ${repoName}`);
  const urlPath = `/_apis/git/repositories/${encodeURIComponent(repoName)}/pullrequests?searchCriteria.status=all&$top=10&api-version=7.0`;
  const result = await apiRequest(urlPath);
  if (!result || !result.value) return [];

  return result.value.map(pr => ({
    id: pr.pullRequestId,
    title: pr.title || '',
    status: pr.status || 'unknown',
    author: (pr.createdBy && pr.createdBy.displayName) || 'Unknown',
    created: pr.creationDate || '',
    closed: pr.closedDate || null,
    merged: pr.status === 'completed' ? (pr.closedDate || null) : null,
    reviewers: (pr.reviewers || []).map(r => r.displayName || 'Unknown'),
    description: (pr.description || '').slice(0, 500),
  }));
}

async function fetchPRThreads(repoName, prId) {
  const urlPath = `/_apis/git/repositories/${encodeURIComponent(repoName)}/pullrequests/${prId}/threads?api-version=7.0`;
  const result = await apiRequest(urlPath);
  if (!result || !result.value) return [];

  const threads = [];
  for (const thread of result.value) {
    // Skip system-generated threads
    if (!thread.comments || thread.comments.length === 0) continue;
    const firstComment = thread.comments[0];
    // Skip system / automated comments
    if (firstComment.commentType === 'system') continue;

    threads.push({
      author: (firstComment.author && firstComment.author.displayName) || 'Unknown',
      comment: (firstComment.content || '').slice(0, 300),
      date: firstComment.publishedDate || '',
      status: thread.status || 'unknown',
    });
  }
  return threads;
}

async function fetchWorkItems() {
  log('  API: Work items (WIQL)');
  const wiqlBody = {
    query: "SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType], [System.ChangedDate], [System.Tags] FROM WorkItems WHERE [System.TeamProject] = 'Rival Insurance Technology' AND [System.AreaPath] UNDER 'Rival Insurance Technology\\Skunk Team' ORDER BY [System.ChangedDate] DESC",
  };

  const wiqlResult = await apiRequest('/_apis/wit/wiql?api-version=7.0', {
    method: 'POST',
    body: wiqlBody,
  });

  if (!wiqlResult || !wiqlResult.workItems || wiqlResult.workItems.length === 0) {
    warn('No work items returned from WIQL query');
    return [];
  }

  const allIds = wiqlResult.workItems.map(wi => wi.id);
  log(`  API: Found ${allIds.length} work items, fetching details...`);

  // Fetch in batches of 50
  const workItems = [];
  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50);
    const idsStr = batch.join(',');
    const wiResult = await apiRequest(
      `/_apis/wit/workitems?ids=${idsStr}&$expand=relations&api-version=7.0`
    );
    if (wiResult && wiResult.value) {
      for (const wi of wiResult.value) {
        const f = wi.fields || {};
        workItems.push({
          id: wi.id,
          title: f['System.Title'] || '',
          state: f['System.State'] || '',
          assignedTo: (f['System.AssignedTo'] && f['System.AssignedTo'].displayName) || 'Unassigned',
          type: f['System.WorkItemType'] || '',
          changedDate: f['System.ChangedDate'] || '',
          tags: f['System.Tags'] || '',
          areaPath: f['System.AreaPath'] || '',
        });
      }
    }
    if (i + 50 < allIds.length) await delay(API_DELAY_MS);
  }

  return workItems;
}

/**
 * Resolve a repo name to its GUID via the Azure DevOps API.
 * Caches results for the session.
 */
const repoGuidCache = {};
async function getRepoGuid(repoName) {
  if (repoGuidCache[repoName]) return repoGuidCache[repoName];
  const result = await apiRequest(`/_apis/git/repositories/${encodeURIComponent(repoName)}?api-version=7.0`);
  if (result && result.id) {
    repoGuidCache[repoName] = result.id;
    return result.id;
  }
  return null;
}

async function fetchBuilds(repoName) {
  log(`  API: Builds for ${repoName}`);
  const repoGuid = await getRepoGuid(repoName);
  if (!repoGuid) {
    warn(`Could not resolve GUID for repo ${repoName}, skipping builds`);
    return [];
  }
  const urlPath = `/_apis/build/builds?repositoryId=${repoGuid}&repositoryType=TfsGit&$top=5&api-version=7.0`;
  const result = await apiRequest(urlPath);
  if (!result || !result.value) return [];

  return result.value.map(b => ({
    id: b.id,
    buildNumber: b.buildNumber || '',
    status: b.status || 'unknown',
    result: b.result || 'unknown',
    startTime: b.startTime || '',
    finishTime: b.finishTime || '',
    sourceBranch: (b.sourceBranch || '').replace('refs/heads/', ''),
    requestedBy: (b.requestedBy && b.requestedBy.displayName) || 'Unknown',
  }));
}

// ─── Summary Generation ─────────────────────────────────────────────────────

function generateSummary(serviceData) {
  const parts = [];

  // Authors from recent commits
  const authors = [...new Set((serviceData.recentCommits || []).map(c => c.author))];
  if (authors.length > 0) {
    parts.push(`Active development by ${authors.slice(0, 3).join(', ')}${authors.length > 3 ? ` and ${authors.length - 3} others` : ''}.`);
  }

  // PR activity
  const prs = serviceData.pullRequests || [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentMerged = prs.filter(pr =>
    pr.status === 'completed' && pr.merged && new Date(pr.merged) >= oneWeekAgo
  );
  const activePRs = prs.filter(pr => pr.status === 'active');
  if (recentMerged.length > 0) {
    parts.push(`${recentMerged.length} PR${recentMerged.length !== 1 ? 's' : ''} merged this week.`);
  }
  if (activePRs.length > 0) {
    parts.push(`${activePRs.length} active PR${activePRs.length !== 1 ? 's' : ''} open.`);
  }

  // Recent commit frequency
  const commits = serviceData.recentCommits || [];
  if (commits.length > 0) {
    const dates = [...new Set(commits.map(c => c.date))];
    const daySpan = dates.length;
    if (daySpan > 0) {
      const recentCommitsThisWeek = commits.filter(c => {
        const d = new Date(c.date);
        return d >= oneWeekAgo;
      }).length;
      if (recentCommitsThisWeek > 0) {
        parts.push(`${recentCommitsThisWeek} commit${recentCommitsThisWeek !== 1 ? 's' : ''} in the past week.`);
      }
    }
  }

  // Current work from recent commit messages
  const recentMessages = (serviceData.recentCommits || []).slice(0, 5).map(c => c.message);
  const workTopics = recentMessages
    .filter(m => m.toLowerCase().includes('add') || m.toLowerCase().includes('implement') || m.toLowerCase().includes('feature') || m.toLowerCase().includes('update'))
    .slice(0, 2);
  if (workTopics.length > 0) {
    parts.push(`Recent work: ${workTopics.map(t => '"' + t.slice(0, 60) + '"').join(', ')}.`);
  }

  // Build status
  const builds = serviceData.builds || [];
  if (builds.length > 0) {
    const latest = builds[0];
    const buildResult = latest.result || latest.status || 'unknown';
    let ago = '';
    if (latest.finishTime) {
      const diffMs = now.getTime() - new Date(latest.finishTime).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays > 0) ago = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      else if (diffHrs > 0) ago = `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
      else ago = 'recently';
    }
    parts.push(`Last build ${buildResult}${ago ? ' ' + ago : ''}.`);
  } else {
    parts.push('No CI/CD pipeline builds found.');
  }

  // Work items
  const wis = serviceData.workItems || [];
  if (wis.length > 0) {
    const byState = {};
    for (const wi of wis) {
      const state = wi.state || 'Unknown';
      byState[state] = (byState[state] || 0) + 1;
    }
    const stateParts = Object.entries(byState)
      .map(([state, count]) => `${count} ${state.toLowerCase()}`)
      .slice(0, 4);
    parts.push(`Work items: ${stateParts.join(', ')}.`);
  }

  return parts.join(' ') || 'No recent activity data available.';
}

// ─── Work Item to Service Matching ───────────────────────────────────────────

/**
 * Try to associate work items with services based on title/tags keywords.
 */
function matchWorkItemsToService(serviceId, repoName, allWorkItems) {
  const keywords = {
    rpm_client:        ['rpm', 'client', 'blazor', 'web', 'ui', 'screen', 'render', 'frontend', 'platform.web'],
    bff:               ['bff', 'backend-for-frontend', 'proxy', 'gateway', 'platform.bff'],
    quote_mgmt:        ['quote', 'quoting', 'quotation', 'quote management'],
    orchestrator:      ['orchestrat', 'rating orchestrat', 'fan out', 'fan-out'],
    carrier_connector: ['carrier', 'connector', 'aviva', 'sgi', 'peace hills', 'csio', 'adapter'],
    manufacture:       ['manufacture', 'manual rating'],
    schema_cache:      ['schema', 'cache', 'schema cache', 'bundle'],
    platform_config:   ['config', 'configuration', 'feature flag', 'platform config'],
  };

  const serviceKeywords = keywords[serviceId] || [];
  return allWorkItems.filter(wi => {
    const text = `${wi.title} ${wi.tags}`.toLowerCase();
    return serviceKeywords.some(kw => text.includes(kw));
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  log('=== Architecture Explorer Data Enrichment ===');
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no files will be written)' : 'LIVE'}`);
  log(`Org: ${ORG} | Project: ${PROJECT}`);
  log('');

  // ── Step 1: Rename data.js to data-base.js if needed ──
  if (!DRY_RUN) {
    const currentDataPath = path.join(SCRIPT_DIR, 'data.js');
    if (fs.existsSync(currentDataPath) && !fs.existsSync(DATA_BASE_PATH)) {
      log('Renaming data.js -> data-base.js');
      fs.copyFileSync(currentDataPath, DATA_BASE_PATH);
    } else if (!fs.existsSync(DATA_BASE_PATH)) {
      warn('No data.js or data-base.js found. Cannot proceed.');
      process.exit(1);
    }
  }

  // ── Step 2: Collect local git data ──
  log('--- Collecting local git data ---');
  const gitDataByService = {};
  for (const [serviceId, repoName] of Object.entries(SERVICE_REPO_MAP)) {
    if (DRY_RUN) {
      log(`  [DRY RUN] Would collect git data from ${REPOS_ROOT}/${repoName}`);
      continue;
    }
    gitDataByService[serviceId] = collectGitData(serviceId, repoName);
  }
  log('');

  // ── Step 3: Fetch Azure DevOps data ──
  log('--- Fetching Azure DevOps API data ---');

  // 3a. Pull Requests per repo
  const prsByService = {};
  for (const [serviceId, repoName] of Object.entries(SERVICE_REPO_MAP)) {
    if (DRY_RUN) {
      log(`  [DRY RUN] Would fetch PRs: GET ${BASE_URL}/_apis/git/repositories/${repoName}/pullrequests?...`);
      continue;
    }
    const prs = await fetchPullRequests(repoName);
    // Fetch threads for top 3 PRs
    for (let i = 0; i < Math.min(3, prs.length); i++) {
      await delay(API_DELAY_MS);
      log(`  API: PR threads for ${repoName} PR #${prs[i].id}`);
      prs[i].threads = await fetchPRThreads(repoName, prs[i].id);
    }
    prsByService[serviceId] = prs;
    await delay(API_DELAY_MS);
  }
  log('');

  // 3b. Work Items
  let allWorkItems = [];
  if (DRY_RUN) {
    log(`  [DRY RUN] Would fetch work items via WIQL query`);
  } else {
    allWorkItems = await fetchWorkItems();
    log(`  Fetched ${allWorkItems.length} work items total`);
  }
  log('');

  // 3c. Builds per repo
  const buildsByService = {};
  for (const [serviceId, repoName] of Object.entries(SERVICE_REPO_MAP)) {
    if (DRY_RUN) {
      log(`  [DRY RUN] Would fetch builds: GET ${BASE_URL}/_apis/build/builds?repositoryId=${repoName}&...`);
      continue;
    }
    buildsByService[serviceId] = await fetchBuilds(repoName);
    await delay(API_DELAY_MS);
  }
  log('');

  if (DRY_RUN) {
    log('=== DRY RUN COMPLETE. No files written. ===');
    return;
  }

  // ── Step 4: Assemble enrichment data ──
  log('--- Assembling enrichment data ---');
  const enrichment = {
    generatedAt: new Date().toISOString(),
    services: {},
    recentActivity: allWorkItems.slice(0, 20).map(wi => ({
      id: wi.id,
      title: wi.title,
      state: wi.state,
      assignedTo: wi.assignedTo,
      type: wi.type,
      changedDate: wi.changedDate,
    })),
  };

  for (const [serviceId, repoName] of Object.entries(SERVICE_REPO_MAP)) {
    const gitData = gitDataByService[serviceId] || { recentCommits: [], gitStats: {} };
    const prs = prsByService[serviceId] || [];
    const builds = buildsByService[serviceId] || [];
    const matchedWorkItems = matchWorkItemsToService(serviceId, repoName, allWorkItems);

    const serviceData = {
      recentCommits: gitData.recentCommits || [],
      pullRequests: prs,
      workItems: matchedWorkItems.slice(0, 20).map(wi => ({
        id: wi.id,
        title: wi.title,
        state: wi.state,
        assignedTo: wi.assignedTo,
        type: wi.type,
      })),
      builds,
      gitStats: gitData.gitStats || {},
      summary: '',
    };

    serviceData.summary = generateSummary(serviceData);
    enrichment.services[serviceId] = serviceData;

    log(`  ${serviceId}: ${gitData.recentCommits?.length || 0} commits, ${prs.length} PRs, ${builds.length} builds, ${matchedWorkItems.length} work items`);
  }
  log('');

  // ── Step 5: Read existing data-base.js and generate merged data.js ──
  log('--- Generating enriched data.js ---');

  // Read the existing data-base.js content to extract the ARCH_DATA object
  const baseContent = fs.readFileSync(DATA_BASE_PATH, 'utf8');

  // Build the enrichment JS block
  const enrichmentJson = JSON.stringify(enrichment, null, 2);

  // Generate the output data.js
  const output = `/**
 * Rival Rating Platform - Architecture Explorer Data (Enriched)
 *
 * AUTO-GENERATED by enrich-data.js on ${new Date().toISOString()}
 * Do not edit manually. Edit data-base.js for base architecture data,
 * then re-run: node enrich-data.js
 */

// Load base architecture data
${baseContent}

// Merge enrichment data
(function() {
  var enrichment = ${enrichmentJson};

  if (typeof window !== 'undefined' && window.ARCH_DATA) {
    window.ARCH_DATA.enrichment = enrichment;
  }
})();
`;

  fs.writeFileSync(DATA_OUTPUT_PATH, output, 'utf8');
  const fileSize = fs.statSync(DATA_OUTPUT_PATH).size;
  log(`Written: ${DATA_OUTPUT_PATH} (${(fileSize / 1024).toFixed(1)} KB)`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('');
  log(`=== Enrichment complete in ${elapsed}s ===`);
  log(`  Services enriched: ${Object.keys(enrichment.services).length}`);
  log(`  Total work items: ${allWorkItems.length}`);
  log(`  Recent activity items: ${enrichment.recentActivity.length}`);
  log(`  Output: ${DATA_OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
