/* Bayawan quiz: local progress only; reviewed content lives in data/quiz.json. */
(() => {
  'use strict';
  const app = document.getElementById('quiz-app');
  if (!app) return;
  const languages = ['en', 'fil', 'ceb'];
  const progressKey = 'BetterBayawan_quiz_round_v1';
  const bestKey = 'BetterBayawan_quiz_best_v1';
  let data,
    round = null,
    screen = 'setup',
    selected = new Set(),
    length = 10,
    shareMessage = '';
  const lang = () =>
    Math.max(0, languages.indexOf(window.TranslationEngine?.getCurrentLanguage() || 'en'));
  const text = (value) => value[lang()] || value[0];
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const t = (key, values = {}) =>
    Object.entries(values).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
      text(data.ui[key])
    );
  function storage(type, key, value) {
    try {
      if (value === undefined) return JSON.parse(window[type].getItem(key));
      if (value === null) window[type].removeItem(key);
      else window[type].setItem(key, JSON.stringify(value));
    } catch {
      /* The quiz also works when browser storage is unavailable. */
    }
    return null;
  }
  function shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const question = (id) => data.questions.find((q) => q.id === id);
  function categoryIcon(id) {
    const paths = {
      history: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
      culture: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
      agriculture:
        '<path d="M12 21V10M12 15C4 16 3 9 3 6c6 0 9 3 9 9ZM12 11c0-6 4-8 9-8 0 5-3 8-9 8Z"/>',
      tourism: '<path d="m3 17 6-10 5 7 3-4 4 7M3 21h18"/>',
      geography: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
      community:
        '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 21v-3a6 6 0 0 1 12 0v3M17 15a5 5 0 0 1 5 5"/>',
      services: '<path d="m3 8 9-5 9 5H3ZM5 10v8m7-8v8m7-8v8M3 21h18"/>',
    };
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths.community}</svg>`;
  }
  const score = () => round.answers.filter((a) => a.choice === question(a.id).correct).length;
  const save = () => storage('sessionStorage', progressKey, { version: data.version, ...round });
  function validRound(value) {
    return (
      value &&
      value.version === data.version &&
      Array.isArray(value.ids) &&
      value.ids.length > 0 &&
      new Set(value.ids).size === value.ids.length &&
      value.ids.every((id) => question(id)) &&
      Array.isArray(value.answers) &&
      value.answers.length <= value.ids.length &&
      value.answers.every(
        (answer, i) =>
          answer.id === value.ids[i] &&
          Number.isInteger(answer.choice) &&
          answer.choice >= 0 &&
          answer.choice < 4
      ) &&
      Array.isArray(value.orders) &&
      value.orders.length === value.ids.length &&
      value.orders.every(
        (order) => Array.isArray(order) && [...order].sort().join('') === '0123'
      ) &&
      Number.isInteger(value.index) &&
      value.index >= 0 &&
      value.index < value.ids.length &&
      (value.answers.length === value.index || value.answers.length === value.index + 1)
    );
  }
  function focusHeading() {
    const heading = app.querySelector('h2');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    const anchor =
      screen === 'play' ? app : app.closest('.bayawan-quiz').querySelector('.quiz-intro');
    const top = anchor.getBoundingClientRect().top;
    const clearance =
      (document.querySelector('.site-header')?.getBoundingClientRect().height || 80) + 24;
    if (top < clearance || top > innerHeight / 2)
      window.scrollTo({ top: Math.max(0, scrollY + top - clearance), behavior: 'instant' });
  }
  function source(q) {
    const s = data.sources[q.source];
    return `<a class="quiz-source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(t('source'))} ↗ <span class="sr-only">${esc(s.title)}</span></a>`;
  }
  function start(ids) {
    const pool = ids || data.questions.filter((q) => selected.has(q.category)).map((q) => q.id);
    if (!pool.length) return;
    const picks = shuffle(pool).slice(0, ids ? pool.length : length);
    round = { ids: picks, answers: [], index: 0, orders: picks.map(() => shuffle([0, 1, 2, 3])) };
    save();
    screen = 'play';
    render();
    focusHeading();
  }
  function renderSetup() {
    app.closest('.bayawan-quiz').dataset.stage = 'setup';
    const saved = storage('sessionStorage', progressKey);
    const resume = validRound(saved);
    const available = data.questions.filter((q) => selected.has(q.category)).length;
    app.innerHTML = `<div class="quiz-panel quiz-enter">
      <div class="quiz-topline"><span class="quiz-stamp">${esc(t('edition'))}</span><span>${esc(t('relaxed'))}</span></div>
      ${resume ? `<div class="quiz-feedback"><strong>${esc(t('resume'))}</strong><div class="quiz-actions"><button class="quiz-btn" data-action="resume">${esc(t('continue'))}</button><button class="quiz-btn quiz-btn-secondary" data-action="discard">${esc(t('new'))}</button></div></div>` : ''}
      <h2>${esc(t('pick'))}</h2><p class="quiz-help">${esc(t('pickHelp'))}</p>
      <div class="quiz-categories">${data.categories.map((c) => `<label class="quiz-category"><span class="quiz-category-icon" aria-hidden="true">${categoryIcon(c.id)}</span><span><strong>${esc(text(c.name))}</strong><small>${esc(text(c.description))}</small></span><input type="checkbox" value="${c.id}" ${selected.has(c.id) ? 'checked' : ''}></label>`).join('')}</div>
      <fieldset class="quiz-options"><legend>${esc(t('length'))}</legend><div class="quiz-lengths">${[5, 10, 15].map((n) => `<label><input type="radio" name="quiz-length" value="${n}" ${length === n ? 'checked' : ''}><span>${n} ${esc(t('questions'))}</span></label>`).join('')}</div></fieldset>
      <div class="quiz-actions"><p class="quiz-note" id="quiz-availability" aria-live="polite">${esc(available ? t('roundNote', { n: Math.min(length, available) }) : t('none'))}</p><button class="quiz-btn quiz-start" data-action="start" ${available ? '' : 'disabled'}>${esc(t('start'))}<span aria-hidden="true">↗</span></button></div>
    </div>`;
  }
  function renderQuestion() {
    app.closest('.bayawan-quiz').dataset.stage = 'play';
    const q = question(round.ids[round.index]);
    const category = data.categories.find((c) => c.id === q.category);
    const answer = round.answers[round.index];
    const answered = Boolean(answer);
    app.innerHTML = `<div class="quiz-panel quiz-question quiz-enter">
      <div class="quiz-topline"><span class="quiz-stamp">${esc(text(category.name))}</span><button class="quiz-exit" data-action="exit">${esc(t('leave'))} ↗</button></div>
      <div class="quiz-topline"><span>${esc(t('question', { n: round.index + 1, total: round.ids.length }))}</span><span>${esc(t('score', { n: score() }))}</span></div>
      <div class="quiz-progress" role="progressbar" aria-label="${esc(t('questions'))}" aria-valuemin="0" aria-valuemax="${round.ids.length}" aria-valuenow="${round.answers.length}">${round.ids.map((_, i) => `<span class="${i < round.answers.length ? 'done' : i === round.index ? 'current' : ''}"></span>`).join('')}</div>
      <h2 id="quiz-question">${esc(text(q.prompt))}</h2>
      <div class="quiz-answers" role="group" aria-labelledby="quiz-question">${round.orders[
        round.index
      ]
        .map((index, position) => {
          const correct = answered && index === q.correct;
          const wrong = answered && index === answer.choice && index !== q.correct;
          return `<button class="quiz-answer ${correct ? 'correct' : wrong ? 'wrong' : ''}" data-choice="${index}" ${answered ? 'disabled' : ''}><span class="quiz-answer-letter" aria-hidden="true">${String.fromCharCode(65 + position)}</span><span>${esc(text(q.options[index]))}</span>${correct || wrong ? `<span class="quiz-answer-mark" aria-label="${esc(t(correct ? 'correctAnswer' : 'yourAnswer'))}">${correct ? '✓' : '×'}</span>` : ''}</button>`;
        })
        .join('')}</div>
      ${answered ? `<div class="quiz-feedback quiz-enter" role="status"><strong>${esc(t(answer.choice === q.correct ? 'correct' : 'wrong'))}</strong><p>${esc(text(q.explanation))}</p>${source(q)}</div><div class="quiz-actions"><button class="quiz-btn" data-action="next">${esc(t(round.index + 1 === round.ids.length ? 'finish' : 'next'))}<span aria-hidden="true">→</span></button></div>` : ''}
    </div>`;
  }
  function renderResult(celebrate = false) {
    app.closest('.bayawan-quiz').dataset.stage = 'results';
    const correct = score(),
      total = round.ids.length,
      percent = Math.round((correct / total) * 100);
    const best = storage('localStorage', bestKey);
    app.innerHTML = `<div class="quiz-panel quiz-result quiz-enter">
      <div class="quiz-topline"><span class="quiz-stamp">${esc(t('done'))}</span><span>${esc(t('relaxed'))}</span></div>
      ${celebrate && percent >= 60 ? `<div class="quiz-confetti" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="--x:${(i - 5.5) * 24}px;--angle:${i * 49}deg"></i>`).join('')}</div>` : ''}
      <div class="quiz-medallion"><strong>${correct}/${total}</strong><span>${percent}%</span></div>
      <h2>${esc(t(percent >= 80 ? 'excellent' : percent >= 50 ? 'good' : 'learning'))}</h2><p class="quiz-help">${esc(t('resultHelp'))}</p>
      ${best && Number.isFinite(best.percent) ? `<p class="quiz-note">${esc(t('best', { n: best.percent }))}</p>` : ''}
      <div class="quiz-actions"><button class="quiz-btn" data-action="again">${esc(t('again'))} ↗</button>${correct < total ? `<button class="quiz-btn quiz-btn-secondary" data-action="practice">${esc(t('reviewMissed'))}</button>` : ''}<button class="quiz-btn quiz-btn-secondary" data-action="share">${esc(t('share'))}</button></div><p class="quiz-note" id="quiz-share-status" role="status">${esc(shareMessage)}</p>
      <details class="quiz-review"><summary>${esc(t('review'))}</summary>${round.answers
        .map((answer, i) => {
          const q = question(answer.id);
          return `<article><h3>${i + 1}. ${esc(text(q.prompt))}</h3><p>${esc(t('yourAnswer'))}: ${esc(text(q.options[answer.choice]))} ${answer.choice === q.correct ? '✓' : '×'}</p><p><strong>${esc(t('correctAnswer'))}: ${esc(text(q.options[q.correct]))}</strong></p><p>${esc(text(q.explanation))}</p>${source(q)}</article>`;
        })
        .join('')}</details>
    </div>`;
  }
  function render() {
    app.setAttribute('aria-busy', 'false');
    if (screen === 'setup') renderSetup();
    else if (screen === 'play') renderQuestion();
    else renderResult();
  }
  function confirmExit() {
    const dialog = document.createElement('dialog');
    dialog.className = 'quiz-dialog';
    dialog.setAttribute('aria-labelledby', 'quiz-exit-title');
    dialog.innerHTML = `<h2 id="quiz-exit-title">${esc(t('leaveTitle'))}</h2><p>${esc(t('leaveHelp'))}</p><form method="dialog" class="quiz-actions"><button class="quiz-btn" value="stay" autofocus>${esc(t('stay'))}</button><button class="quiz-btn quiz-btn-secondary" value="leave">${esc(t('leave'))}</button></form>`;
    app.appendChild(dialog);
    dialog.addEventListener(
      'close',
      () => {
        const leave = dialog.returnValue === 'leave';
        dialog.remove();
        if (leave) {
          storage('sessionStorage', progressKey, null);
          round = null;
          screen = 'setup';
          render();
          focusHeading();
        }
      },
      { once: true }
    );
    dialog.showModal();
  }
  app.addEventListener('change', (event) => {
    const input = event.target;
    if (input.type === 'checkbox') {
      if (input.checked) selected.add(input.value);
      else selected.delete(input.value);
    } else if (input.name === 'quiz-length') length = Number(input.value);
    const count = data.questions.filter((q) => selected.has(q.category)).length;
    const note = app.querySelector('#quiz-availability');
    if (note) note.textContent = count ? t('roundNote', { n: Math.min(length, count) }) : t('none');
    const startButton = app.querySelector('[data-action="start"]');
    if (startButton) startButton.disabled = !count;
  });
  app.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button || !data) return;
    if (button.hasAttribute('data-choice') && screen === 'play' && !round.answers[round.index]) {
      round.answers.push({ id: round.ids[round.index], choice: Number(button.dataset.choice) });
      save();
      renderQuestion();
      app.querySelector('[data-action="next"]').focus({ preventScroll: true });
      return;
    }
    switch (button.dataset.action) {
      case 'start':
        start();
        break;
      case 'resume':
        round = storage('sessionStorage', progressKey);
        if (validRound(round)) {
          screen = 'play';
          render();
          focusHeading();
        }
        break;
      case 'discard':
        storage('sessionStorage', progressKey, null);
        render();
        focusHeading();
        break;
      case 'exit':
        confirmExit();
        break;
      case 'next':
        if (!round.answers[round.index]) return;
        if (round.index + 1 < round.ids.length) {
          round.index++;
          save();
          render();
        } else {
          screen = 'results';
          storage('sessionStorage', progressKey, null);
          shareMessage = '';
          const percent = Math.round((score() / round.ids.length) * 100),
            previous = storage('localStorage', bestKey);
          if (!previous || percent > previous.percent)
            storage('localStorage', bestKey, { percent });
          renderResult(true);
        }
        focusHeading();
        break;
      case 'again':
        screen = 'setup';
        render();
        focusHeading();
        break;
      case 'practice':
        start(round.answers.filter((a) => a.choice !== question(a.id).correct).map((a) => a.id));
        break;
      case 'share': {
        const message = t('shareText', { score: score(), total: round.ids.length });
        try {
          if (navigator.share)
            await navigator.share({
              title: 'BetterBayawan',
              text: message,
              url: new URL('/quiz/', location.origin).href,
            });
          else {
            await navigator.clipboard.writeText(
              `${message} ${new URL('/quiz/', location.origin).href}`
            );
            shareMessage = t('copied');
          }
        } catch (error) {
          if (error.name !== 'AbortError') shareMessage = t('shareFail');
        }
        const status = app.querySelector('#quiz-share-status');
        if (status) status.textContent = shareMessage;
        break;
      }
    }
  });
  window.addEventListener('languagechange', () => {
    if (!data) return;
    shareMessage = '';
    render();
  });
  async function load() {
    try {
      const response = await fetch('/data/quiz.json');
      if (!response.ok) throw Error('Quiz unavailable');
      data = await response.json();
      selected = new Set(data.categories.map((c) => c.id));
      const requestedCategory = new URLSearchParams(location.search).get('category');
      if (data.categories.some((category) => category.id === requestedCategory))
        selected = new Set([requestedCategory]);
      render();
    } catch {
      const messages = [
        ['The quiz could not load. Check your connection and try again.', 'Try again'],
        ['Hindi ma-load ang quiz. Suriin ang koneksyon at subukang muli.', 'Subukang muli'],
        ['Dili ma-load ang quiz. Susiha ang koneksyon ug sulayi pag-usab.', 'Sulayi pag-usab'],
      ][lang()];
      app.setAttribute('aria-busy', 'false');
      app.innerHTML = `<div class="quiz-panel" role="alert"><p>${messages[0]}</p><button class="quiz-btn">${messages[1]}</button></div>`;
      app.querySelector('button').addEventListener('click', load, { once: true });
    }
  }
  load();
})();
