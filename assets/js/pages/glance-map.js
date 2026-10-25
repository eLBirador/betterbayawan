// Bayawan City at a Glance map (issue #2). MapLibre GL is loaded from a pinned CDN build.
(function () {
  const el = document.getElementById('glance-map');
  if (!el) return;
  const CITY_HALL = [122.7892, 9.3839];
  function start() {
    if (!window.maplibregl) return;
    const mobile = matchMedia('(max-width: 768px)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = new maplibregl.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [122.82, 9.45],
      zoom: 9.5,
      attributionControl: false,
      cooperativeGestures: true,
    });
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          'Boundary © <a href="https://gis.ph" target="_blank" rel="noopener">GIS.ph</a>',
      }),
      'bottom-right'
    );
    // Start collapsed to the (i) button; MapLibre auto-expands compact attribution on wide maps.
    map.once('load', () =>
      el
        .querySelectorAll('.maplibregl-compact-show')
        .forEach((n) => n.classList.remove('maplibregl-compact-show'))
    );
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    const load = (u) => fetch(u).then((r) => r.json());
    Promise.all([
      load('/assets/geo/bayawan.geojson'),
      new Promise((ok) => (map.loaded() ? ok() : map.on('load', ok))),
    ])
      .then(([city]) => {
        const g = city.geometry;
        const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]);
        map.addSource('city', { type: 'geojson', data: city });
        map.addLayer({
          id: 'city-fill',
          type: 'fill',
          source: 'city',
          paint: { 'fill-color': '#0032a0', 'fill-opacity': 0.2 },
        });
        map.addLayer({
          id: 'city-halo',
          type: 'line',
          source: 'city',
          paint: { 'line-color': '#fff', 'line-width': 5, 'line-opacity': 0.9 },
        });
        map.addLayer({
          id: 'city-line',
          type: 'line',
          source: 'city',
          paint: { 'line-color': '#0032a0', 'line-width': 2.5 },
        });
        new maplibregl.Marker({ color: '#f77f00' }).setLngLat(CITY_HALL).addTo(map);
        const bounds = new maplibregl.LngLatBounds();
        rings.flat().forEach((p) => bounds.extend(p));
        const padding = mobile
          ? { top: 40, bottom: 206, left: 16, right: 16 }
          : { top: 40, bottom: 60, left: 380, right: 340 };
        // Lock the view to the city: no zooming out past the fitted view, at most
        // 2 levels in, and no panning beyond the fitted extent (the city's bbox
        // plus the padding that keeps it clear of the cards).
        const fit = map.cameraForBounds(bounds, { padding });
        map.setMinZoom(fit.zoom);
        map.setMaxZoom(fit.zoom + 2);
        map.once('moveend', () => {
          map.setMinZoom(map.getZoom());
          map.setMaxBounds(map.getBounds());
        });
        map.fitBounds(bounds, { padding, duration: reduce ? 0 : 1200 });
      })
      .catch((error) => console.error('Glance map:', error));
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
