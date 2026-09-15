#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var jsDir = path.join(__dirname, "..", "js");
var context = {
  console: console,
  Uint8Array: Uint8Array,
  Math: Math,
  Number: Number,
  module: { exports: {} },
};
context.globalThis = context;

function load(name) {
  var src = fs.readFileSync(path.join(jsDir, name), "utf8");
  vm.runInContext(src, vm.createContext(context));
}

load("rng.js");
load("map.js");

var Map = context.GoMomoMap;
var CELL = Map.CELL;
var fails = 0;

function assert(cond, msg) {
  if (!cond) {
    fails++;
    console.error("FAIL " + msg);
  }
}

var seeds = [20260914, 1, 7, 42, 99, 1996, 404, 1001, 777, 12, 33, 64];

for (var s = 0; s < seeds.length; s++) {
  var map = Map.generateNeighborhood(seeds[s]);
  var tag = "seed " + map.seed;
  assert(map.worldW > Map.VIEW_W && map.worldH > Map.VIEW_H, tag + " world is larger than one 400x240 screen");
  assert(map.cell === Map.CELL_SIZE, tag + " uses square cells");
  assert(Map.homeContainsCenter(map), tag + " home lot contains world center");
  assert(Map.sidewalksBothSides(map), tag + " sidewalks both sides of every street");
  assert(map.vStreets.length === Map.N_BLOCKS_X + 1, tag + " has a street on every block column");
  assert(map.hStreets.length === Map.N_BLOCKS_Y + 1, tag + " has a street on every block row");
  assert(map.reach.tiles > 80, tag + " walkable flood from stoop (" + map.reach.tiles + ")");
  assert(map.reach.sidewalk, tag + " stoop reaches a sidewalk");
  assert(map.reach.crosswalk, tag + " stoop reaches a crosswalk");
  assert(map.reach.grass, tag + " stoop reaches grass");
  assert(map.reach.home, tag + " stoop is on home cells");
  assert(map.grass.length > 0, tag + " has grass patches");
  assert(!!map.tutorialGrass, tag + " has a near tutorial grass patch");

  var streetWalk = 0;
  var cross = 0;
  var fences = 0;
  var drives = 0;
  var houses = 0;
  for (var i = 0; i < map.cells.length; i++) {
    if (map.cells[i] === CELL.STREET && Map.isWalkableKind(map.cells[i])) streetWalk++;
    if (map.cells[i] === CELL.CROSSWALK) cross++;
    if (map.cells[i] === CELL.FENCE) fences++;
    if (map.cells[i] === CELL.DRIVEWAY) drives++;
    if (map.cells[i] === CELL.BUILDING) houses++;
  }
  assert(streetWalk === 0, tag + " street asphalt is not walkable");
  assert(cross > 20, tag + " has crosswalk cells (" + cross + ")");
  assert(fences > 40, tag + " has fence cells (" + fences + ")");
  assert(drives > 4, tag + " has driveway cells (" + drives + ")");
  assert(houses > 8, tag + " has house cells (" + houses + ")");

  for (var L = 0; L < map.lots.length; L++) {
    var lot = map.lots[L];
    var bw = Math.round((lot.x1 - lot.x0) / Map.CELL_SIZE);
    var bh = Math.round((lot.y1 - lot.y0) / Map.CELL_SIZE);
    assert(bw === Map.BLOCK_W && bh === Map.BLOCK_H, tag + " lot " + lot.col + "," + lot.row + " is 4x8 cells (got " + bw + "x" + bh + ")");
  }

  assert(Map.lotHasKind(map.cells, map.homeLot, CELL.BUILDING), tag + " home block has a house");
  assert(Map.lotHasKind(map.cells, map.homeLot, CELL.HOME), tag + " home block has a path/stoop");
  assert(Map.lotHasKind(map.cells, map.homeLot, CELL.GRASS), tag + " home block has lawn grass");
  assert(Map.lotHasKind(map.cells, map.homeLot, CELL.FENCE), tag + " home block has fence");

  var nearHouses = 0;
  var farHouses = 0;
  var nearLots = 0;
  var farLots = 0;
  var nearWithDrive = 0;
  for (L = 0; L < map.lots.length; L++) {
    lot = map.lots[L];
    if (lot.isHome) continue;
    var n = 0;
    for (var b = 0; b < map.buildings.length; b++) {
      var building = map.buildings[b];
      if (building.home) continue;
      var cx = building.x + building.w / 2;
      var cy = building.y + building.h / 2;
      if (cx >= lot.x0 && cx < lot.x1 && cy >= lot.y0 && cy < lot.y1) n++;
    }
    if (lot.density >= 0.45) {
      nearHouses += n;
      nearLots++;
      if (Map.lotHasKind(map.cells, lot, CELL.DRIVEWAY)) nearWithDrive++;
    } else {
      farHouses += n;
      farLots++;
    }
  }
  var nearAvg = nearLots ? nearHouses / nearLots : 0;
  var farAvg = farLots ? farHouses / farLots : 0;
  assert(nearAvg > farAvg, tag + " denser houses near center (" + nearAvg.toFixed(2) + " vs " + farAvg.toFixed(2) + ")");
  assert(nearWithDrive > 0, tag + " near lots include driveways");

  var nearNpc = 0;
  var farNpc = 0;
  function tally(list) {
    for (var n = 0; n < list.length; n++) {
      if (list[n].density >= 0.45) nearNpc++;
      else farNpc++;
    }
  }
  tally(map.spawns.people);
  tally(map.spawns.dogs);
  tally(map.spawns.peemail);
  assert(nearNpc > farNpc, tag + " busier sidewalks near center (" + nearNpc + " vs " + farNpc + ")");
}

console.log("ok — " + seeds.length + " seeds");

context.location = { search: "" };
load("game.js");
var Game = context.GoMomoGame.Game;
var walkGame = new Game(20260914);
assert(Map.get(walkGame.map, walkGame.walker.x, walkGame.walker.y) === CELL.HOME, "start on home stoop");
assert(walkGame.cam.x >= 0 && walkGame.cam.y >= 0, "camera starts on the map");
assert(
  walkGame.walker.x >= walkGame.cam.x &&
    walkGame.walker.x < walkGame.cam.x + Map.VIEW_W &&
    walkGame.walker.y >= walkGame.cam.y &&
    walkGame.walker.y < walkGame.cam.y + Map.VIEW_H,
  "home is on the opening camera screen"
);

var cam0x = walkGame.cam.x;
walkGame.walker.x = walkGame.cam.x + Map.VIEW_W + 1;
walkGame.snapCamera();
assert(walkGame.cam.x > cam0x, "walking past the right edge snaps the camera east (got " + cam0x + " -> " + walkGame.cam.x + ")");
assert(walkGame.cam.x - cam0x === Map.VIEW_W || walkGame.cam.x === walkGame.maxCam().x, "east snap is a full screen (or clamp)");

walkGame.reset(20260914);
var cam0y = walkGame.cam.y;
walkGame.walker.y = walkGame.cam.y + Map.VIEW_H + 1;
walkGame.snapCamera();
assert(walkGame.cam.y > cam0y, "walking past the bottom edge snaps the camera south (got " + cam0y + " -> " + walkGame.cam.y + ")");

walkGame.reset(20260914);
for (var step = 0; step < 220; step++) walkGame.tryMove(walkGame.walker, 0, 1);
var endKind = Map.get(walkGame.map, walkGame.walker.x, walkGame.walker.y);
assert(endKind !== CELL.STREET, "south walk never enters street asphalt (got " + endKind + ")");
assert(
  endKind === CELL.SIDEWALK || endKind === CELL.CROSSWALK || endKind === CELL.HOME || endKind === CELL.GRASS,
  "south walk stays on path/sidewalk (got " + endKind + ")"
);
for (step = 0; step < 80; step++) walkGame.tryMove(walkGame.walker, 1, 0);
endKind = Map.get(walkGame.map, walkGame.walker.x, walkGame.walker.y);
assert(endKind !== CELL.STREET, "east walk never enters street asphalt (got " + endKind + ")");
assert(
  endKind === CELL.SIDEWALK || endKind === CELL.CROSSWALK || endKind === CELL.GRASS || endKind === CELL.HOME,
  "east walk stays walkable (got " + endKind + ")"
);

if (fails) {
  console.error(fails + " assertion(s) failed");
  process.exit(1);
}
console.log("ok — walk probe + snap camera");
