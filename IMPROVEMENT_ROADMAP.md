# Architecture Explorer - Improvement Roadmap

Synthesized from 3 deep reviews: UX, Product/Features, and Architecture.

---

## Top 10 Next Actions (Impact/Effort ranked)

| # | Action | Impact | Effort | Category |
|---|--------|--------|--------|----------|
| 1 | **Deploy to GitHub Pages** | Removes #1 adoption barrier. CEO can't use it if they can't open it. | 5 min | Deployment |
| 2 | **Add MVP Progress Dashboard** as top-level view | The "command center" - shows 10-step critical path, % complete, what's blocking. THE feature for executives. | Medium | Feature |
| 3 | **Skip side panel → go straight to full view** on card click | Most users stop at the side panel and miss Insights/Action Plan. The full view is where the value lives. | Small | UX |
| 4 | **Add "Last updated" timestamp** in header | Users can't tell if data is stale. Show when data.js and insights-data.js were generated. | Small | UX |
| 5 | **Add broken connection visualization** | The #1 finding (Service Bus mismatch) should show as red dashed lines on the diagram itself. Currently all connections look the same. | Medium | Feature |
| 6 | **Extract CSS to styles.css** | Reduces index.html by 868 lines. Enables caching. Cleaner git diffs. | 15 min | Architecture |
| 7 | **Add search/filter** | With 77 insights across 7 services, finding specific info requires clicking through everything. | Small | UX |
| 8 | **Add bus factor warning badges** on cards | Data already exists. Just surface it visually - red dot when bus factor = 1. | Small | Feature |
| 9 | **Fix text contrast** (#7d8590 → #8b949e) | Fails WCAG AA. Hard to read in bright environments. | 5 min | Accessibility |
| 10 | **Add error boundaries** | If any data file is missing, the app crashes silently. Wrap init in try/catch. | 30 min | Architecture |

---

## UX Improvements (from UX Review)

### P0 - Must Fix
- Add `role="button"`, `tabindex="0"` to clickable cards for keyboard access
- Add text labels alongside color-only status indicators (for colorblind users)

### P1 - Should Fix
- Make full-page view the primary destination (skip side panel or make "Open Full View" unmissable)
- Reorder tabs: Story → **Action Plan** → Insights → Dependencies (put actionable content second)
- Slow down walkthrough auto-advance (3.5s → 5-6s) or default to paused
- Fix narrative formatting (render as paragraphs, not choppy bullet points)
- Fix code blocks in insights (use `<pre><code>` instead of escaped text)
- Add system-wide MVP Plan as a top-level tab (not fragmented across per-service views)
- Show data freshness timestamp in header
- Add onboarding banner for first-time visitors
- Make walkthrough button more prominent (pulsing CTA on first visit)

### P2 - Nice to Have
- Component selector dropdown in full view (navigate between services without closing)
- Deep link to specific tabs: `#detail/quote_mgmt/actionplan`
- Card press feedback (`transform: scale(0.98)` on click)
- Export to PNG/PDF for presentations

---

## Feature Priorities (from Product Review)

### Highest Value Missing Features

| Feature | Value | Effort | Primary Audience |
|---------|-------|--------|-----------------|
| MVP Progress Dashboard (top-level command center) | 10/10 | Medium | Executives |
| Blocker ownership + resolution tracking | 9/10 | Medium | PM |
| Data staleness indicator + auto-refresh | 9/10 | Small | Everyone |
| Deploy to GitHub Pages / Static Web Apps | 9/10 | Small | Everyone |
| Bus factor warning badges | 8/10 | Small | PM, Exec |
| Broken connection visualization | 8/10 | Medium | Everyone |
| Change history / diff between reviews | 8/10 | Medium | PM |
| Search / filter across all data | 6/10 | Small | Dev, PM |

### Competitive Differentiation (what to lean into)
1. **Works for undeployed systems** - no competitor handles pre-production visibility
2. **AI-generated insights IN the architecture context** - not a separate dashboard
3. **Multi-audience design** - CEO and developer in the same tool
4. **Domain-specific** - speaks insurance industry language (CSIO, carriers, bundles)
5. **Zero-infrastructure** - single HTML file, no servers

---

## Architecture Improvements (from Architecture Review)

### Do Now (< 1 hour total)
1. Extract CSS to `styles.css` (15 min)
2. Add try/catch error boundary around app init (30 min)
3. Add `<noscript>` fallback (5 min)
4. Fix text contrast to WCAG AA (#8b949e) (5 min)

### Do Next Month
5. Extract JS to `app.js` (1 hour) - biggest maintainability win
6. GitHub Actions workflow for daily `enrich-data.js` (2-3 hours)
7. Consolidate duplicated status color/label logic (30 min)
8. Add data shape validation at load time (1 hour)
9. De-duplicate hero stat computation (30 min)

### Do When Scaling (15+ services or 2nd developer)
10. Make pipeline layout data-driven (not hardcoded arrays)
11. Virtual scrolling for long lists (insights, commits)
12. Migrate to Svelte/Vue SPA with Vite
13. Move data to lightweight backend (Azure Functions)
14. Add automated testing

### Not Yet (premature)
- Framework migration (no second developer yet)
- Real-time WebSocket updates (nothing is deployed yet)
- TypeScript (overhead not justified for single maintainer)

---

## Build Order for Next Phase

**Phase A: Quick Wins (1-2 hours)**
- Deploy to GitHub Pages
- Extract CSS to styles.css
- Add error boundaries
- Fix text contrast
- Add "Last updated" timestamp
- Add bus factor badges

**Phase B: Core UX (4-6 hours)**
- Make card click → full view (skip side panel)
- Add MVP Progress Dashboard as top-level view
- Add broken connection visualization (red dashed lines from insights data)
- Add search/filter
- Reorder full-view tabs

**Phase C: Automation (4-6 hours)**
- GitHub Actions for daily enrich-data.js
- Blocker resolution tracking (cross-ref with ADO work items)
- Change history / diff view

**Phase D: Polish (ongoing)**
- Accessibility (keyboard nav, ARIA, contrast)
- Walkthrough improvements
- Export/share capabilities
- Sprint/iteration view
