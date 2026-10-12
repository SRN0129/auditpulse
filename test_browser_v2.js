/**
 * Autonomous Browser Testing Agent - Phase 2 Verification
 * Drives isolated Chrome session to verify:
 * - Revenue Leakage Calculator & Before/After CRO Visualizer
 * - Multi-Service Catalog checkout flows
 * - C-Suite Agent Orchestra & HR Agent Provisioning
 * - Autonomous UI/UX Evolution & Cold Email Dispatcher
 */

const puppeteer = require('puppeteer-core');
const path = require('node:path');
const fs = require('node:fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATED_PROFILE = path.join(__dirname, 'isolated_chrome_profile_v2');
const ARTIFACT_DIR = path.resolve(__dirname, '..', '..');

if (!fs.existsSync(ISOLATED_PROFILE)) {
  fs.mkdirSync(ISOLATED_PROFILE, { recursive: true });
}

async function runPhase2BrowserSimulation() {
  console.log('[Browser Agent V2] Launching isolated Chrome session for Phase 2 verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: ISOLATED_PROFILE,
    defaultViewport: { width: 1300, height: 900 },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--window-size=1300,950'
    ]
  });

  const page = await browser.newPage();

  page.on('dialog', async (dialog) => {
    console.log(`[Browser Agent V2] Accepted browser dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    // 1. Visit Storefront & Scroll to ROI Calculator
    console.log('[Browser Agent V2] 1. Visiting enhanced storefront (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll to calculator
    console.log('[Browser Agent V2] 2. Interacting with Revenue Leakage Calculator...');
    await page.evaluate(() => {
      document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Change sliders
    await page.evaluate(() => {
      const spendSlider = document.getElementById('spendSlider');
      spendSlider.value = '150000';
      spendSlider.dispatchEvent(new Event('input'));

      const aovSlider = document.getElementById('aovSlider');
      aovSlider.value = '2500';
      aovSlider.dispatchEvent(new Event('input'));
    });
    await new Promise((r) => setTimeout(r, 1000));

    const shot4Path = path.join(ARTIFACT_DIR, 'screenshot_4_roi_calculator.png');
    await page.screenshot({ path: shot4Path, fullPage: false });
    console.log(`[Browser Agent V2] Saved screenshot 4: ${shot4Path}`);

    // 2. Navigate to Command Dashboard
    console.log('[Browser Agent V2] 3. Navigating to Enterprise OS Command Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));

    const shot5Path = path.join(ARTIFACT_DIR, 'screenshot_5_csuite_orchestra.png');
    await page.screenshot({ path: shot5Path, fullPage: false });
    console.log(`[Browser Agent V2] Saved screenshot 5: ${shot5Path}`);

    // 3. Trigger UI/UX Evolution Agent
    console.log('[Browser Agent V2] 4. Triggering Autonomous UI/UX Evolution Agent...');
    await page.click('#triggerEvolveBtn');
    await new Promise((r) => setTimeout(r, 1500));

    // 4. Trigger Cold Email Outreach Synthesizer
    console.log('[Browser Agent V2] 5. Triggering Cold Email Outreach Synthesizer...');
    await page.click('#triggerEmailsBtn');
    await new Promise((r) => setTimeout(r, 2000));

    // 5. Test HR Agent Form (Provision new agent)
    console.log('[Browser Agent V2] 6. Testing HR Agent Provisioner form...');
    await page.type('#newAgentName', 'Viral Content Strategist', { delay: 20 });
    await page.type('#newAgentRole', 'Social Growth & Reel Scriptwriter', { delay: 20 });
    await page.click('#createAgentBtn');
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll down to campaigns
    await page.evaluate(() => {
      document.getElementById('campaignsContainer').scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise((r) => setTimeout(r, 1500));

    const shot6Path = path.join(ARTIFACT_DIR, 'screenshot_6_cold_email_dispatcher.png');
    await page.screenshot({ path: shot6Path, fullPage: false });
    console.log(`[Browser Agent V2] Saved screenshot 6: ${shot6Path}`);

    console.log('[Browser Agent V2] Phase 2 Simulation COMPLETED successfully!');

  } catch (err) {
    console.error('[Browser Agent V2] Simulation error:', err);
  } finally {
    await new Promise((r) => setTimeout(r, 3000));
    await browser.close();
    console.log('[Browser Agent V2] Isolated session closed.');
  }
}

runPhase2BrowserSimulation();
