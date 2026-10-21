import { load } from 'cheerio';
export const normalize = (s) => s.replace(/\s+/g, ' ').trim();
export function collectStrings(html) {
  const $ = load(html);
  $(
    'script,style,svg,code,pre,.lang-menu,.lang-trigger-label,[data-no-translate],[translate="no"]'
  ).remove();
  const strings = new Set();
  const add = (s) => {
    s = normalize(s || '');
    if (/[a-zA-Z]{2}/.test(s) && !/^https?:|^[\w.+-]+@[\w.-]+$/.test(s)) strings.add(s);
  };
  function visit(n) {
    if (n.type === 'text') add(n.data);
    else for (const c of n.children || []) visit(c);
  }
  $('body').each((i, e) => visit(e));
  $('[placeholder],[aria-label],[title],[alt]').each((i, e) => {
    for (const a of ['placeholder', 'aria-label', 'title', 'alt']) add($(e).attr(a));
  });
  return strings;
}
