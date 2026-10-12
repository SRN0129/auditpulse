const puppeteer = require('puppeteer-core');
const path = require('node:path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATED_PROFILE = path.join(__dirname, 'isolated_chrome_profile_v2');
const ARTIFACT_DIR = path.resolve(__dirname, '..', '..');

async function testWalletScreenshots() {
  console.log('[Browser Agent] Launching Chrome for Wallet UI verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: ISOLATED_PROFILE,
    defaultViewport: { width: 1300, height: 950 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-extensions']
  });

  const page = await browser.newPage();
  try {
    // 1. Visit /wallet initially locked
    console.log('1. Navigating to http://localhost:3000/wallet (Lock Screen)...');
    await page.goto('http://localhost:3000/wallet', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Lock Screen
    const lockShot = path.join(ARTIFACT_DIR, 'screenshot_10_wallet_lockscreen.png');
    await page.screenshot({ path: lockShot });
    console.log('Saved Lock Screen screenshot to:', lockShot);

    // 2. Enter PIN 7799 and submit
    console.log('2. Entering Owner PIN 7799 to unlock...');
    await page.type('#authPinInput', '7799');
    await new Promise(r => setTimeout(r, 300));
    await page.click('#unlockBtn');
    await new Promise(r => setTimeout(r, 1500));

    // Capture Unlocked Console
    const unlockedShot = path.join(ARTIFACT_DIR, 'screenshot_11_wallet_unlocked_dashboard.png');
    await page.screenshot({ path: unlockedShot, fullPage: false });
    console.log('Saved Unlocked Wallet screenshot to:', unlockedShot);

  } finally {
    await browser.close();
  }
}

testWalletScreenshots().catch(console.error);
