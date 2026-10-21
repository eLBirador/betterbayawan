/* One language engine for every page. Text-node translation preserves nested markup. */
(() => {
  'use strict';
  const dictionaries = window.BayawanTranslations || { en: {}, fil: {}, ceb: {} };
  const names = { en: 'English', fil: 'Filipino', ceb: 'Bisaya' };
  const originals = new WeakMap(),
    attributes = new WeakMap();
  const normalize = (s) => s.replace(/\s+/g, ' ').trim();
  let language = 'en',
    observer;
  const skip = (e) =>
    e?.closest(
      'script,style,svg,pre,code,.lang-menu,.lang-trigger-label,[data-no-translate],[translate="no"]'
    );
  const translate = (s) => dictionaries[language]?.[s] || s;
  function apply(root = document.body) {
    observer?.disconnect();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (skip(node.parentElement)) continue;
      const current = normalize(node.nodeValue);
      let original = originals.get(node);
      if (!original || (current !== normalize(translate(original)) && current !== original))
        original = current;
      originals.set(node, original);
      const result = translate(original);
      if (current !== result) node.nodeValue = node.nodeValue.replace(/\S[\s\S]*\S|\S/, result);
    }
    const nodes = [...(root.querySelectorAll?.('[placeholder],[aria-label],[title],[alt]') || [])];
    for (const node of nodes) {
      if (skip(node)) continue;
      let record = attributes.get(node) || {};
      for (const key of ['placeholder', 'aria-label', 'title', 'alt']) {
        const value = node.getAttribute(key);
        if (value == null) continue;
        record[key] ??= value;
        node.setAttribute(key, translate(record[key]));
      }
      attributes.set(node, record);
    }
    observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function switchLanguage(next) {
    next = next === 'bis' ? 'ceb' : next;
    if (!names[next]) return;
    // Restore English before changing dictionaries so a second switch never translates a translation.
    observer?.disconnect();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode,
        original = originals.get(n);
      if (original && !skip(n.parentElement))
        n.nodeValue = n.nodeValue.replace(/\S[\s\S]*\S|\S/, original);
    }
    language = next;
    document.documentElement.lang = next;
    localStorage.setItem('BetterBayawan_lang', next);
    document.querySelectorAll('.lang-trigger-label').forEach((e) => (e.textContent = names[next]));
    syncLanguageOptions();
    apply();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: next } }));
  }
  function syncLanguageOptions() {
    document.querySelectorAll('.lang-option').forEach((option) => {
      const selected = (option.dataset.lang === 'bis' ? 'ceb' : option.dataset.lang) === language;
      option.classList.toggle('active', selected);
      option.setAttribute('aria-selected', String(selected));
    });
  }
  function init() {
    const saved =
      localStorage.getItem('BetterBayawan_lang') || localStorage.getItem('selectedLang');
    const browser = navigator.language.split('-')[0];
    language = names[saved]
      ? saved
      : saved === 'bis'
        ? 'ceb'
        : browser === 'tl'
          ? 'fil'
          : names[browser]
            ? browser
            : 'en';
    document.querySelectorAll('.lang-dropdown').forEach((dropdown) => {
      const trigger = dropdown.querySelector('.lang-trigger');
      trigger?.addEventListener('click', () =>
        trigger.setAttribute('aria-expanded', String(dropdown.classList.toggle('open')))
      );
      dropdown.querySelectorAll('.lang-option').forEach((button) =>
        button.addEventListener('click', () => {
          switchLanguage(button.dataset.lang);
          dropdown.classList.remove('open');
          trigger?.setAttribute('aria-expanded', 'false');
          trigger?.focus();
        })
      );
    });
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.lang-dropdown.open').forEach((d) => {
        if (!d.contains(e.target)) {
          d.classList.remove('open');
          d.querySelector('.lang-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape')
        document.querySelectorAll('.lang-dropdown.open').forEach((d) => {
          d.classList.remove('open');
          d.querySelector('.lang-trigger')?.setAttribute('aria-expanded', 'false');
          d.querySelector('.lang-trigger')?.focus();
        });
    });
    document.querySelectorAll('.lang-dropdown').forEach((dropdown) =>
      dropdown.addEventListener('keydown', (e) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        dropdown.classList.add('open');
        dropdown.querySelector('.lang-trigger')?.setAttribute('aria-expanded', 'true');
        const options = [...dropdown.querySelectorAll('.lang-option')];
        let index = options.indexOf(document.activeElement);
        index =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? options.length - 1
              : (index + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[index]?.focus();
      })
    );
    let pending = false;
    observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        apply();
      });
    });
    document.documentElement.lang = language;
    syncLanguageOptions();
    document
      .querySelectorAll('.lang-trigger-label')
      .forEach((e) => (e.textContent = names[language]));
    apply();
  }
  window.TranslationEngine = {
    init,
    switchLanguage,
    getCurrentLanguage: () => language,
    t: (phrase) => translate(phrase),
  };
  window.t = window.TranslationEngine.t;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
