'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { findServices } from '@/data/services';
import { useLanguage } from '@/contexts/LanguageContext';

const categories = [
  ['certificates', 'file-earmark-text-fill', 'cat-certificates', 'cat-certificates-desc'],
  ['business', 'shop', 'cat-business', 'cat-business-desc'],
  ['social-services', 'people-fill', 'cat-social', 'cat-social-desc'],
  ['health', 'heart-pulse-fill', 'cat-health', 'cat-health-desc'],
  ['tax-payments', 'cash-coin', 'cat-tax', 'cat-tax-desc'],
  ['agriculture', 'flower1', 'cat-agriculture', 'cat-agriculture-desc'],
  ['infrastructure', 'building-fill-gear', 'cat-infrastructure', 'cat-infrastructure-desc'],
  ['education', 'mortarboard-fill', 'cat-education', 'cat-education-desc'],
  ['public-safety', 'shield-fill-check', 'cat-safety', 'cat-safety-desc'],
  ['environment', 'globe-americas', 'cat-environment', 'cat-environment-desc'],
];

export default function ServicesPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get('q') || '');
  }, []);
  const results = query.trim() ? findServices(query) : [];
  return (
    <>
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">{t('nav-home')}</Link>
          <span>/</span>
          <span aria-current="page">{t('nav-services')}</span>
        </nav>
      </div>
      <section className="page-header">
        <div className="container">
          <div className="page-header-content">
            <span className="page-header-badge">
              <i className="bi bi-grid-fill" aria-hidden="true" />
              {t('nav-services')}
            </span>
            <h1>{t('services-title')}</h1>
            <p className="page-header-desc">{t('services-subtitle')}</p>
            <form
              className="directory-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const url = new URL(window.location.href);
                if (query.trim()) url.searchParams.set('q', query.trim());
                else url.searchParams.delete('q');
                window.history.replaceState(null, '', url);
              }}
            >
              <input
                name="q"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t('hero-search-label')}
                placeholder={t('hero-search-example')}
              />
              <button className="btn btn-primary" type="submit" aria-label={t('hero-search-label')}>
                <i className="bi bi-search" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </section>
      {query.trim() && (
        <section className="section">
          <div className="container">
            <p className="directory-result-count" role="status">
              {t('directory-results')}: {results.length}
            </p>
            <div className="grid grid-3">
              {results.map((service) => (
                <a key={service.id} href={service.url} className="service-category-card">
                  <div className="service-category-content">
                    <h2 className="service-category-title">{service.title}</h2>
                    <p className="service-category-desc">{service.description}</p>
                    <span className="service-category-link">
                      {service.office}
                      <i className="bi bi-arrow-right" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
            {results.length === 0 && <p>{t('directory-no-results')}</p>}
          </div>
        </section>
      )}
      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {categories.map(([path, icon, title, description]) => (
              <a href={`/services/${path}`} className="service-category-card" key={path}>
                <div className="service-category-icon">
                  <i className={`bi bi-${icon}`} aria-hidden="true" />
                </div>
                <div className="service-category-content">
                  <h2 className="service-category-title">{t(title)}</h2>
                  <p className="service-category-desc">{t(description)}</p>
                  <span className="service-category-link">
                    {t('svc-view-services')}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="section bg-alt">
        <div className="container">
          <div className="home-section-header">
            <h2>{t('life-events-title')}</h2>
            <p>{t('life-events-subtitle')}</p>
          </div>
          <div className="grid grid-4">
            {[
              ['business', 'shop', 'svc-starting-a-business'],
              ['certificates', 'heart', 'svc-getting-married'],
              ['social-services', 'person-hearts', 'cat-social'],
              ['education', 'mortarboard', 'cat-education'],
            ].map(([path, icon, key]) => (
              <a className="life-event-card" key={path} href={`/services/${path}`}>
                <i className={`bi bi-${icon}`} aria-hidden="true" />
                {t(key)}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
