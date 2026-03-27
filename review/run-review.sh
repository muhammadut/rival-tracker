#!/usr/bin/env bash
# ============================================================================
#  run-review.sh  --  Prepare environment for an architecture review cycle
#
#  Usage:  ./review/run-review.sh
#  Prereq: export ADO_PAT='<your-pat>' for ADO data enrichment
# ============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Colors & helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'  # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR]${NC}   $*"; }
header()  { echo -e "\n${BOLD}${CYAN}── $* ──${NC}"; }

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/review-config.json"

REPOS_ROOT="/Users/tariqusama/Documents/azure_devops/knowledge/repos"
REPOS=(
  "Rival.Platform.Web"
  "Rival.Platform.BFF"
  "Rival.Quoting.API.QuoteManagement"
  "Rival.Rating.API.RatingOrchestrator"
  "Rival.Rating.API.CarrierConnector"
  "Rival.Rating.API.Manufacture"
  "Rival.Quoting.API.SchemaCache"
  "Rival.Platform.API.Configuration"
)

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
header "Preflight Checks"

if ! command -v git &>/dev/null; then
  error "git is not installed. Aborting."
  exit 1
fi
success "git found"

if ! command -v node &>/dev/null; then
  warn "node is not installed. ADO enrichment will be skipped."
fi

if [ ! -f "$CONFIG_FILE" ]; then
  error "review-config.json not found at $CONFIG_FILE"
  exit 1
fi
success "review-config.json found"

if [ ! -d "$REPOS_ROOT" ]; then
  error "Repos root not found at $REPOS_ROOT"
  exit 1
fi
success "Repos root exists"

# ---------------------------------------------------------------------------
# Step 1: Pull latest code
# ---------------------------------------------------------------------------
header "Step 1: Pull Latest Code"

pull_errors=0
for repo in "${REPOS[@]}"; do
  repo_path="$REPOS_ROOT/$repo"
  if [ ! -d "$repo_path" ]; then
    warn "Repo not found: $repo (skipping)"
    continue
  fi

  printf "  %-45s" "$repo"
  fetch_out=$(git -C "$repo_path" fetch --all --prune 2>&1) || true
  pull_out=$(git -C "$repo_path" pull --ff-only 2>&1)
  pull_status=$?

  if [ $pull_status -eq 0 ]; then
    echo -e " ${GREEN}updated${NC}"
  else
    echo -e " ${YELLOW}ff-only failed (local changes?)${NC}"
    pull_errors=$((pull_errors + 1))
  fi
done

if [ $pull_errors -gt 0 ]; then
  warn "$pull_errors repo(s) could not fast-forward. You may have local changes."
else
  success "All repos up to date."
fi

# ---------------------------------------------------------------------------
# Step 2: ADO data enrichment
# ---------------------------------------------------------------------------
header "Step 2: ADO Data Enrichment"

if [ -z "${ADO_PAT:-}" ]; then
  warn "ADO_PAT not set. Skipping ADO data enrichment."
  echo -e "  ${DIM}Set it with: export ADO_PAT='your-pat'${NC}"
else
  if command -v node &>/dev/null && [ -f "$PROJECT_ROOT/enrich-data.js" ]; then
    info "Running ADO data enrichment..."
    if node "$PROJECT_ROOT/enrich-data.js"; then
      success "ADO data enrichment complete."
    else
      warn "ADO enrichment returned errors (non-fatal, continuing)."
    fi
  else
    warn "enrich-data.js not found or node unavailable. Skipping."
  fi
fi

# ---------------------------------------------------------------------------
# Step 3: Repository Summary
# ---------------------------------------------------------------------------
header "Step 3: Repository Summary"

printf "\n  ${BOLD}%-40s  %-14s  %8s  %s${NC}\n" "REPOSITORY" "LAST COMMIT" "COMMITS" "ACTIVE BRANCHES"
printf "  %-40s  %-14s  %8s  %s\n" "$(printf '%0.s─' {1..40})" "$(printf '%0.s─' {1..14})" "$(printf '%0.s─' {1..8})" "$(printf '%0.s─' {1..20})"

for repo in "${REPOS[@]}"; do
  repo_path="$REPOS_ROOT/$repo"
  if [ ! -d "$repo_path/.git" ]; then
    printf "  ${DIM}%-40s  %-14s  %8s  %s${NC}\n" "$repo" "N/A" "N/A" "N/A"
    continue
  fi

  last_commit=$(git -C "$repo_path" log -1 --format="%cd" --date=short 2>/dev/null || echo "N/A")
  total_commits=$(git -C "$repo_path" rev-list --count HEAD 2>/dev/null || echo "N/A")
  active_branches=$(git -C "$repo_path" branch -r --no-merged 2>/dev/null | wc -l | tr -d ' ' || echo "0")

  printf "  %-40s  %-14s  %8s  %s\n" "$repo" "$last_commit" "$total_commits" "$active_branches"
done

# ---------------------------------------------------------------------------
# Step 4: Blast Radius Map
# ---------------------------------------------------------------------------
header "Step 4: Blast Radius Connections"

if command -v python3 &>/dev/null; then
  python3 - "$CONFIG_FILE" <<'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    config = json.load(f)

blast = config.get("blastRadius", {})
services = config.get("services", {})

for svc, info in blast.items():
    repo = services.get(svc, {}).get("repo", svc)
    upstream = ", ".join(info.get("upstream", [])) or "none"
    downstream = ", ".join(info.get("downstream", [])) or "none"
    data = ", ".join(info.get("data", [])) or "none"
    infra = ", ".join(info.get("infra", [])) or "none"

    print(f"\n  \033[1m{svc}\033[0m ({repo})")
    print(f"    upstream:   {upstream}")
    print(f"    downstream: {downstream}")
    print(f"    data:       {data}")
    print(f"    infra:      {infra}")

    contracts = info.get("contracts", {})
    if contracts:
        for k, v in contracts.items():
            val = ", ".join(v) if isinstance(v, list) else v
            print(f"    {k}: {val}")
PYEOF
else
  warn "python3 not found. Printing raw blast radius from config."
  cat "$CONFIG_FILE" | grep -A 50 '"blastRadius"' || true
fi

# ---------------------------------------------------------------------------
# Step 5: Instructions
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${CYAN}==========================================${NC}"
echo -e "${BOLD}${CYAN}  Environment ready for review.${NC}"
echo -e "${BOLD}${CYAN}==========================================${NC}"
echo ""
echo -e "To run a ${BOLD}FULL${NC} review, tell Claude Code:"
echo -e "  ${GREEN}\"Run a full architecture review following review/REVIEW_SPEC.md\"${NC}"
echo ""
echo -e "To run a ${BOLD}QUICK${NC} review (recent changes only), tell Claude Code:"
echo -e "  ${GREEN}\"Run a quick review of recent changes in the Rating Platform\"${NC}"
echo ""
echo -e "To run a ${BOLD}TARGETED${NC} review, tell Claude Code:"
echo -e "  ${GREEN}\"Review Quote Management and its blast radius\"${NC}"
echo ""
