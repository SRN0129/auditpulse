/**
 * Autonomous Browser Testing Agent
 * Drives isolated Chrome browser without touching personal profiles.
 * Executes full customer journey: Scan -> Results -> Dynamic UPI Checkout ->
 * Payment Verification -> Deliverable Report -> Command Dashboard.
 */

const puppeteer = require('puppeteer-core');
const path = require('node:path');
const fs = require('node:fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATED_PROFILE = path.join(__dirname, 'isolated_chrome_profile');
const ARTIFACT_DIR = path.resolve(__dirname, '..', '..'); // Points to brain/<conv-id>

// Ensure profile dir exists
if (!fs.existsSync(ISOLATED_PROFILE)) {
  fs.mkdirSync(ISOLATED_PROFILE, { recursive: true });
}

async function runBrowserSimulation() {
  console.log('[Browser Agent] Launching isolated Chrome session...');
  console.log(`[Browser Agent] Using isolated profile: ${ISOLATED_PROFILE}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Headful so user can watch Chrome operate!
    userDataDir: ISOLATED_PROFILE,
    defaultViewport: { width: 1280, height: 850 },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--window-size=1280,900'
    ]
  });

  const page = await browser.newPage();

  try {
    // 1. Visit Landing Page
    console.log('[Browser Agent] 1. Navigating to AuditPulse storefront (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Submit Test URL for Diagnostic
    console.log('[Browser Agent] 2. Entering target website for audit: https://example.com...');
    await page.waitForSelector('#urlInput');
    await page.type('#urlInput', 'https://example.com', { delay: 40 });
    await page.click('#scanBtn');

    // 3. Wait for Scan Results
    console.log('[Browser Agent] 3. Waiting for diagnostic scan completion...');
    await page.waitForSelector('#resultsCard:not(.hidden)', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    const shot1Path = path.join(ARTIFACT_DIR, 'screenshot_1_scan_results.png');
    await page.screenshot({ path: shot1Path, fullPage: false });
    console.log(`[Browser Agent] Saved screenshot 1: ${shot1Path}`);

    // 4. Open Dynamic UPI Checkout
    console.log('[Browser Agent] 4. Triggering checkout modal for Executive Blueprint...');
    await page.click('#openCheckoutBtn');
    await page.waitForSelector('#checkoutModal:not(.hidden)');
    await new Promise((r) => setTimeout(r, 1500));

    // Fill customer email & simulated UTR
    console.log('[Browser Agent] 5. Providing customer email & verifying dynamic UPI QR...');
    await page.type('#customerEmail', 'first_client@digitalbrand.in', { delay: 30 });
    await page.type('#upiRefInput', 'UPI429019283741', { delay: 30 });

    // 5. Confirm Payment & Access Report
    console.log('[Browser Agent] 6. Confirming payment and requesting instant fulfillment...');
    await page.click('#confirmPaymentBtn');

    // Wait for report page
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('[Browser Agent] 7. Successfully reached client deliverable report!');
    await new Promise((r) => setTimeout(r, 1500));

    const shot2Path = path.join(ARTIFACT_DIR, 'screenshot_2_report_deliverable.png');
    await page.screenshot({ path: shot2Path, fullPage: false });
    console.log(`[Browser Agent] Saved screenshot 2: ${shot2Path}`);

    // Handle any alert dialogs automatically
    page.on('dialog', async (dialog) => {
      console.log(`[Browser Agent] Handled dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    // 6. Navigate to Enterprise OS Dashboard
    console.log('[Browser Agent] 8. Navigating to Enterprise OS Command Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#triggerHunterBtn', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Trigger Hunter Batch
    console.log('[Browser Agent] 9. Triggering Autonomous Hunter batch...');
    await page.click('#triggerHunterBtn');
    await new Promise((r) => setTimeout(r, 2000));

    const shot3Path = path.join(ARTIFACT_DIR, 'screenshot_3_dashboard_financials.png');
    await page.screenshot({ path: shot3Path, fullPage: false });
    console.log(`[Browser Agent] Saved screenshot 3: ${shot3Path}`);

    console.log('[Browser Agent] Full End-to-End Simulation COMPLETE with 100% success!');

  } catch (err) {
    console.error('[Browser Agent] Error during simulation:', err);
  } finally {
    // Keep browser open for a few seconds so user can see, then close
    await new Promise((r) => setTimeout(r, 4000));
    await browser.close();
    console.log('[Browser Agent] Isolated browser session closed.');
  }
}

runBrowserSimulation();
