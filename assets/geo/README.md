# Map boundary

Used by the home page "Bayawan City at a Glance" map (`assets/js/pages/glance-map.js`).

- `bayawan.geojson`: City of Bayawan (PSGC 1804606000) from GIS.ph,
  `GET https://api.gis.ph/v1/municities/1804606000?format=geojson&geometry=detailed`,
  coordinates rounded to 5 decimals. The source and fetch date are in the feature properties.

Refresh with `npm run geo:fetch` (it also runs at the start of `npm run build`). It reads
`GISPH_API_KEY` from the environment and sends it as a Bearer token at build time only,
so the key never ships to the browser. Without the key, the committed file is kept.

Boundary data © GIS.ph (https://gis.ph). The credit is shown in the map attribution.
