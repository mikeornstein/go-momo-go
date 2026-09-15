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

var g = walkGame.map.tutorialGrass;
function clearCrowd(game) {
  game.people = [];
  game.dogs = [];
  game.peemail = [];
  game.cars = [];
}
function plantOnGrass(game) {
  game.reset(20260914);
  clearCrowd(game);
  game.momo.x = g.cx;
  game.momo.y = g.cy;
  game.walker.x = g.cx;
  game.walker.y = g.cy;
  game.poop = 0.6;
  game.didPoop = false;
}

plantOnGrass(walkGame);
walkGame.dogs = [{ x: g.cx + 20, y: g.cy, dirX: 0, dirY: 0, kind: "dog", timer: 1 }];
assert(walkGame.interruptNear() === "dog", "dog 20px away (adjacent sidewalk) is in interrupt range");
walkGame.updatePace(0.05, false);
assert(walkGame.poop === 0, "dog interrupt resets poop progress");
assert(/dog/i.test(walkGame.message), "dog interrupt names the dog in the HUD");
assert(walkGame.interruptFlash > 0, "dog interrupt flashes");

plantOnGrass(walkGame);
walkGame.cars = [{ x: g.cx + 50, y: g.cy, axis: "x", dir: 1, w: 16, h: 10, turnLock: 0 }];
assert(walkGame.interruptNear() === "car", "car ~50px away (street past sidewalk) is in interrupt range");
walkGame.updatePace(0.05, false);
assert(walkGame.poop === 0, "car interrupt resets poop progress");
assert(/car/i.test(walkGame.message), "car interrupt names the car in the HUD");
assert(walkGame.interruptFlash > 0, "car interrupt flashes");

plantOnGrass(walkGame);
walkGame.people = [{ x: g.cx + 20, y: g.cy, dirX: 0, dirY: 0, kind: "person", timer: 1 }];
assert(walkGame.interruptNear() === "person", "person on adjacent sidewalk still interrupts");
walkGame.updatePace(0.05, false);
assert(walkGame.poop === 0, "person interrupt still resets poop");

plantOnGrass(walkGame);
walkGame.peemail = [{ x: g.cx + 20, y: g.cy }];
assert(walkGame.interruptNear() === "pee-mail", "pee-mail on adjacent sidewalk still interrupts");
walkGame.updatePace(0.05, false);
assert(walkGame.poop === 0, "pee-mail interrupt still resets poop");

plantOnGrass(walkGame);
walkGame.dogs = [{ x: g.cx + 90, y: g.cy, dirX: 0, dirY: 0, kind: "dog", timer: 1 }];
assert(walkGame.interruptNear() === null, "dog 90px away does not interrupt");
walkGame.updatePace(0.05, false);
assert(walkGame.poop > 0.6, "calm grass still fills poop");

plantOnGrass(walkGame);
var nearest = null;
var nearestD = 1e9;
for (var li = 0; li < walkGame.map.lanes.length; li++) {
  var lane = walkGame.map.lanes[li];
  var laneD = lane.axis === "y" ? Math.abs(lane.x - g.cx) : Math.abs(lane.y - g.cy);
  if (laneD < nearestD) {
    nearestD = laneD;
    nearest = lane;
  }
}
assert(nearestD > 40 && nearestD < 90, "tutorial grass sits across a sidewalk from a street (got " + nearestD + ")");
var streetCar =
  nearest.axis === "y"
    ? { x: nearest.x, y: g.cy, axis: "y", dir: 1, w: 10, h: 16, turnLock: 99 }
    : { x: g.cx, y: nearest.y, axis: "x", dir: 1, w: 16, h: 10, turnLock: 99 };
walkGame.cars = [streetCar];
assert(walkGame.interruptNear() === "car", "car on the adjacent street interrupts tutorial grass (lane d=" + nearestD + ")");
walkGame.updatePace(0.05, false);
assert(walkGame.poop === 0, "adjacent-street car resets poop");

var m1 = Map.generateNeighborhood(20260914, 1);
var m3 = Map.generateNeighborhood(20260914, 3);
assert(m1.level === 1 && m3.level === 3, "maps store the requested level");
assert(m3.spawns.people.length > m1.spawns.people.length, "level 3 has more people (" + m1.spawns.people.length + " -> " + m3.spawns.people.length + ")");
assert(m3.spawns.dogs.length > m1.spawns.dogs.length, "level 3 has more dogs");
assert(m3.spawns.peemail.length > m1.spawns.peemail.length, "level 3 has more pee-mail");
assert(m3.spawns.cars.length > m1.spawns.cars.length, "level 3 has more cars");

var GameApi = context.GoMomoGame;
assert(GameApi.clockForLevel(1) === 75, "level 1 clock is 75s");
assert(GameApi.clockForLevel(2) === 67, "level 2 clock is 67s");
assert(GameApi.clockForLevel(2) < GameApi.clockForLevel(1), "clock shrinks each level");
assert(GameApi.clockForLevel(20) === GameApi.CLOCK_MIN, "clock floors at CLOCK_MIN");

function tallyActors(game) {
  return game.people.length + game.dogs.length + game.peemail.length + game.cars.length;
}
function fakeInput(restart, fresh) {
  return {
    consumeRestart: function () {
      var v = restart;
      restart = false;
      return v;
    },
    consumeNewBlock: function () {
      var v = fresh;
      fresh = false;
      return v;
    },
    axis: function () {
      return { x: 0, y: 0 };
    },
  };
}

var prog = new Game(20260914);
assert(prog.level === 1, "new game starts at level 1");
assert(prog.clock === GameApi.CLOCK, "level 1 uses the base clock");
assert(prog.interruptR === GameApi.INTERRUPT_R, "level 1 interrupt radius is the base");
var n1 = tallyActors(prog);
prog.state = "won";
prog.update(0.016, fakeInput(true, false));
assert(prog.level === 2, "A after a win advances to level 2");
assert(prog.clock === GameApi.clockForLevel(2), "level 2 clock is shorter");
assert(prog.clock < GameApi.CLOCK, "winning shortens the clock");
assert(tallyActors(prog) > n1, "level 2 has more distractions");
assert(prog.interruptR > GameApi.INTERRUPT_R, "level 2 adds interrupt pressure");

var winB = new Game(20260914);
winB.state = "won";
winB.update(0.016, fakeInput(false, true));
assert(winB.level === 2, "B after a win also advances the level");

var lostA = new Game(20260914);
lostA.advanceLevel();
lostA.advanceLevel();
assert(lostA.level === 3, "advanceLevel stacks");
lostA.state = "lost";
lostA.update(0.016, fakeInput(true, false));
assert(lostA.level === 1, "A after a loss returns to level 1");
assert(lostA.map.seed === 20260914, "A after a loss returns to the first neighborhood");
assert(lostA.clock === GameApi.CLOCK, "level 1 clock is restored after a loss");

var lostB = new Game(20260914);
lostB.advanceLevel();
lostB.state = "lost";
var lostSeed = lostB.map.seed;
lostB.update(0.016, fakeInput(false, true));
assert(lostB.level === 1, "B after a loss returns to level 1");
assert(lostB.map.seed === ((lostSeed + 1) >>> 0), "B after a loss starts a new level-1 neighborhood");
assert(lostB.originSeed === lostB.map.seed, "new level-1 run remembers the fresh origin seed");

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
assert(html.indexOf('class="crank"') === -1 && html.indexOf("crank") === -1, "HTML has no faux crank");
assert(css.indexOf(".crank") === -1, "CSS has no faux crank");
assert(html.indexOf("▲") === -1 && html.indexOf("▼") === -1, "d-pad markup has no selectable Unicode arrows");
assert(html.indexOf("▶") === -1 && html.indexOf("◀") === -1, "d-pad markup has no selectable Unicode chevrons");
assert(!/>A<\/button>/.test(html) && !/>B<\/button>/.test(html), "A/B labels are not button text nodes");
assert(css.indexOf('content: "A"') === -1 && css.indexOf("content: 'A'") === -1, "A is not CSS generated text");
assert(css.indexOf('content: "B"') === -1 && css.indexOf("content: 'B'") === -1, "B is not CSS generated text");
assert(css.indexOf("▲") === -1 && css.indexOf("▼") === -1, "CSS has no Unicode arrows");
assert(css.indexOf("align-items: center") !== -1 && css.indexOf("justify-content: center") !== -1, "A/B buttons flex-center their glyphs");

if (fails) {
  console.error(fails + " assertion(s) failed");
  process.exit(1);
}
console.log("ok — walk probe + snap camera + interrupts + chrome markup + levels");

