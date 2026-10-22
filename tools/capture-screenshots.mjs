import { spawn } from 'node:child_process';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'screenshots');
const baseUrl = 'http://127.0.0.1:8080/?readme-capture=1';
const shots = [
  ['01-start-screen.png', 'start'],
  ['02-gameplay-afg7.png', 'AFG-7 Tower · Obsidian'],
  ['03-hangar-alpha.png', 'Hangar Alpha · Obsidian'],
  ['04-apex-spire.png', 'Apex Spire · Obsidian'],
  ['05-gold-apex.png', 'AFG-7 Tower · Gold Apex'],
  ['06-frost-damascus.png', 'AFG-7 Tower · Frost Damascus'],
  ['07-hangar-gold-apex.png', 'Hangar Alpha · Gold Apex'],
  ['08-hangar-frost-damascus.png', 'Hangar Alpha · Frost Damascus'],
  ['09-apex-gold-apex.png', 'Apex Spire · Gold Apex'],
  ['10-apex-frost-damascus.png', 'Apex Spire · Frost Damascus'],
  ['11-aim-down-sights.png', 'Aim-down-sights / Holo-Sight'],
  ['12-fire-recoil.png', 'Feuer- und Rückstoß-Feedback'],
  ['13-reload-sequence.png', 'Taktische Nachlade-Animation'],
  ['14-reloaded-magazine.png', 'Nachgeladenes Magazin und HUD'],
  ['15-sprint-movement.png', 'Sprint und Spielerbewegung'],
  ['16-camera-turn.png', 'Freie Kameraausrichtung'],
  ['17-desktop-wide.png', 'Breites Desktop-Layout'],
  ['18-desktop-tablet.png', 'Kompaktes Tablet-Layout'],
  ['19-mobile-touch.png', 'Mobile Touch-Steuerung'],
  ['20-mobile-combat.png', 'Mobile ADS- und Feueransicht']
];

await mkdir(output, { recursive: true });
for (const file of await readdir(output)) {
  if (/^\d{2}-.+\.png$/i.test(file)) await rm(path.join(output, file), { force: true });
}

const server = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore'
});
let browser;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function makePage(context, initialSeed) {
  const page = await context.newPage();
  await page.addInitScript((seedValue) => {
    // Seed procedural scene generation so repeated CI captures are reproducible.
    let seed = seedValue >>> 0;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
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
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      get: () => 0.5
    });
  }, initialSeed);
  return page;
}

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

async function stepFrame(page, count = 1, delay = 160) {
  for (let i = 0; i < count; i += 1) {
    await page.evaluate(() => window.__readmeCaptureStep?.());
    await page.waitForTimeout(delay);
  }
}

async function capture(page, filename) {
  await page.screenshot({
    path: path.join(output, filename),
    fullPage: false,
    animations: 'disabled',
    timeout: 120000
  });
  console.log('Captured ' + filename);
}

async function chooseOption(page, id) {
  const active = await page.evaluate((buttonId) => {
    const button = document.getElementById(buttonId);
    if (!button) return false;
    button.click();
    return button.classList.contains('active');
  }, id);
  if (!active) throw new Error('Could not activate game option: ' + id);
  await stepFrame(page);
}

async function activateTouchButton(page, id) {
  const dispatched = await page.evaluate((buttonId) => {
    const button = document.getElementById(buttonId);
    if (!button) return false;
    const event = new Event('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'changedTouches', {
      value: [{ identifier: 1, clientX: 24, clientY: 24 }]
    });
    button.dispatchEvent(event);
    return true;
  }, id);
  if (!dispatched) throw new Error('Could not activate touch control: ' + id);
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

  const errors = [];
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await makePage(desktop, 20261022);
  page.on('pageerror', (error) => errors.push(error.message));

  await openGame(page);
  await stepFrame(page);
  await capture(page, '01-start-screen.png');

  await page.locator('#btn-start').click({ force: true });
  await page.waitForTimeout(250);
  await page.addStyleTag({ content: '#touch-controls-layer { display: none !important; }' });
  await stepFrame(page);
  await capture(page, '02-gameplay-afg7.png');

  await chooseOption(page, 'btn-map-hangar');
  await capture(page, '03-hangar-alpha.png');
  await chooseOption(page, 'btn-map-apex');
  await capture(page, '04-apex-spire.png');

  await chooseOption(page, 'btn-map-afg7');
  await chooseOption(page, 'btn-skin-gold');
  await capture(page, '05-gold-apex.png');
  await chooseOption(page, 'btn-skin-damascus');
  await capture(page, '06-frost-damascus.png');

  await chooseOption(page, 'btn-map-hangar');
  await chooseOption(page, 'btn-skin-gold');
  await capture(page, '07-hangar-gold-apex.png');
  await chooseOption(page, 'btn-skin-damascus');
  await capture(page, '08-hangar-frost-damascus.png');

  await chooseOption(page, 'btn-map-apex');
  await chooseOption(page, 'btn-skin-gold');
  await capture(page, '09-apex-gold-apex.png');
  await chooseOption(page, 'btn-skin-damascus');
  await capture(page, '10-apex-frost-damascus.png');

  await chooseOption(page, 'btn-map-afg7');
  await chooseOption(page, 'btn-skin-obsidian');
  await page.mouse.move(620, 360);
  await page.mouse.down({ button: 'right' });
  await stepFrame(page, 2);
  await capture(page, '11-aim-down-sights.png');
  await page.mouse.up({ button: 'right' });
  await wait(180);

  await page.mouse.move(620, 360);
  await page.mouse.down({ button: 'left' });
  await stepFrame(page);
  await capture(page, '12-fire-recoil.png');
  await page.mouse.up({ button: 'left' });
  await wait(180);

  await page.keyboard.press('R');
  await wait(300);
  await stepFrame(page);
  await capture(page, '13-reload-sequence.png');
  await wait(1150);
  await stepFrame(page, 2, 120);
  await capture(page, '14-reloaded-magazine.png');

  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await stepFrame(page, 4, 100);
  await capture(page, '15-sprint-movement.png');
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await stepFrame(page, 2, 100);

  await page.mouse.move(1020, 340, { steps: 8 });
  await stepFrame(page, 2);
  await capture(page, '16-camera-turn.png');

  await page.setViewportSize({ width: 1600, height: 900 });
  await stepFrame(page, 2);
  await capture(page, '17-desktop-wide.png');

  await page.setViewportSize({ width: 1024, height: 768 });
  await stepFrame(page, 2);
  await capture(page, '18-desktop-tablet.png');
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await makePage(mobile, 20261023);
  mobilePage.on('pageerror', (error) => errors.push(error.message));
  await openGame(mobilePage);
  await mobilePage.locator('#btn-start').click({ force: true });
  await stepFrame(mobilePage, 2);
  await capture(mobilePage, '19-mobile-touch.png');

  await activateTouchButton(mobilePage, 'touch-btn-ads');
  await stepFrame(mobilePage, 3, 120);
  await activateTouchButton(mobilePage, 'touch-btn-fire');
  await stepFrame(mobilePage, 2);
  await capture(mobilePage, '20-mobile-combat.png');
  await mobile.close();

  const actual = (await readdir(output)).filter((file) => /^\d{2}-.+\.png$/i.test(file));
  const missing = shots.map(([file]) => file).filter((file) => !actual.includes(file));
  if (missing.length) throw new Error('Missing screenshots: ' + missing.join(', '));
  if (actual.length !== shots.length) {
    throw new Error('Expected exactly ' + shots.length + ' screenshots, found ' + actual.length);
  }

  if (errors.length > 0) {
    console.warn('Browser runtime errors detected during capture:');
    for (const message of errors) console.warn('- ' + message);
  }

  console.log('Screenshot capture completed: ' + shots.map(([file]) => file).join(', '));
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
}
