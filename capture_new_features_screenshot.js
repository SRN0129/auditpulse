const puppeteer = require('puppeteer-core');
const path = require('node:path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATED_PROFILE = path.join(__dirname, 'isolated_chrome_profile_v2');
const ARTIFACT_DIR = path.resolve(__dirname, '..', '..');

async function captureNewFeatures() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: ISOLATED_PROFILE,
    defaultViewport: { width: 1300, height: 950 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-extensions']
  });

  const page = await browser.newPage();
  try {
    console.log('Navigating to http://localhost:3000/dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Scroll to and capture Cold Email Dispatcher
    await page.evaluate(() => {
      const el = document.getElementById('campaignsContainer');
      if (el) el.parentElement.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 1000));
    const shotPath12 = path.join(ARTIFACT_DIR, 'screenshot_12_email_dispatcher_console.png');
    await page.screenshot({ path: shotPath12, fullPage: false });
    console.log('Saved Screenshot 12:', shotPath12);

    // 2. Scroll to and capture Social Autopilot
    await page.evaluate(() => {
      const el = document.getElementById('socialPostsContainer');
      if (el) el.parentElement.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 1000));
    const shotPath13 = path.join(ARTIFACT_DIR, 'screenshot_13_social_autopilot_console.png');
    await page.screenshot({ path: shotPath13, fullPage: false });
    console.log('Saved Screenshot 13:', shotPath13);

  } finally {
    await browser.close();
  }
}

captureNewFeatures().catch(console.error);
