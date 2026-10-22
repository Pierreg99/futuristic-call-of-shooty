import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'screenshots');
const baseUrl = 'http://127.0.0.1:8080';
const screenshots = [
  '01-start-screen.png',
  '02-gameplay-afg7.png',
  '03-hangar-alpha.png',
  '04-apex-spire.png',
  '05-gold-apex.png',
  '06-mobile-touch.png'
];

await mkdir(output, { recursive: true });
for (const file of screenshots) {
  await rm(path.join(output, file), { force: true });
}

const server = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore'
});
let browser;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openGame(page) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForSelector('#webgl-canvas', { timeout: 10000 });
      await page.waitForTimeout(900);
      const graphics = await page.evaluate(() => {
        const canvas = document.querySelector('#webgl-canvas');
        return {
          canvas: Boolean(canvas),
          size: canvas ? [canvas.width, canvas.height] : [],
          webgl2: Boolean(canvas && canvas.getContext('webgl2'))
        };
      });
      if (!graphics.canvas || !graphics.webgl2) {
        throw new Error('The game canvas did not initialize a WebGL2 context.');
      }
      return;
    } catch (error) {
      lastError = error;
      await wait(750);
    }
  }
  throw lastError ?? new Error('Could not open the local game.');
}

async function stepFrame(page) {
  await page.evaluate(() => window.__readmeCaptureStep?.());
  await page.waitForTimeout(200);
}

async function capture(page, filename) {
  await page.screenshot({ path: path.join(output, filename), fullPage: false, animations: 'disabled', timeout: 120000 });
  console.log('Captured ' + filename);
}

try {
  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await desktop.newPage();
  await page.addInitScript(() => {
    const callbacks = [];
    window.requestAnimationFrame = (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    };
    window.__readmeCaptureStep = () => {
      const callback = callbacks.shift();
      if (!callback) return false;
      callback(performance.now());
      return true;
    };
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 0.5 });
  });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await openGame(page);
  await stepFrame(page);
  await capture(page, '01-start-screen.png');

  await page.locator('#btn-start').click({ force: true });
  await stepFrame(page);
  await page.addStyleTag({ content: '#touch-controls-layer { display: none !important; }' });
  await page.waitForTimeout(900);
  await capture(page, '02-gameplay-afg7.png');

  await page.locator('#btn-map-hangar').click({ force: true });
  await stepFrame(page);
  await capture(page, '03-hangar-alpha.png');

  await page.locator('#btn-map-apex').click({ force: true });
  await page.waitForTimeout(1400);
  await capture(page, '04-apex-spire.png');

  await page.locator('#btn-skin-gold').click({ force: true });
  await stepFrame(page);
  await capture(page, '05-gold-apex.png');

  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.addInitScript(() => {
    const callbacks = [];
    window.requestAnimationFrame = (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    };
    window.__readmeCaptureStep = () => {
      const callback = callbacks.shift();
      if (!callback) return false;
      callback(performance.now());
      return true;
    };
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 0.5 });
  });
  mobilePage.on('pageerror', (error) => pageErrors.push(error.message));
  await openGame(mobilePage);
  await mobilePage.locator('#btn-start').click({ force: true });
  await stepFrame(mobilePage);
  await capture(mobilePage, '06-mobile-touch.png');
  await mobile.close();

  if (pageErrors.length > 0) {
    console.warn('Browser runtime errors detected during capture:');
    for (const message of pageErrors) console.warn('- ' + message);
  }

  console.log('Screenshot capture completed: ' + screenshots.join(', '));
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
}
