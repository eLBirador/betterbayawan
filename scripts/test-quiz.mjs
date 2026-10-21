import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './build-site.mjs';

export async function testQuiz(browser, origin) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  await context.route('**/*', (route) =>
    route.request().url().startsWith(origin) ? route.continue() : route.abort()
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const noOverflow = async () =>
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'Quiz horizontal overflow'
    );
  try {
    await page.goto(origin + '/');
    assert.equal(
      await page.locator('.history-section + .home-quiz-section').count(),
      1,
      'Quiz is directly below Brief History'
    );
    assert.equal(await page.locator('.home-quiz-topic').count(), 7);
    await page.locator('.home-quiz-topic[href="/quiz/?category=tourism"]').click();
    await page.locator('[data-action="start"]').waitFor();
    assert.equal(await page.locator('.quiz-category input:checked').count(), 1);
    assert.equal(
      await page.locator('.quiz-category input:checked').getAttribute('value'),
      'tourism'
    );
    await page.goto(origin + '/');
    await page.locator('.home-quiz-link').click();
    await page.locator('[data-action="start"]').waitFor();
    assert.equal(await page.locator('.quiz-category').count(), 7);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow();
      await page.screenshot({
        path: path.join(root, `.artifacts/quiz-setup-${width}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const input of await page.locator('.quiz-category input').all()) await input.uncheck();
    assert.equal(await page.locator('[data-action="start"]').isDisabled(), true);
    await page.locator('.quiz-category input[value="culture"]').check();
    await page.locator('[data-action="start"]').click();
    assert.match(await page.locator('.quiz-question').innerText(), /Question 1 of 5/);
    // First answer wrong: verify scoring, feedback, and later missed-question practice.
    await page.locator('[data-choice="1"]').click();
    assert.equal(await page.locator('.quiz-answer.correct').count(), 1);
    assert.equal(await page.locator('.quiz-answer.wrong').count(), 1);
    assert.equal(await page.locator('.quiz-answer:disabled').count(), 4);
    assert.ok((await page.locator('.quiz-source').getAttribute('href')).startsWith('https://'));
    await page.screenshot({
      path: path.join(root, '.artifacts/quiz-feedback.png'),
      fullPage: true,
    });
    await page.reload();
    await page.locator('[data-action="resume"]').click();
    assert.equal(await page.locator('.quiz-answer.wrong').count(), 1, 'Resume keeps answer');
    for (const language of ['fil', 'bis', 'en']) {
      await page.locator('.lang-trigger').click();
      await page.locator(`.lang-option[data-lang="${language}"]`).click();
      assert.equal(
        await page.locator('.quiz-answer.wrong').count(),
        1,
        'Language switch keeps answer'
      );
      await noOverflow();
    }
    await page.locator('[data-action="next"]').click();
    for (let i = 1; i < 5; i++) {
      await page.locator('[data-choice="0"]').click();
      await page.locator('[data-action="next"]').click();
    }
    assert.equal(await page.locator('.quiz-medallion strong').innerText(), '4/5');
    await page.setViewportSize({ width: 1440, height: 1000 });
    const intro = await page.locator('.quiz-intro').boundingBox();
    const result = await page.locator('.quiz-result').boundingBox();
    assert.ok(
      Math.abs(intro.x + intro.width / 2 - result.x - result.width / 2) < 1,
      'Desktop header and result share a center'
    );
    assert.ok(
      (await page.locator('h1').boundingBox()).height < 50,
      'Desktop result title stays compact'
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(root, '.artifacts/quiz-result.png'), fullPage: true });
    await page.locator('.quiz-review summary').click();
    assert.equal(await page.locator('.quiz-review article').count(), 5);
    await page.locator('[data-action="practice"]').click();
    assert.match(await page.locator('.quiz-question').innerText(), /Question 1 of 1/);
    await page.locator('[data-choice="0"]').click();
    await page.locator('[data-action="next"]').click();
    assert.equal(await page.locator('.quiz-medallion strong').innerText(), '1/1');
    await page.locator('[data-action="again"]').click();
    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="exit"]').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.locator('dialog').waitFor({ state: 'detached' });
    assert.equal(await page.locator('dialog').count(), 0);
    assert.equal(await page.locator('.quiz-question').count(), 1);
    await page.locator('[data-action="exit"]').click();
    await page.locator('dialog button[value="leave"]').click();
    await page.locator('[data-action="start"]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-action="start"]').isVisible(), true);
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem('BetterBayawan_quiz_round_v1')),
      null
    );
    // Verify full localized rounds, including the result view, at the narrowest width.
    await page.setViewportSize({ width: 320, height: 844 });
    for (const language of ['fil', 'bis']) {
      await page.locator('.lang-trigger').click();
      await page.locator(`.lang-option[data-lang="${language}"]`).click();
      await page.locator('input[name="quiz-length"][value="5"]').check();
      await page.locator('[data-action="start"]').click();
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-choice="0"]').click();
        await noOverflow();
        await page.locator('[data-action="next"]').click();
      }
      await noOverflow();
      assert.equal(await page.locator('.quiz-medallion strong').innerText(), '5/5');
      await page.locator('[data-action="again"]').click();
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(
      await page.locator('.quiz-enter').evaluate((el) => getComputedStyle(el).animationName),
      'none'
    );
    assert.deepEqual(errors, [], 'Quiz browser errors');
    const assetSize =
      fs.statSync(path.join(root, 'data/quiz.json')).size +
      fs.statSync(path.join(root, 'assets/js/pages/quiz.js')).size +
      fs.statSync(path.join(root, 'assets/css/pages/quiz.css')).size;
    console.log(
      `Quiz passed: 7 categories, mobile/desktop layouts, answer locking, scoring, resume, three languages, review/practice, exit dialog, reduced motion. ${Math.round(assetSize / 1024)} KB uncompressed quiz data/code/styles.`
    );
  } finally {
    await context.close();
  }
}
