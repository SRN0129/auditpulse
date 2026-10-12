const puppeteer = require('puppeteer-core');
const path = require('node:path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATED_PROFILE = path.join(__dirname, 'isolated_chrome_profile_v2');
const ARTIFACT_DIR = path.resolve(__dirname, '..', '..');

async function captureAutonomyDashboard() {
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
    await new Promise(r => setTimeout(r, 1500));

    const shotPath = path.join(ARTIFACT_DIR, 'screenshot_9_autonomous_agent_orchestra.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('Saved screenshot to:', shotPath);
  } finally {
    await browser.close();
  }
}

captureAutonomyDashboard().catch(console.error);
