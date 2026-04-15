import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extPath = path.resolve(__dirname, 'dist');

console.log('Extension path:', extPath);

const browser = await puppeteer.launch({
  headless: false,
  args: [
    `--disable-extensions-except=${extPath}`,
    `--load-extension=${extPath}`,
    '--no-first-run',
    '--disable-default-apps',
  ],
});

// Wait for the extension service worker to load
await new Promise(r => setTimeout(r, 2000));

// Get the extension ID from the service worker targets
const targets = browser.targets();
console.log('\n--- All targets ---');
for (const t of targets) {
  console.log(`  type=${t.type()} url=${t.url()}`);
}

const swTarget = targets.find(
  t => t.type() === 'service_worker' && t.url().includes('chrome-extension://')
);

if (!swTarget) {
  console.error('ERROR: No extension service worker found!');
  // Check for extension pages
  const extTargets = targets.filter(t => t.url().includes('chrome-extension://'));
  console.log('Extension targets:', extTargets.map(t => ({ type: t.type(), url: t.url() })));
  await browser.close();
  process.exit(1);
}

const extId = new URL(swTarget.url()).hostname;
console.log('\nExtension ID:', extId);

// Connect to the service worker and check for errors
const swWorker = await swTarget.worker();
if (swWorker) {
  console.log('Service worker loaded successfully');
}

// Open a test page
const page = await browser.newPage();
await page.goto('https://en.wikipedia.org/wiki/Photosynthesis', { waitUntil: 'domcontentloaded' });
console.log('\nNavigated to Wikipedia page');

// Try clicking the extension icon via Chrome API
// (Puppeteer can't click the toolbar icon directly, so let's test the service worker logic)

// Test 1: Check if context menu was created
console.log('\n--- Test 1: Check service worker console ---');
const swPage = await swTarget.worker();

// Test 2: Try opening side panel directly
console.log('\n--- Test 2: Open side panel page directly ---');
const sidePanelUrl = `chrome-extension://${extId}/src/sidepanel/index.html`;
const panelPage = await browser.newPage();
await panelPage.goto(sidePanelUrl, { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1000));

const panelContent = await panelPage.evaluate(() => document.body.innerText);
console.log('Side panel content:', panelContent.slice(0, 200));

// Check for console errors in the side panel
panelPage.on('console', msg => console.log('  [panel console]', msg.type(), msg.text()));
panelPage.on('pageerror', err => console.log('  [panel error]', err.message));

// Reload to catch console messages
await panelPage.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));

// Test 3: Check options page
console.log('\n--- Test 3: Open options page ---');
const optionsUrl = `chrome-extension://${extId}/src/options/index.html`;
const optionsPage = await browser.newPage();
await optionsPage.goto(optionsUrl, { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1000));

const optionsContent = await optionsPage.evaluate(() => document.body.innerText);
console.log('Options page content:', optionsContent.slice(0, 200));

// Test 4: Try to simulate what happens when action is clicked
// by calling chrome.tabs.captureVisibleTab from the service worker context
console.log('\n--- Test 4: Test captureVisibleTab via service worker ---');
try {
  // We can evaluate in the service worker context
  const cdp = await swTarget.createCDPSession();
  const result = await cdp.send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const tabs = await chrome.tabs.query({active: true, currentWindow: true});
          return JSON.stringify({activeTabs: tabs.map(t => ({id: t.id, url: t.url}))});
        } catch(e) {
          return JSON.stringify({error: e.message});
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log('Active tabs:', result.result.value);
} catch (e) {
  console.log('CDP error:', e.message);
}

console.log('\n--- Tests complete ---');
console.log('Closing browser in 3s...');
await new Promise(r => setTimeout(r, 3000));
await browser.close();
