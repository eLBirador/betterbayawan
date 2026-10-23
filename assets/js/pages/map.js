/**
 * Bayawan City map. Vanilla port of bettergov's LocalityMap + camera.ts.
 * Boundaries come straight from api.gis.ph; there is no backend.
 */
(function () {
  'use strict';

  // ---- Config (per instance) -------------------------------------------
  var GIS_PH_API_URL = 'https://api.gis.ph';
  // SECURITY: this site is fully static, so the key below is visible to anyone
  // who opens the page. Set window.__BETTERBAYAWAN_GIS_KEY__ at deploy time,
  // never commit a real key, and rotate it at gis.ph if it leaks.
  var GIS_PH_API_KEY = window.__BETTERBAYAWAN_GIS_KEY__ || '';
  // City of Bayawan. GIS.ph uses the 10-digit PSGC (Negros Island Region).
  var GIS_PSGC_CODE = '1804606000';
  var GEOMETRY = 'detailed';
  var PAGE_LIMIT = 100;
  /** How many zoom clicks out from the PSGC boundary are allowed. */
  var ZOOM_OUT_LEVELS = 2;
  /** World bounds used only while a flight is in progress. */
  var WORLD_BOUNDS = [
    [-85, -180],
    [85, 180],
  ];
  var PH_CENTER = [9.36, 123.11];

  var mapEl = document.getElementById('bayawan-map');
  var listEl = document.getElementById('barangay-list');
  var statusEl = document.getElementById('map-status');
  if (!mapEl || !listEl || !statusEl) return;

  function setStatus(message) {
    statusEl.textContent = message;
  }

  if (typeof window.L === 'undefined') {
    setStatus('The map library did not load. Check your connection and reload.');
    return;
  }
  if (!GIS_PH_API_KEY) {
    setStatus('Map is not configured: set window.__BETTERBAYAWAN_GIS_KEY__ to a GIS.ph API key.');
    return;
  }
  if (!/^\d{9,10}$/.test(GIS_PSGC_CODE)) {
    setStatus('GIS_PSGC_CODE must be a 9 or 10 digit PSGC code.');
    return;
  }

  var L = window.L;

  // ---- camera.ts ---------------------------------------------------------
  function boundsOf(data) {
    var bounds = L.geoJSON(data).getBounds();
    return bounds.isValid() ? bounds : null;
  }

  function fitZoom(map, bounds) {
    // getBoundsZoom will not return anything below the current minZoom.
    // Write the option directly; setMinZoom() animates and fights the home view.
    var previousMin = map.options.minZoom;
    map.options.minZoom = 0;
    var zoom = map.getBoundsZoom(bounds, false, L.point(28, 28));
    map.options.minZoom = previousMin;
    return zoom;
  }

  /** Lower the zoom floor without the animated setZoom that setMinZoom() performs. */
  function setMinZoomQuiet(map, minZoom) {
    if (map.options.minZoom === minZoom) return;
    map.options.minZoom = minZoom;
    map.fire('zoomlevelschange');
  }

  /** Pan limit built from the viewport at minZoom, kept larger than that viewport. */
  function viewLimits(map, bounds, minZoom) {
    var half = map.getSize().divideBy(2);
    var center = map.project(bounds.getCenter(), minZoom);
    var view = L.latLngBounds(
      map.unproject(center.subtract(half), minZoom),
      map.unproject(center.add(half), minZoom)
    );
    return view.extend(bounds).pad(0.25);
  }

  function stopCamera(map) {
    map.stop();
    // stop() does not cancel a zoom tween; its timeout would pull the map back.
    map._animatingZoom = false;
  }

  function showView(map, bounds, limits, flight, animate) {
    var id = ++flight.current;
    var zoom = fitZoom(map, bounds);
    stopCamera(map);
    // A tight maxBounds aborts a zoom-out flight. Open it up, then restore.
    map.setMaxBounds(WORLD_BOUNDS);
    if (!animate) {
      map.setView(bounds.getCenter(), zoom, { animate: false });
      map.setMaxBounds(limits);
      return;
    }
    map.flyTo(bounds.getCenter(), zoom, { duration: 0.7 });
    map.once('moveend', function () {
      if (flight.current !== id) return;
      // flyTo scales the canvas and can leave the polygons off the tiles.
      stopCamera(map);
      map.setView(map.getCenter(), map.getZoom(), { animate: false });
      map.setMaxBounds(limits);
    });
  }

  // ---- Map ---------------------------------------------------------------
  var map = L.map(mapEl, {
    center: PH_CENTER,
    zoom: 10,
    zoomSnap: 0,
    zoomAnimation: false,
    scrollWheelZoom: true,
    preferCanvas: true,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var flight = { current: 0 };
  var limits = null;
  var homeBounds = null;
  var selectedCode = null;
  var areas = null;
  var layersByCode = {};
  var buttonsByCode = {};
  var loadedStatus = '';

  function featureCode(feature) {
    var code = feature && feature.properties && feature.properties.code;
    return typeof code === 'string' ? code : '';
  }

  function featureName(feature) {
    var name = feature && feature.properties && feature.properties.name;
    return typeof name === 'string' ? name : '';
  }

  function areaStyle(feature) {
    var selected = selectedCode !== null && featureCode(feature) === selectedCode;
    return {
      color: selected ? '#003d8f' : '#0051ba',
      weight: selected ? 3 : 1,
      fillColor: selected ? '#0051ba' : '#4c8fe0',
      fillOpacity: selected ? 0.55 : 0.28,
    };
  }

  function select(code) {
    selectedCode = code && code !== selectedCode ? code : null;
    if (areas) {
      areas.eachLayer(function (layer) {
        if (typeof layer.setStyle === 'function') layer.setStyle(areaStyle(layer.feature));
      });
    }
    Object.keys(buttonsByCode).forEach(function (key) {
      var on = key === selectedCode;
      buttonsByCode[key].classList.toggle('is-selected', on);
      buttonsByCode[key].setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!limits || !homeBounds) return;
    var layer = selectedCode && layersByCode[selectedCode];
    if (layer) {
      var target = boundsOf(layer.feature);
      if (target) showView(map, target, limits, flight, true);
      if (layer.getPopup()) layer.openPopup(target ? target.getCenter() : undefined);
      setStatus('Selected ' + featureName(layer.feature) + '.');
    } else {
      map.closePopup();
      if (loadedStatus) setStatus(loadedStatus);
      setMinZoomQuiet(map, Math.max(0, fitZoom(map, homeBounds) - ZOOM_OUT_LEVELS));
      showView(map, homeBounds, limits, flight, true);
    }
  }

  // Re-fit and re-clamp on every container resize (ported MapCamera effect).
  var appliedFor = '';
  function applyHome() {
    map.invalidateSize({ pan: false });
    var size = map.getSize();
    if (size.x < 10 || size.y < 10 || !homeBounds) return;
    var key = size.x + 'x' + size.y;
    if (key === appliedFor) return;
    var minZoom = Math.max(0, fitZoom(map, homeBounds) - ZOOM_OUT_LEVELS);
    setMinZoomQuiet(map, minZoom);
    limits = viewLimits(map, homeBounds, minZoom);
    map.options.maxBoundsViscosity = 1;
    appliedFor = key;
    if (!selectedCode) showView(map, homeBounds, limits, flight, false);
    else map.setMaxBounds(limits);
  }

  // ---- Data --------------------------------------------------------------
  function gisFetch(path) {
    return fetch(GIS_PH_API_URL + path, {
      headers: {
        Authorization: 'Bearer ' + GIS_PH_API_KEY,
        Accept: 'application/json, application/geo+json',
      },
    }).then(function (response) {
      return response.text().then(function (text) {
        var body = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch (e) {
          body = { message: text.slice(0, 300) };
        }
        if (!response.ok) {
          var message = (body && body.message) || 'GIS.ph responded ' + response.status;
          throw new Error(message);
        }
        return body;
      });
    });
  }

  function isCollection(body) {
    return body && body.type === 'FeatureCollection' && Array.isArray(body.features);
  }

  // /v1/barangays filters on municipality_code; list endpoints cap limit at 100.
  function loadBarangays(place, page, acc) {
    var params = new URLSearchParams({
      province_code: place.provinceCode,
      municipality_code: place.code,
      format: 'geojson',
      geometry: GEOMETRY,
      limit: String(PAGE_LIMIT),
      page: String(page),
    });
    return gisFetch('/v1/barangays?' + params.toString()).then(function (body) {
      if (!isCollection(body)) throw new Error('GIS.ph barangay response was not GeoJSON.');
      var seen = {};
      acc.forEach(function (f) {
        seen[featureCode(f)] = true;
      });
      var fresh = body.features.filter(function (f) {
        return !seen[featureCode(f)];
      });
      acc = acc.concat(fresh);
      if (body.features.length < PAGE_LIMIT || fresh.length === 0 || page >= 20) return acc;
      return loadBarangays(place, page + 1, acc);
    });
  }

  function renderList(features) {
    var sorted = features.slice().sort(function (a, b) {
      return featureName(a).localeCompare(featureName(b));
    });
    var fragment = document.createDocumentFragment();
    sorted.forEach(function (feature) {
      var code = featureCode(feature);
      if (!code) return;
      var item = document.createElement('li');
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.code = code;
      button.setAttribute('aria-pressed', 'false');
      button.textContent = featureName(feature) || code;
      button.addEventListener('click', function () {
        select(code);
      });
      buttonsByCode[code] = button;
      item.appendChild(button);
      fragment.appendChild(item);
    });
    listEl.replaceChildren(fragment);
  }

  setStatus('Loading Bayawan City from GIS.ph…');
  gisFetch('/v1/municities/' + GIS_PSGC_CODE)
    .then(function (body) {
      var data = (body && body.data) || body || {};
      var place = {
        code: String(data.code || GIS_PSGC_CODE),
        name: data.name || 'Bayawan City',
        provinceCode: String(data.p_code || (data.provinces && data.provinces.code) || ''),
      };
      if (!place.provinceCode)
        throw new Error('GIS.ph did not return a province for this PSGC code.');
      setStatus('Loading barangay boundaries…');
      return Promise.all([
        loadBarangays(place, 1, []),
        gisFetch('/v1/municities/' + GIS_PSGC_CODE + '?format=geojson&geometry=' + GEOMETRY).catch(
          function () {
            return null;
          }
        ),
      ]).then(function (results) {
        return { place: place, barangays: results[0], outline: results[1] };
      });
    })
    .then(function (result) {
      var place = result.place;
      // l_code is the parent city/municipality PSGC. Keep features that have none.
      var features = result.barangays.filter(function (feature) {
        var parent = feature.properties && feature.properties.l_code;
        return typeof parent !== 'string' || parent.trim() === place.code;
      });
      var outline = result.outline && result.outline.type === 'Feature' ? result.outline : null;

      if (outline) {
        L.geoJSON(outline, {
          style: { color: '#0f172a', weight: 2, fillOpacity: 0 },
          interactive: false,
        }).addTo(map);
      }
      if (features.length) {
        areas = L.geoJSON(
          { type: 'FeatureCollection', features: features },
          {
            style: areaStyle,
            onEachFeature: function (feature, layer) {
              var name = featureName(feature);
              var code = featureCode(feature);
              if (name) {
                layer.bindTooltip(name, { sticky: true });
                var label = document.createElement('strong');
                label.textContent = name;
                layer.bindPopup(label);
              }
              if (code) layersByCode[code] = layer;
              layer.on('click', function () {
                if (code) select(code);
              });
            },
          }
        ).addTo(map);
      }
      renderList(features);

      homeBounds =
        (outline && boundsOf(outline)) ||
        (features.length ? boundsOf({ type: 'FeatureCollection', features: features }) : null);
      if (!homeBounds) {
        setStatus('GIS.ph returned no boundaries for ' + place.name + '.');
        return;
      }
      applyHome();
      requestAnimationFrame(applyHome);
      if (typeof ResizeObserver === 'function') new ResizeObserver(applyHome).observe(mapEl);
      else window.addEventListener('resize', applyHome);
      loadedStatus = features.length + ' barangays in ' + place.name + '. Select one to zoom in.';
      setStatus(loadedStatus);
    })
    .catch(function (error) {
      setStatus(
        'Could not load the map from GIS.ph: ' +
          (error && error.message ? error.message : 'network error') +
          '.'
      );
    });
})();
