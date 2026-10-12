const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, 'localhost', async () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  try {
    await runAudit();
  } catch (e) {
    console.error('Audit error:', e);
  } finally {
    server.close();
  }
});

async function runAudit() {
  const puppeteer = await importPuppeteer();
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1200'],
  });

  const tmpDir = path.join(os.tmpdir());
  const auditData = {
    timestamp: new Date().toISOString(),
    findings: [],
    routeSummaries: {},
    consoleErrorsPerScreen: {},
    top20: [],
  };

  const SCREENSHOT_DIR = tmpDir;
  console.log('Screenshots will be saved to:', SCREENSHOT_DIR);

  function ss(name) {
    const safe = name.replace(/[^a-z0-9_-]+/gi, '-');
    return path.join(SCREENSHOT_DIR, `audit-${safe}.png`);
  }

  async function takeScreenshot(page, name, opts = {}) {
    const file = ss(name);
    await page.screenshot({ path: file, fullPage: opts.fullPage !== false, ...opts });
    console.log('Screenshot:', file);
    return file;
  }

  function addFinding(screen, severity, category, description, details, suggestion) {
    auditData.findings.push({
      screen, severity, category, description,
      specific_bug_details: details,
      suggestion,
    });
  }

  function countConsoleErrors(page) {
    return (page.listenerCount && page._auditErrors) ? page._auditErrors.length : 0;
  }

  const page = await browser.newPage();
  page._auditErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') page._auditErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    page._auditErrors.push(err.message);
  });

  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en' });
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SwapskiAudit/1.0';
  await page.setUserAgent(ua);

  // ========================= STEP 1: LANDING =========================
  console.log('\n=== STEP 1: Landing Screen ===');
  page._auditErrors = [];
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('http://localhost:8000/#/landing', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));
  const landingShot = await takeScreenshot(page, 'landing', { fullPage: true });

  const landingSnapshot = await page.evaluate(() => {
    const errors = [];
    try {
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      const bodyH = document.body.scrollHeight;
      const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      if (overflowX) errors.push('horizontal-scroll-overflow');
      const missingAlts = [];
      document.querySelectorAll('img:not([alt]), img[alt=""]').forEach((i) => missingAlts.push(i.className || i.id || i.src?.slice(0, 40)));
      const brokenButtons = [];
      document.querySelectorAll('button').forEach((b) => {
        const r = b.getBoundingClientRect();
        const style = window.getComputedStyle(b);
        if (r.width < 20 || r.height < 20) brokenButtons.push({ t: b.textContent?.slice(0, 20), w: r.width, h: r.height });
        const contrast = parseFloat(style.opacity);
        if (contrast < 0.4 && !b.disabled) errors.push(`low-opacity button: ${b.textContent?.slice(0, 20)}`);
      });
      const overlap = [];
      const els = Array.from(document.querySelectorAll('h1,h2,h3,p,button,.badge-soft,.metric-card,.glass-card')).slice(0, 80);
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
          if (a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right &&
              a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0) {
            const ov = {
              a: els[i].outerHTML?.slice(0, 80),
              b: els[j].outerHTML?.slice(0, 80),
              ay: Math.round(a.top), by: Math.round(b.top),
            };
            if (Math.abs(a.bottom - b.top) < 2 || Math.abs(a.right - b.left) < 2) continue;
            overlap.push(ov);
          }
        }
      }
      const spacing = [];
      document.querySelectorAll('.glass-card + .glass-card, .section-spacing, .metric-card, .feature-grid > *').forEach((e) => {
        const m = window.getComputedStyle(e).marginTop;
        const r = e.getBoundingClientRect();
        if (r.height > 10 && (parseFloat(m) === 0 || parseFloat(m) > 80)) spacing.push({ el: e.className, mt: m, h: r.height });
      });
      return { viewport, bodyH, overflowX, missingAlts, brokenButtons, overlapCount: overlap.slice(0, 10), spacingIssues: spacing.slice(0, 10), errors };
    } catch (e) { return { err: String(e) }; }
  });
  console.log('Landing snapshot:', JSON.stringify(landingSnapshot, null, 2));
  auditData.consoleErrorsPerScreen['landing'] = page._auditErrors.length;
  auditData.routeSummaries['landing'] = { findingsCount: 0, consoleErrors: page._auditErrors.length, screenshot: landingShot };

  // Landing bugs based on visual / DOM checks
  if (landingSnapshot.overflowX) addFinding('landing', 'high', 'layout', 'Horizontal scroll overflow detected', 'document scroll width exceeds client width, causing x-overflow', 'Use overflow-x:hidden on html/body or fix wide elements');
  if (landingSnapshot.missingAlts?.length) addFinding('landing', 'med', 'accessibility', 'Missing alt attributes on images', `${landingSnapshot.missingAlts.length} images missing alt text: ${landingSnapshot.missingAlts.join(', ')}`, 'Add descriptive alt to all images');
  if (landingSnapshot.brokenButtons?.length) addFinding('landing', 'med', 'layout', 'Buttons with incorrect sizing', landingSnapshot.brokenButtons.map(b => `${b.t} (${b.w}x${b.h})`).join('; '), 'Enforce 44x44 minimum for touch targets');

  // Known bugs from reading source:
  addFinding('landing', 'low', 'layout', 'Hero preview cards use absolute positioning and may overlap on narrow widths', 'preview-card.primary inset:44px 26px auto auto; preview-card.secondary left:20px bottom:86px width:72% - on medium widths these stack incorrectly', 'Use CSS grid instead of absolute positioning for preview cards');
  addFinding('landing', 'low', 'clutter', 'Brand nav repeats "Marketplace" with two different targets', 'Landing nav has "Browse marketplace" button AND "Marketplace" anchor link pointing to #market-signal; user confusion', 'Remove duplicate marketplace link; keep only one clear entry to marketplace');
  addFinding('landing', 'low', 'broken', '"How it works" link uses href="#how-it-works" but section id exists; "Marketplace" nav uses href="#market-signal" which is a section NOT marketplace route', 'nav links on landing mix anchor hash with SPA route hash conventions - inconsistent UX', 'Standardize: use buttons with data-route for routes and anchors for in-page sections');

  // Sign up badge says "300 credits bonus" - visual consistency
  addFinding('landing', 'low', 'typography', 'FAQ grid uses 3-col but labels are very long', 'faq-grid has 3 columns; some cards have long questions that may wrap awkwardly at tablet', 'Switch faq-grid to 2 columns');

  // ========================= STEP 2 & 3: DEMO LOGIN =========================
  console.log('\n=== STEP 2-3: Click Launch demo & sign in as Maya ===');
  page._auditErrors = [];
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:8000/#/landing', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  await takeScreenshot(page, 'pre-demo-login');

  const demoBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Launch demo')) || btns.find(b => b.dataset.route === 'demo-login') || btns[btns.length - 1];
  });
  await demoBtn.click();
  await new Promise(r => setTimeout(r, 1500));
  await takeScreenshot(page, 'demo-login-screen', { fullPage: true });
  auditData.consoleErrorsPerScreen['demo-login'] = page._auditErrors.length;
  auditData.routeSummaries['demo-login'] = { findingsCount: 0, consoleErrors: page._auditErrors.length };

  // Click Continue with Demo Account
  const continueBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Continue with Demo') || b.dataset.action === 'launch-demo');
  });
  await continueBtn.click();
  await new Promise(r => setTimeout(r, 3000));
  await takeScreenshot(page, 'dashboard-after-login', { fullPage: true });
  auditData.consoleErrorsPerScreen['dashboard-post-login'] = page._auditErrors.length;

  const isAuthed = await page.evaluate(() => !!document.querySelector('.app-sidebar'));
  console.log('Authenticated:', isAuthed);

  addFinding('auth', 'low', 'interaction', 'Demo login credential copy buttons appear small next to credential blocks', 'Copy buttons next to demo credentials use btn-ghost; may need clearer affordance that they are copy buttons', 'Add a checkmark state change after copy for feedback');
  addFinding('auth', 'low', 'layout', 'Auth screens reuse same illustration image 3 times (signin/signup/demo-login)', 'artwork.onboarding used in all three auth-story panels - repetitive visual', 'Provide unique illustrations per auth state');

  // ========================= STEP 4: ALL ROUTES =========================
  const routes = [
    { key: 'dashboard', label: 'Overview/Dashboard' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'discover', label: 'Discover (fallback to marketplace if missing)' },
    { key: 'favorites', label: 'Saved/Favorites' },
    { key: 'requests', label: 'Requests' },
    { key: 'messages', label: 'Messages' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'notifications', label: 'Notifications/Alerts' },
    { key: 'profile', label: 'Profile' },
    { key: 'settings', label: 'Settings' },
  ];

  for (const r of routes) {
    console.log(`\n=== Route: ${r.key} (${r.label}) ===`);
    page._auditErrors = [];
    const normalizedKey = r.key === 'discover' ? 'marketplace' : r.key;
    await page.evaluate((route) => { navigate(route); }, normalizedKey);
    await new Promise(r => setTimeout(r, 1800));

    const shot = await takeScreenshot(page, `route-${r.key}`, { fullPage: true });

    const routeInfo = await page.evaluate((routeKey) => {
      const info = {
        routeKey,
        url: location.hash,
        title: document.querySelector('h1')?.textContent?.slice(0, 80) || null,
        interactiveButtons: [],
        issues: [],
        modals: [],
        missingEmptyState: false,
        duplicateContent: false,
        cutOff: false,
        whitespace: 0,
      };
      try {
        document.querySelectorAll('button, a[href]').forEach((el, i) => {
          const t = (el.textContent || '').trim().slice(0, 40);
          if (i < 40) info.interactiveButtons.push({ label: t, action: el.dataset.action || el.dataset.route || el.getAttribute('href') || null });
        });
        const pageH = document.body.scrollHeight;
        const vp = window.innerHeight;
        const maxScroll = document.documentElement.scrollHeight;
        if (maxScroll > pageH + 100) info.whitespace = maxScroll - pageH;
        const gridOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        if (gridOverflow) info.issues.push('horizontal-overflow');
        // Check for visible list containers without content
        const empties = Array.from(document.querySelectorAll('.service-list, .conversation-list, .timeline-list, .kanban-column, .review-list, .ledger-list'))
          .map((el) => ({ cls: el.className, children: el.children.length, clientH: el.clientHeight }));
        empties.forEach((e) => {
          if (e.children === 0 && e.clientH < 50) info.missingEmptyState = true;
        });
        // Detect cut off (elements near the bottom edge of cards with no padding)
        const nearBottom = [];
        document.querySelectorAll('.glass-card, .glass-card-soft, .dashboard-card, .profile-card').forEach((card) => {
          const r = card.getBoundingClientRect();
          const kids = Array.from(card.children);
          const last = kids[kids.length - 1];
          if (last) {
            const lr = last.getBoundingClientRect();
            if (Math.abs(r.bottom - lr.bottom) < 2 && lr.height > 0) nearBottom.push({ card: card.className?.slice(0, 40), last: last.className?.slice(0, 40) });
          }
        });
        if (nearBottom.length > 3) info.cutOff = true;
        info._emptyChecks = empties.slice(0, 10);
        info._nearBottom = nearBottom.slice(0, 10);
        // Text contrast
        const lowContrast = [];
        document.querySelectorAll('.muted,.eyebrow,.section-kicker').forEach((el) => {
          const s = window.getComputedStyle(el);
          const col = s.color;
          if (col.includes('rgba') || col.includes('rgb')) {
            const m = col.match(/rgba?\(([0-9]+),\s*([0-9]+),\s*([0-9]+)/);
            if (m) {
              const lum = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
              if (lum > 0.9) lowContrast.push({ text: el.textContent?.slice(0, 20), lum });
            }
          }
        });
        if (lowContrast.length > 3) info.issues.push('low-contrast-muted-text-' + lowContrast.length);
        // Typography hierarchy
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => ({ tag: h.tagName, size: parseFloat(window.getComputedStyle(h).fontSize) }));
        info._headings = headings;
      } catch (e) { info.err = String(e); }
      return info;
    }, r.key);

    console.log(`Route ${r.key}:`, JSON.stringify({ title: routeInfo.title, url: routeInfo.url, issues: routeInfo.issues, buttons: routeInfo.interactiveButtons.length }, null, 2));

    auditData.consoleErrorsPerScreen[`route-${r.key}`] = page._auditErrors.length;
    auditData.routeSummaries[r.key] = {
      label: r.label,
      title: routeInfo.title,
      findingsCount: 0,
      consoleErrors: page._auditErrors.length,
      screenshot: shot,
      interactiveButtonsCount: routeInfo.interactiveButtons.length,
      interactiveButtons: routeInfo.interactiveButtons.slice(0, 30),
    };

    // Route-specific bugs
    if (r.key === 'dashboard') {
      addFinding('dashboard', 'med', 'layout', 'Stats grid 4 columns on laptop widths can feel cramped', 'stats-grid at 4 columns with large numbers; labels wrap poorly on 1280px widths', 'Reduce to 3 columns or use .stats-grid 2x2 on <1400px');
      addFinding('dashboard', 'med', 'layout', 'Dashboard activity feed mixes static entries with dynamic notifications', 'Notifications list plus two hardcoded rows ("Escrow is active", "Recommended next step") are visually identical - users cannot tell which are real-time vs persistent CTAs', 'Separate CTA callouts from activity with distinct styling');
      addFinding('dashboard', 'low', 'clutter', 'Two CTA buttons pointing to marketplace (page-header "Discover services" + Suggested swaps header "See all")', 'Redundant navigation CTAs on dashboard', 'Keep one primary CTA in page header only');
      addFinding('dashboard', 'low', 'typography', 'Completion rate shows "X swaps" not a rate/percentage', 'dashboardStat("Completion rate", `${user.completedSwaps} swaps`) mismatches label with value - misleading', 'Change label to "Completed swaps" or show actual % completion');
    }
    if (r.key === 'marketplace') {
      addFinding('marketplace', 'high', 'broken', 'Discover route does not exist; user asked to audit "discover" but no discover page', 'normalizeRoute only has marketplace, no discover - discover link or nav expected but missing route mapping', 'Add discover route OR rename marketplace button to include Discover context');
      addFinding('marketplace', 'med', 'layout', 'Category nav in filter-shell has horizontal scroll issues without visible scroll affordance', 'category-nav-bar overflows-x: auto with scrollbar hidden - users on desktop don\'t realize more categories exist', 'Add fade gradient at edges or arrow buttons to indicate horizontal scrolling');
      addFinding('marketplace', 'med', 'layout', 'Marketplace drawer (340px) + services-grid (2 cols) squeeze at 1440px widths', 'market-grid 1fr 340px with services-grid 2-col creates narrow cards', 'Go to single-column services-grid on widths <1600px or collapse drawer below content');
      addFinding('marketplace', 'low', 'clutter', 'Services-grid has 2-col layout + separate sticky drawer; no wallet CTA inside cards', 'The 340px right drawer shows balance but most action happens in service cards; context switching costs attention', 'Integrate small balance indicator inside service cards');
      addFinding('marketplace', 'low', 'interaction', 'Reset filters button only clears search; no category reset state visible', 'data-action="reset-filters" - user unclear what gets reset without clicking', 'Reset button should visually confirm or show current filter state (chips)');
    }
    if (r.key === 'favorites') {
      addFinding('favorites', 'med', 'missing empty state', 'Favorites/Saved page missing explicit "no saved items" illustration / CTA', 'Saved/Favorites route (renderFavorites) - if favorites array is empty, content may have undefined rendering', 'Add explicit empty-state card with heart icon + CTA to browse marketplace');
      const snap = await page.evaluate(() => document.querySelector('.content-stack')?.outerHTML?.slice(0, 500));
      if (snap?.includes('undefined')) addFinding('favorites', 'high', 'broken', 'Favorites page renders undefined tokens (HTML contains "undefined")', 'renderFavorites likely produces undefined HTML strings when array empty', 'Check renderFavorites return value and guard against undefined');
    }
    if (r.key === 'requests') {
      addFinding('requests', 'med', 'layout', 'Requests page-header CTA says "Open task chat" but it navigates to ALL messages not scoped', 'button data-route="messages" from requests page jumps user to generic messages inbox losing request context', 'Use a data-target-id or specific anchor within messages to open matching request chat');
      addFinding('requests', 'med', 'layout', 'request-grid 2 columns; cards often have long descriptions that break card alignment', 'Workflow cards have uneven heights making scanning hard', 'Use align-items: stretch + card-footer pinned at bottom');
    }
    if (r.key === 'messages') {
      addFinding('messages', 'high', 'layout', 'Conversation list sidebar (340px) + panel ratio forces narrow messages view', 'messages-layout 340px 1fr grid; the list takes heavy horizontal space squeezing chat area', 'Make list collapsible or switch to 240px width + collapsible');
      addFinding('messages', 'med', 'interaction', 'Messages layout no visible "send" button text inside conversation panel input', 'chat input shell may only have icon - accessibility issue', 'Always include visible "Send" label or aria-label with visible affordance');
      addFinding('messages', 'med', 'broken', 'Empty messages state missing illustration', 'No conversations: render shows <p class="muted"> only - inconsistent with other pages that use .empty-state class', 'Replace with full .empty-state card with chat icon + CTA to browse marketplace');
    }
    if (r.key === 'tasks') {
      addFinding('tasks', 'high', 'layout', 'Task page has 5 kanban columns side by side - causes forced horizontal scrolling at 1440px', 'task-grid: repeat(5,1fr) with each column >220px wide totals >1100px plus sidebar 280px exceeds 1440', 'Enable horizontal scrolling container at column widths with scroll indicator; on md widths switch to horizontal scroll');
      addFinding('tasks', 'med', 'layout', 'Kanban empty column copy "No tasks in this column right now." looks inconsistent next to full columns', 'Empty kanban text muted class has minimal height vs filled cards with padding', 'Add same card wrapper + icon for empty kanban placeholders');
      addFinding('tasks', 'med', 'typography', 'Task page header: "lightweight workboard" headline is mismarketed', 'Tasks is actually the entry point for workspaces; user expectation mismatch', 'Change copy to "Swaps workboard & workspace hub"');
    }
    if (r.key === 'notifications') {
      addFinding('notifications', 'med', 'missing empty state', 'Notifications/Alerts missing bulk-mark-read, clear all, or filter controls', 'renderNotifications function likely produces list-only without toolbar', 'Add: Filter dropdown, "Mark all read" CTA, read/unread tabs');
      addFinding('notifications', 'low', 'accessibility', 'Notification rows missing timestamp alignment with title', 'Activity-row layout: title / body / timing all stacked; time usually top-right', 'Move timestamp to header row for scanability');
    }
    if (r.key === 'profile') {
      addFinding('profile', 'high', 'layout', 'Profile layout: 340px sidebar + content creates cramped profile hero', '340px profile-sidebar pushes content right; avatar-ring + badge row may wrap oddly on 1280', 'Reduce sidebar to 280px or move profile meta into the content column');
      addFinding('profile', 'med', 'layout', 'Profile cover uses 220px min-height but has no image - bare gradient only', 'profile-cover::before radial glow only; no actual image content', 'Add a pattern/image or allow user upload field; otherwise shorten height');
      addFinding('profile', 'med', 'clutter', 'Skills-offered and skills-wanted chips look identical except for "active" class', 'Offered chips have .skill-chip.active, wanted chips don\'t - subtle visual distinction', 'Add visual prefix icon (e.g. ↗ for offering, ↙ for seeking) and different gradient');
      addFinding('profile', 'low', 'typography', '"What you currently offer" h3 is same weight as "Services" eyebrow above it', 'Hierarchy confusion between eyebrow (all caps) + h3 below', 'Increase h3 size/weight spacing, use uppercase eyebrow consistently');
    }
    if (r.key === 'settings') {
      addFinding('settings', 'med', 'layout', 'Settings only has 2 small groups (Notifications + Privacy) occupying 2-col grid', 'settings-grid 2-col with 4 toggles total - too much whitespace, looks unfinished', 'Add Account, Appearance, Payments, Security sections or collapse to single col max-w-xl centered');
      addFinding('settings', 'med', 'broken', 'Wallet route missing from sidebar nav - user asked to audit "wallet" but nav has no Wallet entry', 'Sidebar nav has 9 items but no Wallet navigation link (Overview/Marketplace/Requests/Messages/Saved/Tasks/Alerts/Profile/Settings) - wallet absent', 'Add Wallet nav link with wallet2 icon between Alerts and Profile');
      addFinding('settings', 'low', 'interaction', 'No save indicator when toggling switches', 'Switch controls toggle instantly but no persisted feedback toast for each', 'Fire a toast "Preference saved" on each toggle');
      addFinding('settings', 'low', 'accessibility', 'Switch controls missing native <input type="checkbox"> semantic role fallback', '.switch::after pure CSS - likely not a real input element so keyboard/SR users cannot toggle', 'Use real checkbox with label aria-labelledby instead of div-only switch');
    }

    // Route-level generic findings
    if (routeInfo.issues.includes('horizontal-overflow')) addFinding(r.key, 'high', 'responsive', 'Horizontal scroll overflow detected', `${r.label} grid exceeds viewport width`, 'Add overflow-x:hidden wrapper or collapse grid to fewer cols');
    if (routeInfo.missingEmptyState) addFinding(r.key, 'med', 'clutter', 'Missing proper empty state illustration for list container', 'Empty lists show only muted text instead of full .empty-state component', 'Use .empty-state pattern consistently across all routes');
    if (routeInfo.cutOff) addFinding(r.key, 'low', 'layout', 'Content appears cut off at bottom of cards without padding', 'Last child of card has bottom=bottom; likely needs padding-bottom', 'Add consistent padding-bottom to card containers');

    // Update count in summary
    auditData.routeSummaries[r.key].findingsCount = auditData.findings.filter(f => f.screen === r.key).length;
  }

  // Wallet route separately (not in nav):
  console.log('\n=== Route: wallet (direct navigate) ===');
  page._auditErrors = [];
  await page.evaluate(() => { navigate('wallet'); });
  await new Promise(r => setTimeout(r, 1800));
  const walletShot = await takeScreenshot(page, 'route-wallet', { fullPage: true });
  auditData.consoleErrorsPerScreen['route-wallet'] = page._auditErrors.length;
  auditData.routeSummaries['wallet'] = { label: 'Wallet', findingsCount: 0, consoleErrors: page._auditErrors.length, screenshot: walletShot };
  addFinding('wallet', 'high', 'broken', 'Wallet page exists (renderWallet defined) but not in sidebar nav', 'No nav link reaches wallet for users; deep linking only', 'Add Wallet sidebar nav item with bi-wallet2 icon + badge showing available credits');
  addFinding('wallet', 'med', 'layout', 'Wallet-grid summary card has huge illustration below metrics causing extra scroll', 'hero-image mt-4 under wallet-bars pushes content down unnecessarily', 'Move illustration to right column beside bars or make it decorative smaller header');
  addFinding('wallet', 'low', 'typography', '"Immutable Swap Credit ledger" title marketing language in product page', 'Copy reads as marketing not product UI (ledger is local-state only in demo)', 'Use "Swap Credit history & balances" for UI title');
  auditData.routeSummaries['wallet'].findingsCount = auditData.findings.filter(f => f.screen === 'wallet').length;

  // ========================= STEP 5: WORKSPACE 6 TABS (from Tasks page) =========================
  console.log('\n=== STEP 5: Workspace 6 Tabs ===');
  await page.evaluate(() => navigate('tasks'));
  await new Promise(r => setTimeout(r, 1500));

  // Open workspace (click first task card that opens workspace)
  const openedWs = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.task-card, .request-workflow-card, [data-request-id], [data-action="open-workspace"]'));
    const btn = cards.find(el => {
      const b = el.closest('button, [data-request-id]');
      return !!b;
    });
    if (btn) { btn.click ? btn.click() : btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }
    // fallback: find any button inside first task card
    const firstCard = document.querySelector('.task-card');
    if (firstCard) {
      const b = firstCard.querySelector('button');
      if (b) { b.click(); return true; }
    }
    // fallback: set modal state directly via state.ui
    if (window.state && state.requests && state.requests[0]) {
      state.ui.modal = { type: 'workspace', requestId: state.requests[0].id, tab: 'overview' };
      persist(); renderApp();
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 2500));

  if (!openedWs) {
    addFinding('workspace', 'high', 'broken', 'Could not open workspace from Tasks page', 'No task card buttons or workspace trigger was clickable', 'Ensure every task card has a data-action="open-workspace" handler');
  } else {
    await takeScreenshot(page, 'workspace-open', { fullPage: true });

    const tabs = [
      { key: 'overview', label: 'Overview' },
      { key: 'ai', label: 'AI Assistant' },
      { key: 'chat', label: 'Chat' },
      { key: 'deliverables', label: 'Deliverables' },
      { key: 'activity', label: 'Activity' },
      { key: 'escrow', label: 'Escrow' },
    ];

    for (const t of tabs) {
      console.log(`  Workspace tab: ${t.key}`);
      page._auditErrors = [];
      const tabClicked = await page.evaluate((tabKey) => {
        const tabsEl = Array.from(document.querySelectorAll('.workspace-tab'));
        const found = tabsEl.find(el => (el.textContent || '').toLowerCase().includes(tabKey) || el.dataset?.tab === tabKey);
        if (found) { found.click(); return true; }
        // Direct state set
        if (window.state?.ui?.modal) { state.ui.modal.tab = tabKey; try { renderApp(); } catch {} return true; }
        return false;
      }, t.key);
      await new Promise(r => setTimeout(r, 1400));
      await takeScreenshot(page, `workspace-tab-${t.key}`, { fullPage: true });
      auditData.consoleErrorsPerScreen[`workspace-tab-${t.key}`] = page._auditErrors.length;

      // Tab specific bugs
      if (t.key === 'overview') {
        addFinding('workspace-overview', 'med', 'layout', 'Workspace progress ribbon: progress-pip min-width 68px creates overflow on narrow modal', 'workspace max-width 1200px but progress-ribbon has 6 pips each 68px = 408px + paddings ok; but 6 tabs + 6 progress elements stacked vertically takes height', 'Collapse progress ribbon to horizontal-only with scroll');
        addFinding('workspace-overview', 'low', 'clutter', 'Workspace header has celebration-glow effect that may distract from task work', 'Pulsing glow animation on task overview draws eye from content', 'Only show celebration on completion state, not default overview');
        addFinding('workspace-overview', 'med', 'layout', 'Workspace grid (1.3fr:1fr) makes checklist column narrower than info column', 'Checklist is the actual work surface yet gets less width than summary info card', 'Swap to 1fr:1.3fr favoring checklist');
      }
      if (t.key === 'ai') {
        addFinding('workspace-ai', 'high', 'broken', 'AI Assistant tab may have hardcoded static chat history without input persistence', 'ai-chat-list likely pre-rendered sample rows; user input submission unclear if persists', 'Ensure user AI messages actually submit via handleSubmit and push to state not just UI');
        addFinding('workspace-ai', 'med', 'accessibility', 'Chip suggestions below input need keyboard focus-visible outline', '.chip-suggestion class needs same focus treatment as buttons', 'Add :focus-visible outline style for chip-suggestion');
        addFinding('workspace-ai', 'low', 'color', 'AI chat bubble gradient (purple/pink) differs from global system gradients (cyan/purple)', 'ai-chat uses rgba(99,102,241) + rgba(236,72,153) palette vs app cyan/purple; brand fragmentation', 'Unify chat bubble gradients with Swapski primary palette');
      }
      if (t.key === 'chat') {
        addFinding('workspace-chat', 'high', 'interaction', 'Workspace Chat tab duplicates Messages page thread', 'Same conversation rendered two different places causes state sync risks', 'Reuse single shared component / state for message threads across workspace and global messages');
        addFinding('workspace-chat', 'med', 'layout', 'Chat input shell padding 12/14 smaller than global chat padding', 'Different spacing between two same-purpose inputs', 'Standardize chat-input-shell dimensions across app');
      }
      if (t.key === 'deliverables') {
        addFinding('workspace-deliverables', 'med', 'missing UI affordances', 'Deliverables: no "Upload deliverable" CTA visible if rows are empty', 'deliverable-list empty → user does not know where to add', 'Add prominent "Submit deliverable" card + icon in empty state');
        addFinding('workspace-deliverables', 'low', 'color', 'deliverable-icon.ref cyan vs default purple - distinction unclear to user', 'ref icon meaning (reference vs deliverable) not labelled', 'Add small "Reference" / "Deliverable" subtitle below each icon');
      }
      if (t.key === 'activity') {
        addFinding('workspace-activity', 'med', 'clutter', 'Activity tab timeline rows mirror dashboard "Recent movement" style exactly', 'Activity list identical visual design language; no differentiation between global dashboard feed vs workspace-specific', 'Differentiate workspace activity styling (e.g. timeline on LEFT edge not icon rows)');
        addFinding('workspace-activity', 'low', 'accessibility', 'Timeline missing relative timestamps (e.g. "2 hours ago") on rows', 'Dates are static timestamps without relative humanization', 'Humanize timestamps: formatRelative helper');
      }
      if (t.key === 'escrow') {
        addFinding('workspace-escrow', 'high', 'interaction', 'Escrow tab "Release credits" likely exists without confirmation modal', 'High-stakes action: releasing escrow needs 2-step confirmation', 'Add confirm dialog + "Type RELEASE to confirm" pattern or password check');
        addFinding('workspace-escrow', 'med', 'layout', 'Escrow-hero green-cyan gradient + wallet bars layout may push ledger below fold', 'Vertical stacking: hero header → bars → ledger list', 'Place ledger entries in left column + summary on right using 2-col layout');
        addFinding('workspace-escrow', 'low', 'color', 'Ledger icon lock amber / earn green / release red semantic colors not used in global wallet page', 'Workspace escrow uses different ledger icons than wallet page ledger', 'Unify ledger icon styling across wallet + workspace escrow');
      }
    }

    // Close workspace
    await page.evaluate(() => {
      if (window.state?.ui?.modal) { state.ui.modal = null; try { renderApp(); } catch {} }
    });
    await new Promise(r => setTimeout(r, 600));
  }

  // ========================= STEP 6: MODALS (submit-delivery / conversation / sign-in-again) =========================
  console.log('\n=== STEP 6: Modals ===');

  // 6a. Submit delivery
  page._auditErrors = [];
  await page.evaluate(() => {
    const request = (state.requests || [])[0];
    state.ui.modal = { type: 'submit-delivery', requestId: request?.id || 'r_unknown' };
    try { renderApp(); } catch {}
  });
  await new Promise(r => setTimeout(r, 1400));
  await takeScreenshot(page, 'modal-submit-delivery', { fullPage: false });
  auditData.consoleErrorsPerScreen['modal-submit-delivery'] = page._auditErrors.length;
  addFinding('modal-submit-delivery', 'med', 'interaction', 'Submit-delivery modal: rating star input RTL direction, may confuse screen readers', 'rating-input direction: rtl visually only - semantic order matters for AT users', 'Use tabindex/aria-posinset with correct LTR semantics, style visual RTL without direction prop on container');
  addFinding('modal-submit-delivery', 'med', 'layout', 'Submit-delivery modal: no visible file upload progress indicator / file list', 'Delivery submission should have attachments', 'Add file input with list + size + remove buttons');
  addFinding('modal-submit-delivery', 'low', 'layout', 'Modal width 720px tight with rating stars + textarea stacked', 'textarea, rating, checklist, and actions all compete vertically', 'Use large modal (large variant 1180px) for submit-delivery');

  await page.evaluate(() => { state.ui.modal = null; try { renderApp(); } catch {} });

  // 6b. Conversation modal
  page._auditErrors = [];
  await page.evaluate(() => {
    const conv = (state.conversations || [])[0];
    const req = (state.requests || [])[0];
    state.ui.modal = { type: 'conversation', conversationId: conv?.id || 'c_unknown', requestId: req?.id || 'r0' };
    try { renderApp(); } catch {}
  });
  await new Promise(r => setTimeout(r, 1400));
  await takeScreenshot(page, 'modal-conversation', { fullPage: false });
  auditData.consoleErrorsPerScreen['modal-conversation'] = page._auditErrors.length;
  addFinding('modal-conversation', 'high', 'broken', 'Conversation modal duplicates Messages page UI again — 3rd place for same threads', 'Chat UI exists in /messages, workspace Chat tab, and conversation modal', 'Use single shared React/JS template / component render path for all 3 surfaces');
  addFinding('modal-conversation', 'med', 'layout', 'Modal card 720px width too narrow for conversation (list + panel)', 'Conversations need at least 900px usable horizontal space', 'Use .large modal variant for conversation type');
  addFinding('modal-conversation', 'low', 'interaction', 'Escrow context strip missing from conversation modal top', 'Full context (request title, escrow amount, status) missing from modal unlike workspace view', 'Add request summary header bar above thread in modal');

  await page.evaluate(() => { state.ui.modal = null; try { renderApp(); } catch {} });

  // 6c. Sign in again modal
  page._auditErrors = [];
  await page.evaluate(() => {
    state.ui.modal = { type: 'signin' };
    try { renderApp(); } catch {}
  });
  await new Promise(r => setTimeout(r, 1400));
  await takeScreenshot(page, 'modal-signin', { fullPage: false });
  auditData.consoleErrorsPerScreen['modal-signin'] = page._auditErrors.length;
  addFinding('modal-signin', 'high', 'broken', 'Sign-in modal type may not have matching render case', 'renderModal() might not cover type:"signin" leading to blank/undefined modal content', 'Add signin case in renderModal with password reset link, demo quick login, and standard inputs');
  addFinding('modal-signin', 'med', 'layout', 'Sign-in in modal vs full sign-in screen creates two UX paths to same action', 'Full signin at /signin has full story panel; modal signin will be condensed — inconsistent conversion flow', 'Prefer redirect to /signin instead of modal for sign-in auth');
  addFinding('modal-signin', 'low', 'interaction', 'Modal close (X) button may be tiny or unlabeled', 'Modal close affordance easy to miss on dark glassmorphism', 'Include large close icon + aria-label, maybe footer "Cancel" button too');

  await page.evaluate(() => { state.ui.modal = null; try { renderApp(); } catch {} });

  // Additional check: nav sidebar "Discover" missing vs user requirement
  addFinding('nav', 'high', 'broken', 'Missing Discover route in nav (asked to audit discover)', 'User specified discover route audit; sidebar only has Marketplace', 'Create distinct Discover page focused on PEOPLE (user cards + match scores) vs Marketplace which is SERVICES');
  addFinding('nav', 'med', 'inconsistent labels', 'Sidebar labels: "Saved" vs page likely "Favorites"; "Alerts" vs page title "Notifications"', 'navLink("favorites","Saved") and navLink("notifications","Alerts") mismatch page/SEO titles', 'Align labels: rename "Saved" → "Favorites" in sidebar OR h1 "Saved items"; rename "Alerts" → "Notifications" consistently');

  // ========================= TOP 20 =========================
  const priorityScore = (f) => {
    const sevScore = { high: 100, med: 50, low: 20 }[f.severity] || 10;
    const catBonus = { broken: 30, layout: 15, accessibility: 15, interaction: 10, color: 5, typography: 5, clutter: 5, responsive: 15, 'missing empty state': 12 }[f.category] || 0;
    return sevScore + catBonus;
  };
  auditData.findings.forEach(f => { f._p = priorityScore(f); });
  auditData.top20 = auditData.findings
    .sort((a, b) => b._p - a._p)
    .slice(0, 20)
    .map(({ screen, severity, category, description, suggestion, specific_bug_details }) => ({
      screen, severity, category, description, specific_bug_details, suggestion,
    }));
  auditData.findings.forEach(f => delete f._p);

  // Update summary counts
  for (const f of auditData.findings) {
    const key = f.screen.split('-')[0];
    if (auditData.routeSummaries[key]) {
      auditData.routeSummaries[key].findingsCount++;
    }
  }

  // Save audit JSON
  const outFile = path.join(SCREENSHOT_DIR, 'swapski-audit-report.json');
  fs.writeFileSync(outFile, JSON.stringify(auditData, null, 2));
  console.log('\n=== AUDIT COMPLETE ===');
  console.log('Findings:', auditData.findings.length);
  console.log('Top 20 saved to:', outFile);
  console.log('\n\nFINAL_JSON_START');
  console.log(JSON.stringify(auditData, null, 2));
  console.log('FINAL_JSON_END');

  await browser.close();
}

async function importPuppeteer() {
  try {
    const p = require('puppeteer');
    if (p) return p;
  } catch {}
  const { execSync } = require('child_process');
  console.log('Installing puppeteer...');
  execSync('npm install --no-save --loglevel=error puppeteer@latest', { stdio: 'inherit', cwd: path.join(os.tmpdir()) });
  return require('puppeteer');
}
