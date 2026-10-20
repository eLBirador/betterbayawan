'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { findServices } from '@/data/services';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SearchAutocomplete({ placeholder }: { placeholder?: string }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const results = query.trim().length >= 2 ? findServices(query).slice(0, 6) : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="search-autocomplete-wrapper"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <input
        type="search"
        name="q"
        className="search-box"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || t('hero-search-label')}
        aria-label={t('hero-search-label')}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls={open && results.length > 0 ? id : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setActive(-1);
          }
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length) {
            e.preventDefault();
            setOpen(true);
            setActive(
              (previous) =>
                (previous + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
            );
          }
          if (e.key === 'Enter' && open && active >= 0 && results[active]) {
            e.preventDefault();
            window.location.assign(results[active].url);
          }
        }}
      />
      {open && results.length > 0 && (
        <ul
          id={id}
          className="search-autocomplete-list"
          role="listbox"
          aria-label={t('hero-search-label')}
        >
          {results.map((item, index) => (
            <li
              id={`${id}-${index}`}
              key={item.id}
              role="option"
              aria-selected={active === index}
              className="search-autocomplete-item"
            >
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
