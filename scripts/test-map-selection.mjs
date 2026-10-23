// Live check for barangay selection switching on /map/. Needs the dev/preview
// server (default http://localhost:3000) and GISPH_API_KEY in the environment.
// The key is injected at runtime only; it is never written anywhere.
// Usage: GISPH_API_KEY=... node scripts/test-map-selection.mjs [origin]
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.argv[2] || 'http://localhost:3000';
const key = process.env.GISPH_API_KEY;
if (!key) {
  console.log('SKIP: GISPH_API_KEY not set');
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((k) => {
    window.__BETTERBAYAWAN_GIS_KEY__ = k;
    let leaflet;
    Object.defineProperty(window, 'L', {
      configurable: true,
      get: () => leaflet,
      set(value) {
        leaflet = value;
        if (value && value.Map && !value.__hooked) {
          value.__hooked = true;
          value.Map.addInitHook(function () {
            window.__testMap = this;
          });
        }
      },
    });
  }, key);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const load = async (attempt = 1) => {
    await page.goto(origin + '/map/');
    if (attempt < 3) {
      try {
        await page.waitForFunction(
          () => /28 barangays/.test(document.getElementById('map-status').textContent),
          null,
          { timeout: 45000 }
        );
        await page.waitForTimeout(800);
        return;
      } catch {
        return load(attempt + 1);
      }
    }
    await page.waitForFunction(
      () => /28 barangays/.test(document.getElementById('map-status').textContent),
      null,
      { timeout: 90000 }
    );
    await page.waitForTimeout(800);
  };
  const state = () =>
    page.evaluate(() => {
      const map = window.__testMap;
      const sel = [...document.querySelectorAll('#barangay-list button.is-selected')];
      const layers = Object.values(map._layers).filter((l) => l.feature);
      const hi = layers.filter((l) => l.options.weight === 3);
      const popup = document.querySelector('.leaflet-popup-content');
      const byName = (n) => layers.find((l) => l.feature.properties.name === n);
      const target = sel[0] && byName(sel[0].textContent);
      return {
        selected: sel.map((b) => b.textContent),
        highlighted: hi.map((l) => l.feature.properties.name),
        popup: popup ? popup.textContent : null,
        status: document.getElementById('map-status').textContent,
        centerInside: target ? target.getBounds().contains(map.getCenter()) : null,
      };
    });
  const listClick = (name) =>
    page.locator('#barangay-list button', { hasText: new RegExp('^' + name + '$') }).click();
  const mapClick = (name) =>
    page.evaluate((n) => {
      const map = window.__testMap;
      const layer = Object.values(map._layers).find(
        (l) => l.feature && l.feature.properties.name === n
      );
      layer.fire('click', {
        latlng: layer.getCenter ? layer.getCenter() : layer.getBounds().getCenter(),
      });
    }, name);

  const scenarios = [];
  for (const via of ['list', 'map'])
    for (const wait of [0, 150, 2000])
      for (const filter of [false, true]) scenarios.push({ via, wait, filter });

  for (const s of scenarios) {
    await load();
    const A = 'Banga';
    const B = s.filter ? 'San Jose' : 'Malabugas';
    const pick = s.via === 'list' ? listClick : mapClick;
    await pick(A);
    if (s.filter) {
      await page.fill('#barangay-filter', 'san');
    }
    await page.waitForTimeout(s.wait);
    await pick(B);
    await page.waitForTimeout(2500);
    const st = await state();
    const ok =
      st.selected.length === 1 &&
      st.selected[0] === B &&
      st.highlighted.join() === B &&
      st.popup === B &&
      st.status === 'Selected ' + B + '.' &&
      st.centerInside === true;
    const label = `${s.via} wait=${s.wait} filter=${s.filter}`;
    console.log(ok ? 'PASS' : 'FAIL', label, JSON.stringify(st));
    if (!ok) failures.push(label);
  }
  assert.deepEqual(errors, [], 'page errors');
} finally {
  await browser.close();
}
assert.equal(failures.length, 0, 'Failed: ' + failures.join('; '));
console.log('map selection: all scenarios passed');
