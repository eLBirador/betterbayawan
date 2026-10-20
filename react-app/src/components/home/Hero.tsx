'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import SearchAutocomplete from '@/components/SearchAutocomplete';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="home-hero-v2 civic-hero" aria-labelledby="hero-title">
      <div className="hero-scene" aria-hidden="true">
        <div className="hero-banner" />
        <svg className="civic-hero-waves" viewBox="0 0 2066 170" preserveAspectRatio="none">
          <path
            fill="#a8c2dd"
            fillOpacity=".48"
            d="M0 37C250 77 330 147 665 144S1100 183 1430 122 1820 8 2066 0V170H0Z"
          />
          <path
            fill="#114b91"
            fillOpacity=".86"
            d="M0 10C240 62 352 145 680 145S1110 186 1450 126 1840 14 2066 20V170H0Z"
          />
          <path
            fill="#f8f9fa"
            d="M0 81C250 115 350 156 674 151S1122 184 1452 138 1830 50 2066 48V170H0Z"
          />
        </svg>
      </div>
      <div className="container hero-content">
        <div className="home-hero-v2-inner">
          <div className="home-hero-v2-text">
            <h1 id="hero-title">
              <span className="hero-greeting">{t('hero-greeting')}</span>
              <span className="hero-brand">
                Better<span>Bayawan</span>
              </span>
            </h1>
            <p className="home-hero-slogan">
              <span>#IbayawBayawan</span> <span>#KitaAngBayawan</span>
            </p>
            <p className="hero-intro">{t('hero-subtitle')}</p>
            <ul className="hero-highlights">
              {[
                ['file-earmark-text-fill', 'government'],
                ['info-circle-fill', 'city'],
                ['people-fill', 'citizen'],
              ].map(([icon, key]) => (
                <li key={key}>
                  <span className="hero-highlight-icon">
                    <i className={`bi bi-${icon}`} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{t(`hero-${key}-title`)}</strong>
                    <span>{t(`hero-${key}-description`)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="home-hero-v2-actions">
              <Link href="/services" className="btn btn-primary">
                {t('hero-browse-services')}
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="btn btn-outline">
                {t('hero-contact-us')}
                <i className="bi bi-chat" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="home-hero-v2-search">
            <div className="home-search-box">
              <h2>
                <i className="bi bi-search" aria-hidden="true" />
                {t('hero-find-service')}
              </h2>
              <form className="search-form" role="search" action="/services" method="get">
                <div className="search-input-wrapper">
                  <SearchAutocomplete placeholder={t('hero-search-placeholder')} />
                  <button
                    type="submit"
                    className="search-submit-btn"
                    aria-label={t('hero-search-label')}
                  >
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </button>
                </div>
              </form>
              <div className="home-search-tags">
                <span>{t('hero-popular')}</span>
                <Link href="/service-details/birth-certificate">{t('hero-birth-certificate')}</Link>
                <Link href="/service-details/business-permits-licensing">
                  {t('hero-business-permit')}
                </Link>
                <Link href="/service-details/municipal-treasurer">
                  {t('hero-real-property-tax')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
