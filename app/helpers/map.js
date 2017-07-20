const kdbush = require('kdbush');
const geokdbush = require('geokdbush');
const tilebelt = require('@mapbox/tilebelt');

// Use example
// const firstPoint = { latitude: -3.097125, longitude: -45.600375 }
// const points = [{ latitude: -2.337625, longitude: -46.940875 }]
export function getAllNeighbours(firstPoint, points, distance = 0.03) { // default distance 30m
  const neighbours = [];
  const index = kdbush(points, (p) => p.longitude, (p) => p.latitude);

  function isIncluded(result) {
    for (let i = 0; i < neighbours.length; i++) {
      if (result.latitude === neighbours[i].latitude && result.longitude === neighbours[i].longitude) {
        return true;
      }
    }
    return false;
  }

  function checkSiblings(results) {
    for (let i = 0; i < results.length; i++) {
      if (!isIncluded(results[i])) {
        neighbours.push(results[i]);
        getNeighbours(results[i]); // eslint-disable-line
      }
    }
  }

  function getNeighbours(point) {
    // 4 = max results when never should be bigger than 4
    const data = geokdbush.around(index, point.longitude, point.latitude, 4, distance);
    checkSiblings(data);
  }

  getNeighbours(firstPoint);
  // return array of siblings without the point
  if (neighbours && neighbours.length &&
      neighbours[0].latitude && neighbours[0].latitude === firstPoint.latitude &&
      neighbours[0].longitude && neighbours[0].longitude === firstPoint.longitude) {
    neighbours.shift();
  }
  return neighbours;
}

export function pointsToGeoJSON(points) {
  return {
    type: 'MapCollection',
    features: points.map((value) => ({
      type: 'Map',
      properties: {
        lat: value.lat,
        long: value.long,
        date: value.date
      },
      geometry: {
        type: 'Point',
        coordinates: [
          value.long,
          value.lat
        ]
      }
    }))
  };
}

export function pointsFromGeojson(geojson) {
  if (!geojson || !geojson.features) return [];
  return geojson.features.map((feature) => ({
    lon: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1]
  }));
}

export function getTilesInBbox(bbox, zooms) {
  const tilesArray = [];
  const zoomsArray = typeof zooms === 'number'
    ? [zooms]
    : zooms;
  zoomsArray.forEach((zoom) => {
    const pointTiles = bbox.map(point => tilebelt.pointToTile(point.lat, point.lng, zoom));
    const tiles = {
      x: [pointTiles[0][0], pointTiles[1][0]],
      y: [pointTiles[0][1], pointTiles[1][1]]
    };
    for (let x = tiles.x[0], xLength = tiles.x[1]; x <= xLength; x++) {
      for (let y = tiles.y[0], yLength = tiles.y[1]; y <= yLength; y++) {
        tilesArray.push([x, y, zoom]);
      }
    }
  });
  return tilesArray;
}
