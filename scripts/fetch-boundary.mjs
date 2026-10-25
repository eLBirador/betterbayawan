// Fetches the Bayawan City boundary from api.gis.ph at build time so the API key
// never reaches the browser. Needs GISPH_API_KEY; without it the committed file is kept.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PSGC = '1804606000';
const URL_ = `https://api.gis.ph/v1/municities/${PSGC}?format=geojson&geometry=detailed`;
const OUT = fileURLToPath(new URL('../assets/geo/bayawan.geojson', import.meta.url));
const key = process.env.GISPH_API_KEY;

const round = (c) =>
  typeof c[0] === 'number' ? c.map((n) => Math.round(n * 1e5) / 1e5) : c.map(round);

async function main() {
  if (!key) {
    console.log(
      'fetch-boundary: GISPH_API_KEY not set; keeping committed assets/geo/bayawan.geojson.'
    );
    return;
  }
  const res = await fetch(URL_, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/geo+json, application/json' },
  });
  if (!res.ok) throw new Error(`api.gis.ph responded ${res.status}`);
  const body = await res.json();
  const f =
    body.type === 'FeatureCollection'
      ? body.features[0]
      : body.type === 'Feature'
        ? body
        : body.data;
  if (!f || !f.geometry || !/Polygon$/.test(f.geometry.type))
    throw new Error('unexpected api.gis.ph response shape');
  const feature = {
    type: 'Feature',
    properties: {
      name: f.properties?.name || 'City of Bayawan',
      psgc: PSGC,
      source: 'GIS.ph (https://gis.ph), api.gis.ph/v1/municities/' + PSGC + ', geometry=detailed',
      fetched: new Date().toISOString().slice(0, 10),
    },
    geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) },
  };
  writeFileSync(OUT, JSON.stringify(feature) + '\n');
  console.log(`fetch-boundary: wrote ${f.geometry.type} to assets/geo/bayawan.geojson`);
}

main().catch((error) => {
  console.warn(`fetch-boundary: skipped (${error.message}); keeping committed file.`);
});
