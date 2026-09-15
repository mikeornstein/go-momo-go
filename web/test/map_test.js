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
  assert(map.w === 400 && map.h === 240, tag + " is 400x240");
  assert(Map.homeContainsCenter(map), tag + " home lot contains screen center");
  assert(Map.sidewalksBothSides(map), tag + " sidewalks both sides of every street");
  assert(map.vStreets.length === 4, tag + " has 4 vertical streets");
  assert(map.hStreets.length === 2, tag + " has 2 horizontal streets");
  assert(map.reach.tiles > 200, tag + " walkable flood from stoop (" + map.reach.tiles + ")");
  assert(map.reach.sidewalk, tag + " stoop reaches a sidewalk");
  assert(map.reach.crosswalk, tag + " stoop reaches a crosswalk");
  assert(map.reach.grass, tag + " stoop reaches grass");
  assert(map.grass.length > 0, tag + " has grass patches");
  assert(!!map.tutorialGrass, tag + " has a near tutorial grass patch");

  var streetWalk = 0;
  var cross = 0;
  for (var i = 0; i < map.cells.length; i++) {
    if (map.cells[i] === CELL.STREET && Map.isWalkableKind(map.cells[i])) streetWalk++;
    if (map.cells[i] === CELL.CROSSWALK) cross++;
  }
  assert(streetWalk === 0, tag + " street asphalt is not walkable");
  assert(cross > 40, tag + " has crosswalk pixels (" + cross + ")");

  var nearHouses = 0;
  var farHouses = 0;
  var nearLots = 0;
  var farLots = 0;
  for (var L = 0; L < map.lots.length; L++) {
    var lot = map.lots[L];
    if (lot.isHome) continue;
    var n = 0;
    for (var b = 0; b < map.buildings.length; b++) {
      var building = map.buildings[b];
      var cx = building.x + building.w / 2;
      var cy = building.y + building.h / 2;
      if (cx >= lot.x0 && cx < lot.x1 && cy >= lot.y0 && cy < lot.y1) n++;
    }
    if (lot.density >= 0.45) {
      nearHouses += n;
      nearLots++;
    } else {
      farHouses += n;
      farLots++;
    }
  }
  var nearAvg = nearLots ? nearHouses / nearLots : 0;
  var farAvg = farLots ? farHouses / farLots : 0;
  assert(nearAvg > farAvg, tag + " denser houses near center (" + nearAvg.toFixed(2) + " vs " + farAvg.toFixed(2) + ")");

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
assert(Map.get(walkGame.map.cells, walkGame.walker.x, walkGame.walker.y) === CELL.HOME, "start on home stoop");
for (var step = 0; step < 220; step++) walkGame.tryMove(walkGame.walker, 0, 1);
var endKind = Map.get(walkGame.map.cells, walkGame.walker.x, walkGame.walker.y);
assert(endKind !== CELL.STREET, "south walk never enters street asphalt (got " + endKind + ")");
assert(endKind === CELL.SIDEWALK || endKind === CELL.CROSSWALK || endKind === CELL.HOME, "south walk stays on path/sidewalk (got " + endKind + ")");
for (step = 0; step < 80; step++) walkGame.tryMove(walkGame.walker, 1, 0);
endKind = Map.get(walkGame.map.cells, walkGame.walker.x, walkGame.walker.y);
assert(endKind !== CELL.STREET, "east walk never enters street asphalt (got " + endKind + ")");
assert(
  endKind === CELL.SIDEWALK || endKind === CELL.CROSSWALK || endKind === CELL.GRASS || endKind === CELL.HOME,
  "east walk stays walkable (got " + endKind + ")"
);

if (fails) {
  console.error(fails + " assertion(s) failed");
  process.exit(1);
}
console.log("ok — walk probe");
