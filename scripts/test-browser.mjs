import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { build, root } from './build-site.mjs';
import { createStaticServer } from './static-server.mjs';

build();
const server = createStaticServer(path.join(root, 'dist'));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (process.platform !== 'win32') throw error;
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  }
  const routes = JSON.parse(fs.readFileSync(path.join(root, 'pages/routes.json'), 'utf8')).filter(
    (r) => !r.redirect && !r.standalone
  );
  let pages = 0;
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      serviceWorkers: 'block',
    });
    // Network services are independently sourced; deterministic UI checks exercise local behavior.
    await context.route('**/*', (route) =>
      route.request().url().startsWith(origin) ? route.continue() : route.abort()
    );
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const r of routes) {
      await page.goto(origin + r.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(40);
      assert.equal(await page.locator('h1').count(), 1, r.url);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `Horizontal overflow ${width} ${r.url}`
      );
      pages++;
    }
    if (width === 390) {
      for (const language of ['fil', 'ceb']) {
        await page.evaluate((value) => localStorage.setItem('BetterBayawan_lang', value), language);
        for (const r of routes) {
          await page.goto(origin + r.url, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(40);
          assert.equal(await page.locator('html').getAttribute('lang'), language, r.url);
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `Translated mobile overflow ${language} ${r.url}`
          );
          pages++;
        }
      }
      await page.evaluate(() => localStorage.setItem('BetterBayawan_lang', 'en'));
    }
    await page.goto(origin + '/');
    await page.locator('.lang-trigger').click();
    await page.locator('.lang-option[data-lang="bis"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ceb');
    await page.goto(origin + '/services/');
    assert.equal(await page.locator('html').getAttribute('lang'), 'ceb');
    await page.locator('.directory-search input').fill('birth');
    assert.ok(
      (await page
        .locator('.service-category-card[href="/service-details/birth-certificate"]')
        .count()) > 0
    );
    await page.locator('.lang-trigger').click();
    await page.locator('.lang-option[data-lang="fil"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'fil');
    await page.locator('.lang-trigger').click();
    await page.locator('.lang-option[data-lang="en"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    if (width === 390) {
      const toggle = page.locator('.mobile-menu-toggle');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    }
    await page.goto(origin + '/budget/');
    assert.match(await page.locator('#sre-total-income').innerText(), /1,?652\.26|1652\.26/);
    await page.locator('[data-quarter="q1"]').click();
    await page.waitForTimeout(550);
    assert.match(await page.locator('#sre-total-income').innerText(), /514\.75/);
    await page.goto(origin + '/services/health');
    assert.ok((await page.locator('h3').allTextContents()).includes('Dawis Community Hospital'));
    assert.deepEqual(errors, [], `Browser errors at ${width}`);
    await page.goto(origin + '/');
    await page.screenshot({
      path: path.join(root, `.artifacts/home-${width}.png`),
      fullPage: true,
    });
    await context.close();
  }
  const response = await fetch(origin + '/service-details/municipal-budget', {
    redirect: 'manual',
  });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/service-details/city-budget');
  console.log(
    `Passed: ${pages} desktop/mobile page checks, language switching/persistence, search, menu keyboard behavior, SRE periods, hospital coverage, and legacy redirect.`
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
