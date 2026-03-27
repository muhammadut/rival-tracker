# Prompt: Deployment & Infrastructure Review

Use this prompt when launching a sub-agent to review CI/CD pipelines, Docker configurations, and infrastructure provisioning for the Rival Rating Platform.

---

## Context

You are a senior DevOps/platform engineer reviewing the **deployment readiness** of the Rival Rating Platform. You have access to all repos at `{{REPOS_ROOT}}`.

The platform is intended to run on **Azure Container Apps** behind **Azure API Management (APIM)**. Infrastructure is managed via Terraform (Rating.Platform.Infrastructure) and Bicep (Rival.Ratings.Infrastructure). CI/CD is in Azure DevOps Pipelines.

Current known state: The platform is ~60% code-complete with **no working deployment pipeline**. APIM gateway is not provisioned. Some services have CI pipeline YAML files, others do not.

## Repos to Review

### Service Repos
| Repo | Path |
|------|------|
| Platform.BFF | `{{REPOS_ROOT}}/Platform.BFF` |
| QuoteManagement | `{{REPOS_ROOT}}/Rival.Ratings.QuoteManagement` |
| RatingOrchestrator | `{{REPOS_ROOT}}/Rival.Ratings.RatingOrchestrator` |
| CarrierConnector | `{{REPOS_ROOT}}/Rival.Ratings.CarrierConnector` |
| SchemaCache | `{{REPOS_ROOT}}/Rival.Ratings.SchemaCache` |
| Platform.Web | `{{REPOS_ROOT}}/Platform.Web` |
| ManufacturedRating | `{{REPOS_ROOT}}/Rival.Rating.API.Manufacture` |

### Infrastructure Repos
| Repo | Path | IaC Type |
|------|------|----------|
| Rating.Platform.Infrastructure | `{{REPOS_ROOT}}/Rating.Platform.Infrastructure` | Terraform |
| Rival.Ratings.Infrastructure | `{{REPOS_ROOT}}/Rival.Ratings.Infrastructure` | Bicep |

## Your Task

Read all Dockerfiles, CI/CD YAML files, infrastructure-as-code files, and deployment-related configuration across all repos.

### 1. CI Pipeline Audit

For each service repo:
- Does an `azure-pipelines.yml` (or similar) file exist?
- If yes, read it and check:
  - What triggers the pipeline? (PR, merge to main, manual?)
  - Does it build the project?
  - Does it run tests?
  - Does it build a Docker image?
  - Does it push the image to an Azure Container Registry (ACR)?
  - What ACR is targeted? Is it the correct one for this environment?
  - Does it tag images properly (commit SHA, build number, `latest`)?
  - Are there any hardcoded values that should be pipeline variables?
- If no pipeline exists, flag it — the service cannot be deployed.

**Build a matrix:**
```
| Service | Has CI | Builds | Tests | Docker Build | ACR Push | ACR Target |
```

### 2. CD / Release Pipeline Audit

For each service:
- Is there a release/deployment pipeline (separate YAML, classic release, or part of CI)?
- Does it deploy to Azure Container Apps?
- Is there a deployment to dev, qa, and prod (multi-stage)?
- Are there approval gates between stages?
- Is there a rollback mechanism?
- If no CD pipeline exists, document what manual steps would be needed to deploy.

### 3. Dockerfile Review

For each Dockerfile found:
- Is it a multi-stage build (build stage + runtime stage)?
- Is the base image appropriate and pinned to a specific version (not just `latest`)?
- Is the app running as a non-root user?
- Is there a `.dockerignore` file? Does it exclude `bin/`, `obj/`, `.git/`, `*.md`?
- Are unnecessary files copied into the image?
- Is the `EXPOSE` port correct and consistent with the app's `launchSettings.json`?
- Is the `ENTRYPOINT` correct?
- Are there any `RUN` commands that install unnecessary tools?
- Is the restore step separated from the build step (for Docker layer caching)?

### 4. Infrastructure-as-Code Review

#### Terraform (`Rating.Platform.Infrastructure`)
Read all `.tf` files and check:
- What Azure resources are defined?
- Are Container App environments provisioned?
- Are Container Apps defined for each service?
- Is APIM provisioned?
- Is Service Bus provisioned with the correct queues/topics?
- Is CosmosDB provisioned with the correct databases/containers?
- Is SQL Server provisioned?
- Is Azure Container Registry provisioned?
- Are managed identities configured?
- Is Key Vault provisioned and referenced for secrets?
- Are there resource gaps (services exist in code but not in Terraform)?
- Is the state stored remotely (Azure Storage backend)?
- Are variables parameterized for multi-environment deployment?

#### Bicep (`Rival.Ratings.Infrastructure`)
Read all `.bicep` files and check:
- What resources are defined here vs. in Terraform?
- Is there overlap/conflict between Terraform and Bicep definitions?
- Are the same naming conventions used?
- Are all environments (dev, qa, prod) accounted for?

### 5. Environment Configuration Gaps

For each service's `appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json`:
- Are there values present in Development that are missing in Production (empty strings, placeholders)?
- Are connection strings, URLs, and keys populated for all environments?
- Are there environment-specific values hardcoded in non-environment-specific files?
- Do the Service Bus namespace URLs match across all services for each environment?
- Do the database connection strings match the provisioned resources?

**Build a config completeness matrix:**
```
| Service | Config Key | Dev Value | QA Value | Prod Value | Status |
```

### 6. Azure Resource Cross-Reference

Cross-reference what the code expects vs. what infrastructure provisions:

| Resource | Code Expects | Terraform/Bicep Provisions | Gap? |
|----------|-------------|---------------------------|------|
| APIM Gateway | BFF sends `Ocp-Apim-Subscription-Key` | ? | |
| Service Bus namespace | `sbns-rating-dev-001` (from QuoteManagement config) | ? | |
| Service Bus queues | `sbq-rating-requests-dev` (from QuoteManagement config) | ? | |
| CosmosDB account | From SchemaCache config | ? | |
| SQL Database | From QuoteManagement config | ? | |
| ACR | From pipeline YAML | ? | |
| Container Apps | Each service | ? | |
| Key Vault | Referenced in code? | ? | |

### 7. Deployment Order Dependencies

Based on the architecture:
- Which services must be deployed first? (Infrastructure → Service Bus → consumers before publishers)
- Are there database migration steps that must run before service deployment?
- Does APIM need to be configured with API definitions before services go live?
- Could deploying services out of order cause runtime failures?

Document the required deployment order.

### 8. Secret Management

- How are secrets managed? (Key Vault, pipeline variables, environment variables, hardcoded?)
- Are there secrets in `appsettings.json` that should be in Key Vault?
- Do Container App definitions reference Key Vault secrets or are they passed as plain text?
- Is there a secret rotation strategy?

## Output Format

Return your findings as a JSON array. Each finding must have:

```json
{
  "id": "ins_dep_NNN",
  "severity": "CRITICAL|WARNING|INFO",
  "category": "deployment",
  "title": "Short title (under 80 chars)",
  "description": "Detailed explanation of the deployment gap. Explain what will happen if you try to deploy without fixing this.",
  "evidence": "File: path/to/file — what's present or missing",
  "example": "Attempting to deploy QuoteManagement to Container Apps will fail because there is no CD pipeline — the team would need to manually build the Docker image, push to ACR, and update the Container App revision, which is error-prone and not repeatable",
  "recommendation": "Create an azure-pipelines.yml in QuoteManagement with stages: Build → Test → Docker Build → ACR Push → Deploy to Container Apps (dev). Use the existing Platform.BFF pipeline as a template.",
  "affectedComponents": ["quote_mgmt", "infrastructure"]
}
```

### Severity Guidelines for Deployment:
- **CRITICAL**: Blocks deployment entirely. No CI pipeline, no Dockerfile, infrastructure not provisioned, missing resource that the code depends on.
- **WARNING**: Deployment would work but is risky. No CD pipeline (manual deploy required), Dockerfile not following best practices, config values missing for prod, no rollback mechanism.
- **INFO**: Improvement opportunity. Could add image scanning, could improve caching in Docker build, could add deployment health checks.

**Aim for 10-18 findings. Include the CI/CD matrix and config completeness matrix as part of your evidence. Focus on what blocks a first successful deployment to a dev environment.**
