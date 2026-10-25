# Map boundaries

Used by the home page "Bayawan City at a Glance" map (`assets/js/glance-map.js`).

- `bayawan.geojson`: Bayawan City, OSM relation 3740497, fetched from Nominatim
  (`search?q=Bayawan, Negros Oriental&format=json&polygon_geojson=1`). The OSM
  boundary includes a municipal-waters wedge south of the coast. To shade only land,
  it was intersected with the Negros island polygon (OSM relation 4098809, Nominatim
  `polygon_threshold=0.0003`) using shapely, then simplified to 0.0001° and rounded
  to 5 decimals. Script: `tools/geo/clip-bayawan.py`. This is a one-off build; the
  site makes no live Nominatim requests.
- `negros-oriental.geojson`: Negros Oriental outline from Nominatim, simplified with
  `polygon_threshold=0.005`.

© OpenStreetMap contributors, ODbL 1.0. The attribution is shown on the map.
