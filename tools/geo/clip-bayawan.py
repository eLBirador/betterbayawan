"""One-off: clip the Bayawan City OSM boundary to land. See assets/geo/README.md.

Inputs (from Nominatim, saved locally): bayawan-osm.geojson (relation 3740497 Feature)
and negros-island.json (Nominatim search result list for "Negros Island").
Requires: pip install shapely
"""
import json
from shapely.geometry import shape, mapping

city = shape(json.load(open('bayawan-osm.geojson'))['geometry'])
land = shape(json.load(open('negros-island.json'))[0]['geojson']).buffer(0)
clipped = city.intersection(land)
if clipped.geom_type == 'MultiPolygon':
    clipped = max(clipped.geoms, key=lambda g: g.area)
clipped = clipped.simplify(0.0001)


def rnd(o):
    return [rnd(x) for x in o] if isinstance(o[0], (list, tuple)) else [round(o[0], 5), round(o[1], 5)]


out = {
    'type': 'Feature',
    'properties': {'name': 'Bayawan City', 'osm_relation': 3740497,
                   'source': '© OpenStreetMap contributors, ODbL 1.0'},
    'geometry': {'type': 'Polygon', 'coordinates': rnd(mapping(clipped)['coordinates'])},
}
json.dump(out, open('bayawan.geojson', 'w'), separators=(',', ':'))
