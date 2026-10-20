import directory from '../../../data/services.json';

export const services = directory.services.map((service) => {
  const url = new URL(service.url, 'https://betterbayawan.org/services/');
  return {
    ...service,
    url:
      url.origin === 'https://betterbayawan.org'
        ? url.pathname.replace(/\.html$/, '') + url.search + url.hash
        : url.href,
  };
});

export function findServices(query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return services.filter((service) => {
    const text = [
      service.title,
      service.description,
      service.category,
      service.office,
      ...service.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
