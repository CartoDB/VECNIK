
var Geometry = module.exports = {};

Geometry.POINT   = 'Point';
Geometry.LINE    = 'LineString';
Geometry.POLYGON = 'Polygon';

var proto = Geometry;

proto.getCentroid = function(featureParts) {
  var part, coordinates, tileX, tileY;

  if (!featureParts || !featureParts.length) {
    return;
  }

  if (featureParts.length === 1) {
    part = featureParts[0];
  } else {
    part = _getLargestPart(featureParts);
  }

  if (!part) {
    return;
  }

  coordinates = part.feature.coordinates;
  tileX = part.tileCoords.x*part.tileSize;
  tileY = part.tileCoords.y*part.tileSize;

  if (part.feature.type === Geometry.POINT) {
    return {
      x: coordinates[0] + tileX,
      y: coordinates[1] + tileY
    };
  }

  if (part.feature.type === Geometry.POLYGON) {
    coordinates = coordinates[0];
  }

  var
    startX = coordinates[0], startY = coordinates[1],
    xTmp = 0, yTmp = 0,
    dx0, dy0,
    dx1, dy1,
    len, lenSum = 0;

  for (var i = 0, il = coordinates.length-3; i < il; i+=2) {
    dx0 = coordinates[i  ]-startX;
    dy0 = coordinates[i+1]-startY;
    dx1 = coordinates[i+2]-startX;
    dy1 = coordinates[i+3]-startY;

    len = dx0*dy1 - dx1*dy0;

    lenSum += len;
    xTmp += (dx1+dx0) * len;
    yTmp += (dy1+dy0) * len;
  }

  if (lenSum) {
    return {
      x: (xTmp/(3*lenSum)) + startX + tileX,
      y: (yTmp/(3*lenSum)) + startY + tileY
    };
  }

  return {
    x: startX + tileX,
    y: startY + tileY
  };
};

function _getBBox(coordinates) {
  var
    min = Math.min,
    max = Math.max,
    minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (var i = 0, il = coordinates.length-1; i < il; i+=2) {
    minX = min(minX, coordinates[i]);
    maxX = max(maxX, coordinates[i]);
    minY = min(minY, coordinates[i+1]);
    maxY = max(maxY, coordinates[i+1]);
  }

  return { minX:minX, minY:minY, maxX:maxX, maxY:maxY };
}

function _getArea(coordinates) {
  if (coordinates.length < 6) {
    return 0;
  }
  var sum = 0;
  for (var i = 0, il = coordinates.length-3; i < il; i+=2) {
    sum += (coordinates[i+2]-coordinates[i]) * (coordinates[i+1]+coordinates[i+3]);
  }
  sum += (coordinates[0]-coordinates[il]) * (coordinates[il+1]+coordinates[1]);
  return -sum/2;
}

function _getLargestPart(featureParts) {
  var
    area, maxArea = -Infinity,
    part, maxPart,
    coordinates;

  for (var i = 0, il = featureParts.length; i < il; i++) {
    part = featureParts[i];
    coordinates = part.feature.coordinates;

    if (part.feature.type === Geometry.POINT) {
      return part;
    }

    if (part.feature.type === Geometry.POLYGON) {
      coordinates = coordinates[0];
    }

    area = _getArea(coordinates);

    if (area > maxArea) {
      maxArea = area;
      maxPart = part;
    }
  }

  return maxPart;
}
