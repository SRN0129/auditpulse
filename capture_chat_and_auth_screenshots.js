const puppeteer = require('puppeteer-core');
const path = require('node:path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATED_PROFILE = path.join(__dirname, 'isolated_chrome_profile_v3');
const ARTIFACT_DIR = path.resolve(__dirname, '..', '..');

async function captureChatAndAuth() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: ISOLATED_PROFILE,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-extensions']
  });

  const page = await browser.newPage();
  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Open Live Chat Widget
    console.log('Opening Live Chat widget...');
    await page.evaluate(() => {
      window.toggleLiveChat(true);
    });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Click suggestion chip "What's in ₹299 Blueprint?"
    console.log('Clicking suggestion chip...');
    await page.evaluate(() => {
      const chips = document.querySelectorAll('.chat-chip');
      if (chips && chips.length > 0) {
        chips[0].click();
      }
    });

    // Wait 2.5 seconds for AI response to appear
    await new Promise(r => setTimeout(r, 2500));

    const shotPath14 = path.join(ARTIFACT_DIR, 'screenshot_14_live_ai_chat_support.png');
    await page.screenshot({ path: shotPath14, fullPage: false });
    console.log('Saved Screenshot 14:', shotPath14);

    // 3. Close Chat & Open Google Auth Modal
    await page.evaluate(() => {
      window.toggleLiveChat(false);
      const authModal = document.getElementById('authModal');
      const googleAuthModal = document.getElementById('googleAuthModal');
      if (authModal) authModal.classList.add('hidden');
      if (googleAuthModal) googleAuthModal.classList.remove('hidden');
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotPath15 = path.join(ARTIFACT_DIR, 'screenshot_15_google_auth_modal_privacy.png');
    await page.screenshot({ path: shotPath15, fullPage: false });
    console.log('Saved Screenshot 15:', shotPath15);

  } finally {
    await browser.close();
  }
}

captureChatAndAuth().catch(console.error);
