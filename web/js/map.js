// Procedural neighborhood from real-life street rules. No authored tile map.
// Plan of record: sidewalks both sides, cars on streets, crosswalks at
// intersections only, home at center, busy-near / quiet-far, grass on edges.
(function (root) {
  "use strict";

  var W = 400;
  var H = 240;
  var MARGIN = 16;
  var STREET_W = 10;
  var SIDEWALK_W = 10;
  var CORRIDOR = STREET_W + SIDEWALK_W * 2;
  var N_STREETS_X = 4;
  var N_STREETS_Y = 2;

  var CELL = {
    YARD: 0,
    STREET: 1,
    SIDEWALK: 2,
    CROSSWALK: 3,
    GRASS: 4,
    HOME: 5,
    BUILDING: 6,
  };

  var WALKABLE = {};
  WALKABLE[CELL.SIDEWALK] = true;
  WALKABLE[CELL.CROSSWALK] = true;
  WALKABLE[CELL.GRASS] = true;
  WALKABLE[CELL.HOME] = true;

  function idx(x, y) {
    return y * W + x;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < W && y < H;
  }

  function evenBands(length, margin, streetCount, corridor) {
    var inner = length - margin * 2;
    var lotCount = streetCount + 1;
    var lotSpace = inner - streetCount * corridor;
    var lot = lotSpace / lotCount;
    var lots = [];
    var streets = [];
    var cursor = margin;
    for (var i = 0; i < streetCount; i++) {
      lots.push({ a: cursor, b: cursor + lot });
      cursor += lot;
      streets.push({ a: cursor, b: cursor + corridor });
      cursor += corridor;
    }
    lots.push({ a: cursor, b: cursor + lot });
    return { lots: lots, streets: streets, lot: lot };
  }

  function decorateStreetX(band) {
    return {
      a: band.a,
      b: band.b,
      walkL0: band.a,
      walkL1: band.a + SIDEWALK_W,
      asphalt0: band.a + SIDEWALK_W,
      asphalt1: band.b - SIDEWALK_W,
      walkR0: band.b - SIDEWALK_W,
      walkR1: band.b,
      center: (band.a + band.b) / 2,
      asphaltCenter: band.a + SIDEWALK_W + STREET_W / 2,
    };
  }

  function decorateStreetY(band) {
    return {
      a: band.a,
      b: band.b,
      walkT0: band.a,
      walkT1: band.a + SIDEWALK_W,
      asphalt0: band.a + SIDEWALK_W,
      asphalt1: band.b - SIDEWALK_W,
      walkB0: band.b - SIDEWALK_W,
      walkB1: band.b,
      center: (band.a + band.b) / 2,
      asphaltCenter: band.a + SIDEWALK_W + STREET_W / 2,
    };
  }

  function stamp(cells, x0, y0, x1, y1, kind) {
    var xa = Math.max(0, Math.floor(x0));
    var ya = Math.max(0, Math.floor(y0));
    var xb = Math.min(W, Math.ceil(x1));
    var yb = Math.min(H, Math.ceil(y1));
    for (var y = ya; y < yb; y++) {
      for (var x = xa; x < xb; x++) {
        cells[idx(x, y)] = kind;
      }
    }
  }

  function get(cells, x, y) {
    if (!inBounds(x, y)) return CELL.YARD;
    return cells[idx(x | 0, y | 0)];
  }

  function isWalkableKind(kind) {
    return WALKABLE[kind] === true;
  }

  function isWalkableAt(cells, x, y) {
    return isWalkableKind(get(cells, Math.floor(x), Math.floor(y)));
  }

  function densityAt(x, y) {
    var dx = (x - W / 2) / (W / 2);
    var dy = (y - H / 2) / (H / 2);
    var d = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, 1 - Math.min(1.15, d));
  }

  function lotCenter(lot) {
    return { x: (lot.x0 + lot.x1) / 2, y: (lot.y0 + lot.y1) / 2 };
  }

  function paintVerticalStreets(cells, vStreets, y0, y1) {
    for (var i = 0; i < vStreets.length; i++) {
      var s = vStreets[i];
      stamp(cells, s.walkL0, y0, s.walkL1, y1, CELL.SIDEWALK);
      stamp(cells, s.asphalt0, y0, s.asphalt1, y1, CELL.STREET);
      stamp(cells, s.walkR0, y0, s.walkR1, y1, CELL.SIDEWALK);
    }
  }

  function paintHorizontalStreets(cells, hStreets, x0, x1) {
    for (var i = 0; i < hStreets.length; i++) {
      var s = hStreets[i];
      for (var y = Math.floor(s.a); y < Math.ceil(s.b); y++) {
        var inAsphalt = y >= s.asphalt0 && y < s.asphalt1;
        for (var x = Math.floor(x0); x < Math.ceil(x1); x++) {
          var iCell = idx(x, y);
          var cur = cells[iCell];
          if (inAsphalt) {
            cells[iCell] = cur === CELL.SIDEWALK ? CELL.CROSSWALK : CELL.STREET;
          } else if (cur === CELL.STREET) {
            cells[iCell] = CELL.CROSSWALK;
          } else {
            cells[iCell] = CELL.SIDEWALK;
          }
        }
      }
    }
  }

  function buildLots(xLayout, yLayout) {
    var lots = [];
    for (var j = 0; j < yLayout.lots.length; j++) {
      for (var i = 0; i < xLayout.lots.length; i++) {
        var lot = {
          col: i,
          row: j,
          x0: xLayout.lots[i].a,
          x1: xLayout.lots[i].b,
          y0: yLayout.lots[j].a,
          y1: yLayout.lots[j].b,
        };
        var c = lotCenter(lot);
        lot.cx = c.x;
        lot.cy = c.y;
        lot.density = densityAt(c.x, c.y);
        lot.isHome = i === Math.floor(xLayout.lots.length / 2) && j === Math.floor(yLayout.lots.length / 2);
        lots.push(lot);
      }
    }
    return lots;
  }

  function rectHitsKind(cells, x0, y0, x1, y1, kind) {
    for (var y = Math.floor(y0); y < Math.ceil(y1); y++) {
      for (var x = Math.floor(x0); x < Math.ceil(x1); x++) {
        if (get(cells, x, y) === kind) return true;
      }
    }
    return false;
  }

  function placeBuildings(cells, lots, rng) {
    var buildings = [];
    for (var i = 0; i < lots.length; i++) {
      var lot = lots[i];
      if (lot.isHome) continue;
      var count;
      if (lot.density > 0.5) count = 3;
      else if (lot.density > 0.32) count = 2;
      else if (lot.density > 0.18) count = rng.chance(0.5) ? 1 : 0;
      else count = rng.chance(0.2) ? 1 : 0;
      var inset = 7;
      var innerW = lot.x1 - lot.x0 - inset * 2;
      var innerH = lot.y1 - lot.y0 - inset * 2;
      if (innerW < 10 || innerH < 10) continue;
      var attempts = 0;
      var placed = 0;
      while (placed < count && attempts < count * 8) {
        attempts++;
        var bw = rng.int(10, Math.min(18, Math.floor(innerW)));
        var bh = rng.int(12, Math.min(20, Math.floor(innerH)));
        var bx = rng.float(lot.x0 + inset, lot.x1 - inset - bw);
        var by = rng.float(lot.y0 + inset, lot.y1 - inset - bh);
        if (rectHitsKind(cells, bx, by, bx + bw, by + bh, CELL.SIDEWALK)) continue;
        if (rectHitsKind(cells, bx, by, bx + bw, by + bh, CELL.STREET)) continue;
        stamp(cells, bx, by, bx + bw, by + bh, CELL.BUILDING);
        buildings.push({ x: bx, y: by, w: bw, h: bh, roof: rng.chance(0.7) });
        placed++;
      }
    }
    return buildings;
  }

  function placeHome(cells, homeLot) {
    var bw = 22;
    var bh = 18;
    var bx = homeLot.cx - bw / 2;
    var by = homeLot.cy - bh / 2 - 3;
    stamp(cells, bx, by, bx + bw, by + bh, CELL.BUILDING);
    var doorW = 6;
    var doorH = 4;
    var doorX = homeLot.cx - doorW / 2;
    var doorY = by + bh;
    stamp(cells, doorX, doorY, doorX + doorW, doorY + doorH, CELL.HOME);
    var pathW = 6;
    var pathX = homeLot.cx - pathW / 2;
    var pathY0 = doorY + doorH;
    var pathY1 = homeLot.y1;
    stamp(cells, pathX, pathY0, pathX + pathW, pathY1, CELL.HOME);
    return {
      building: { x: bx, y: by, w: bw, h: bh },
      stoop: { x: doorX + doorW / 2, y: doorY + doorH / 2 },
      path: { x0: pathX, y0: pathY0, x1: pathX + pathW, y1: pathY1 },
    };
  }

  function edgeTouchesSidewalk(cells, x, y) {
    return (
      get(cells, x - 1, y) === CELL.SIDEWALK ||
      get(cells, x + 1, y) === CELL.SIDEWALK ||
      get(cells, x, y - 1) === CELL.SIDEWALK ||
      get(cells, x, y + 1) === CELL.SIDEWALK
    );
  }

  function placeGrass(cells, lots, rng, home) {
    var patches = [];
    var homeLot = lots.filter(function (l) {
      return l.isHome;
    })[0];
    for (var i = 0; i < lots.length; i++) {
      var lot = lots[i];
      var rim = 7;
      var edges = [
        { x0: lot.x0, y0: lot.y0, x1: lot.x0 + rim, y1: lot.y1 },
        { x0: lot.x1 - rim, y0: lot.y0, x1: lot.x1, y1: lot.y1 },
        { x0: lot.x0, y0: lot.y0, x1: lot.x1, y1: lot.y0 + rim },
        { x0: lot.x0, y0: lot.y1 - rim, x1: lot.x1, y1: lot.y1 },
      ];
      for (var e = 0; e < edges.length; e++) {
        var edge = edges[e];
        var tries = lot.isHome ? 4 : 1 + Math.floor(lot.density * 2);
        for (var t = 0; t < tries; t++) {
          var gw = rng.int(10, 16);
          var gh = rng.int(6, 9);
          var gx = rng.float(edge.x0, Math.max(edge.x0, edge.x1 - gw));
          var gy = rng.float(edge.y0, Math.max(edge.y0, edge.y1 - gh));
          if (lot.isHome && gx < home.path.x1 && gx + gw > home.path.x0 && gy + gh > home.path.y0) {
            continue;
          }
          var overlapsBuilding = rectHitsKind(cells, gx, gy, gx + gw, gy + gh, CELL.BUILDING);
          var overlapsHome = rectHitsKind(cells, gx, gy, gx + gw, gy + gh, CELL.HOME);
          if (overlapsBuilding || overlapsHome) continue;
          var cx = Math.floor(gx + gw / 2);
          var cy = Math.floor(gy + gh / 2);
          if (!edgeTouchesSidewalk(cells, Math.floor(gx), cy) && !edgeTouchesSidewalk(cells, cx, Math.floor(gy))) {
            if (!edgeTouchesSidewalk(cells, Math.floor(gx + gw - 1), cy)) continue;
          }
          stamp(cells, gx, gy, gx + gw, gy + gh, CELL.GRASS);
          patches.push({
            x: gx,
            y: gy,
            w: gw,
            h: gh,
            cx: gx + gw / 2,
            cy: gy + gh / 2,
            homeLot: lot.isHome,
            dist: Math.hypot(gx + gw / 2 - W / 2, gy + gh / 2 - H / 2),
          });
        }
      }
    }

    var tutorial = null;
    var homePatches = patches.filter(function (p) {
      return p.homeLot;
    });
    if (homePatches.length) {
      tutorial = homePatches[0];
      for (var p = 1; p < homePatches.length; p++) {
        if (homePatches[p].dist < tutorial.dist) tutorial = homePatches[p];
      }
    } else if (patches.length) {
      tutorial = patches[0];
      for (var q = 1; q < patches.length; q++) {
        if (patches[q].dist < tutorial.dist) tutorial = patches[q];
      }
    }
    if (!tutorial) {
      var gx = homeLot.x0 + 1;
      var gw = 8;
      var gh = 10;
      var gy = home.stoop.y - gh / 2;
      if (gy < homeLot.y0 + 1) gy = homeLot.y0 + 1;
      if (gy + gh > homeLot.y1 - 1) gy = homeLot.y1 - gh - 1;
      if (gx + gw < home.path.x0) {
        stamp(cells, gx, gy, gx + gw, gy + gh, CELL.GRASS);
        tutorial = {
          x: gx,
          y: gy,
          w: gw,
          h: gh,
          cx: gx + gw / 2,
          cy: gy + gh / 2,
          homeLot: true,
          dist: Math.hypot(gx + gw / 2 - W / 2, gy + gh / 2 - H / 2),
        };
        patches.push(tutorial);
      }
    }
    if (tutorial) tutorial.tutorial = true;
    return { patches: patches, tutorial: tutorial };
  }

  function collectSamples(cells) {
    var sidewalk = [];
    var street = [];
    var grass = [];
    var crosswalk = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var k = cells[idx(x, y)];
        var sample = { x: x + 0.5, y: y + 0.5, density: densityAt(x, y) };
        if (k === CELL.SIDEWALK) sidewalk.push(sample);
        else if (k === CELL.STREET) street.push(sample);
        else if (k === CELL.GRASS) grass.push(sample);
        else if (k === CELL.CROSSWALK) crosswalk.push(sample);
      }
    }
    return { sidewalk: sidewalk, street: street, grass: grass, crosswalk: crosswalk };
  }

  function pickFrom(samples, rng, count) {
    var out = [];
    if (!samples.length || count <= 0) return out;
    for (var i = 0; i < count; i++) {
      var s = rng.pick(samples);
      out.push({ x: s.x, y: s.y, density: s.density });
    }
    return out;
  }

  function pickBusyQuiet(samples, rng, total, nearShare) {
    var near = [];
    var far = [];
    for (var i = 0; i < samples.length; i++) {
      if (samples[i].density >= 0.45) near.push(samples[i]);
      else far.push(samples[i]);
    }
    if (!near.length) near = samples;
    var nNear = Math.max(1, Math.round(total * nearShare));
    var nFar = Math.max(0, total - nNear);
    if (!far.length) nFar = 0;
    return pickFrom(near, rng, nNear).concat(pickFrom(far, rng, nFar));
  }

  function carLanes(vStreets, hStreets, x0, x1, y0, y1) {
    var lanes = [];
    for (var i = 0; i < vStreets.length; i++) {
      lanes.push({
        axis: "y",
        x: vStreets[i].asphaltCenter,
        y0: y0,
        y1: y1,
        x0: vStreets[i].asphalt0,
        x1: vStreets[i].asphalt1,
      });
    }
    for (var j = 0; j < hStreets.length; j++) {
      lanes.push({
        axis: "x",
        y: hStreets[j].asphaltCenter,
        x0: x0,
        x1: x1,
        y0: hStreets[j].asphalt0,
        y1: hStreets[j].asphalt1,
      });
    }
    return lanes;
  }

  function floodWalkable(cells, sx, sy) {
    var seen = new Uint8Array(W * H);
    var stack = [[sx | 0, sy | 0]];
    var reached = { grass: false, crosswalk: false, sidewalk: false, farGrass: false };
    var n = 0;
    while (stack.length) {
      var p = stack.pop();
      var x = p[0];
      var y = p[1];
      if (!inBounds(x, y)) continue;
      var i = idx(x, y);
      if (seen[i]) continue;
      if (!isWalkableKind(cells[i])) continue;
      seen[i] = 1;
      n++;
      if (cells[i] === CELL.GRASS) {
        reached.grass = true;
        if (densityAt(x, y) < 0.45) reached.farGrass = true;
      }
      if (cells[i] === CELL.CROSSWALK) reached.crosswalk = true;
      if (cells[i] === CELL.SIDEWALK) reached.sidewalk = true;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    reached.tiles = n;
    return reached;
  }

  function generateNeighborhood(seed) {
    var rng = new root.GoMomoRng.Rng(seed);
    var cells = new Uint8Array(W * H);
    var xLayout = evenBands(W, MARGIN, N_STREETS_X, CORRIDOR);
    var yLayout = evenBands(H, MARGIN, N_STREETS_Y, CORRIDOR);
    var vStreets = xLayout.streets.map(decorateStreetX);
    var hStreets = yLayout.streets.map(decorateStreetY);
    var innerX0 = MARGIN;
    var innerX1 = W - MARGIN;
    var innerY0 = MARGIN;
    var innerY1 = H - MARGIN;

    paintVerticalStreets(cells, vStreets, innerY0, innerY1);
    paintHorizontalStreets(cells, hStreets, innerX0, innerX1);

    var lots = buildLots(xLayout, yLayout);
    var homeLot = lots.filter(function (l) {
      return l.isHome;
    })[0];
    var home = placeHome(cells, homeLot);
    var buildings = placeBuildings(cells, lots, rng);
    var grass = placeGrass(cells, lots, rng, home);
    var samples = collectSamples(cells);

    var peopleN = 5 + rng.int(0, 3);
    var dogsN = 2 + rng.int(0, 2);
    var mailN = 4 + rng.int(0, 3);
    var calmX = grass.tutorial ? grass.tutorial.cx : W / 2;
    var calmY = grass.tutorial ? grass.tutorial.cy : H / 2;
    function awayFromTutorial(list) {
      return list.filter(function (s) {
        return Math.hypot(s.x - calmX, s.y - calmY) > 20;
      });
    }
    var sidewalkAway = awayFromTutorial(samples.sidewalk);
    var people = pickBusyQuiet(sidewalkAway, rng, peopleN, 0.78);
    var dogs = pickBusyQuiet(sidewalkAway, rng, dogsN, 0.82);
    var peemail = pickBusyQuiet(sidewalkAway, rng, mailN, 0.75);

    var lanes = carLanes(vStreets, hStreets, innerX0, innerX1, innerY0, innerY1);
    var cars = [];
    var carCount = Math.min(lanes.length, 4);
    for (var c = 0; c < carCount; c++) {
      var lane = lanes[c];
      var along = rng.next();
      var car;
      if (lane.axis === "y") {
        car = {
          x: lane.x,
          y: lane.y0 + along * (lane.y1 - lane.y0),
          axis: "y",
          dir: rng.chance(0.5) ? 1 : -1,
          lane: c,
        };
      } else {
        car = {
          x: lane.x0 + along * (lane.x1 - lane.x0),
          y: lane.y,
          axis: "x",
          dir: rng.chance(0.5) ? 1 : -1,
          lane: c,
        };
      }
      cars.push(car);
    }

    var reach = floodWalkable(cells, home.stoop.x, home.stoop.y);

    return {
      w: W,
      h: H,
      seed: rng.seed,
      cells: cells,
      vStreets: vStreets,
      hStreets: hStreets,
      lots: lots,
      homeLot: homeLot,
      home: home,
      buildings: buildings,
      grass: grass.patches,
      tutorialGrass: grass.tutorial,
      samples: samples,
      spawns: { people: people, dogs: dogs, peemail: peemail, cars: cars },
      lanes: lanes,
      reach: reach,
      inner: { x0: innerX0, x1: innerX1, y0: innerY0, y1: innerY1 },
    };
  }

  function sidewalksBothSides(map) {
    for (var i = 0; i < map.vStreets.length; i++) {
      var s = map.vStreets[i];
      if (s.walkL1 - s.walkL0 < SIDEWALK_W - 0.01) return false;
      if (s.walkR1 - s.walkR0 < SIDEWALK_W - 0.01) return false;
    }
    for (var j = 0; j < map.hStreets.length; j++) {
      var h = map.hStreets[j];
      if (h.walkT1 - h.walkT0 < SIDEWALK_W - 0.01) return false;
      if (h.walkB1 - h.walkB0 < SIDEWALK_W - 0.01) return false;
    }
    return true;
  }

  function homeContainsCenter(map) {
    var lot = map.homeLot;
    return lot.x0 <= W / 2 && W / 2 < lot.x1 && lot.y0 <= H / 2 && H / 2 < lot.y1;
  }

  var api = {
    W: W,
    H: H,
    CELL: CELL,
    generateNeighborhood: generateNeighborhood,
    get: get,
    isWalkableAt: isWalkableAt,
    isWalkableKind: isWalkableKind,
    densityAt: densityAt,
    sidewalksBothSides: sidewalksBothSides,
    homeContainsCenter: homeContainsCenter,
    idx: idx,
  };

  root.GoMomoMap = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
