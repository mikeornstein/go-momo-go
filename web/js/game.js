// Arcade loop: leave home, sidewalks, crosswalks, pace on grass, home before clock.
(function (root) {
  "use strict";

  var Map = root.GoMomoMap;
  var CELL = Map.CELL;
  var W = Map.W;
  var H = Map.H;

  var BG = "#c9d63a";
  var INK = "#2a1c12";

  var WALK_SPEED = 52;
  var CAR_SPEED = 28;
  var NPC_SPEED = 16;
  var CLOCK = 60;
  var PACE_TIME = 2.35;
  var LEASH = 13;
  var INTERRUPT_R = 12;
  var CAR_SPOOK_R = 11;
  var STUN_TIME = 0.35;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function dist(a, b) {
    return hypot(a.x - b.x, a.y - b.y);
  }

  function formatClock(t) {
    var s = Math.max(0, Math.ceil(t));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function Game(seed) {
    this.debug =
      typeof location !== "undefined" && /[?&]debug=1/.test(location.search || "");
    this.reset(seed);
  }

  Game.prototype.reset = function (seed) {
    if (seed == null) seed = this.map ? this.map.seed : 20260914;
    this.map = Map.generateNeighborhood(seed);
    this.walker = {
      x: this.map.home.stoop.x,
      y: this.map.home.stoop.y,
      facingX: 0,
      facingY: 1,
    };
    this.momo = { x: this.walker.x, y: this.walker.y + 8 };
    this.cars = this.map.spawns.cars.map(function (c) {
      return {
        x: c.x,
        y: c.y,
        axis: c.axis,
        dir: c.dir,
        w: c.axis === "x" ? 10 : 6,
        h: c.axis === "x" ? 6 : 10,
        turnLock: 0,
      };
    });
    this.people = this.map.spawns.people.map(function (p) {
      return { x: p.x, y: p.y, dirX: 0, dirY: 0, kind: "person", timer: 0 };
    });
    this.dogs = this.map.spawns.dogs.map(function (p) {
      return { x: p.x, y: p.y, dirX: 0, dirY: 0, kind: "dog", timer: 0 };
    });
    this.peemail = this.map.spawns.peemail.map(function (p) {
      return { x: p.x, y: p.y };
    });
    this.clock = CLOCK;
    this.poop = 0;
    this.didPoop = false;
    this.hasLeftHome = false;
    this.state = "play";
    this.endCopy = "";
    this.message = "Get Momo to the grass.";
    this.messageT = 2.2;
    this.stun = 0;
    this.interruptFlash = 0;
    this.time = 0;
  };

  Game.prototype.cell = function (x, y) {
    return Map.get(this.map.cells, x, y);
  };

  Game.prototype.walkable = function (x, y) {
    return Map.isWalkableAt(this.map.cells, x, y);
  };

  Game.prototype.onHome = function () {
    return this.cell(this.walker.x, this.walker.y) === CELL.HOME;
  };

  Game.prototype.tryMove = function (ent, dx, dy) {
    var nx = ent.x + dx;
    var ny = ent.y + dy;
    if (this.walkable(nx, ny)) {
      ent.x = nx;
      ent.y = ny;
      return true;
    }
    if (dx !== 0 && this.walkable(ent.x + dx, ent.y)) {
      ent.x += dx;
      return true;
    }
    if (dy !== 0 && this.walkable(ent.x, ent.y + dy)) {
      ent.y += dy;
      return true;
    }
    return false;
  };

  Game.prototype.updateWalker = function (dt, axis) {
    if (this.stun > 0) {
      this.stun -= dt;
      return { moving: false };
    }
    var moving = axis.x !== 0 || axis.y !== 0;
    if (moving) {
      this.walker.facingX = axis.x;
      this.walker.facingY = axis.y;
      this.tryMove(this.walker, axis.x * WALK_SPEED * dt, axis.y * WALK_SPEED * dt);
      this.walker.x = clamp(this.walker.x, 1, W - 2);
      this.walker.y = clamp(this.walker.y, 1, H - 2);
    }
    return { moving: moving };
  };

  Game.prototype.updateMomo = function (dt) {
    var dx = this.walker.x - this.momo.x;
    var dy = this.walker.y - this.momo.y;
    var d = hypot(dx, dy);
    if (d > LEASH) {
      var pull = Math.min(1, (d - LEASH) * 0.18 + 0.35);
      this.tryMove(this.momo, (dx / d) * pull * WALK_SPEED * 1.15 * dt, (dy / d) * pull * WALK_SPEED * 1.15 * dt);
    } else if (d > 4) {
      this.tryMove(this.momo, dx * 2.2 * dt, dy * 2.2 * dt);
    }
    if (!this.walkable(this.momo.x, this.momo.y)) {
      this.momo.x = this.walker.x;
      this.momo.y = this.walker.y;
    }
  };

  Game.prototype.intersectionNear = function (x, y) {
    for (var i = 0; i < this.map.vStreets.length; i++) {
      for (var j = 0; j < this.map.hStreets.length; j++) {
        var ix = this.map.vStreets[i].asphaltCenter;
        var iy = this.map.hStreets[j].asphaltCenter;
        if (hypot(x - ix, y - iy) < 7) return { x: ix, y: iy };
      }
    }
    return null;
  };

  Game.prototype.snapCarToStreet = function (car) {
    var k = this.cell(car.x, car.y);
    if (k === CELL.STREET || k === CELL.CROSSWALK) return;
    var best = null;
    var bestD = 99;
    for (var i = 0; i < this.map.lanes.length; i++) {
      var lane = this.map.lanes[i];
      var d;
      if (lane.axis === "y") d = Math.abs(car.x - lane.x);
      else d = Math.abs(car.y - lane.y);
      if (d < bestD) {
        bestD = d;
        best = lane;
      }
    }
    if (!best) return;
    if (best.axis === "y") {
      car.x = best.x;
      car.axis = "y";
    } else {
      car.y = best.y;
      car.axis = "x";
    }
  };

  Game.prototype.updateCars = function (dt) {
    for (var i = 0; i < this.cars.length; i++) {
      var car = this.cars[i];
      car.turnLock = Math.max(0, car.turnLock - dt);
      var cross = this.intersectionNear(car.x, car.y);
      if (cross && car.turnLock <= 0 && Math.random() < 0.35) {
        if (car.axis === "x") {
          car.axis = "y";
          car.x = cross.x;
        } else {
          car.axis = "x";
          car.y = cross.y;
        }
        car.dir = Math.random() < 0.5 ? 1 : -1;
        car.turnLock = 1.1;
        car.w = car.axis === "x" ? 10 : 6;
        car.h = car.axis === "x" ? 6 : 10;
      }
      var speed = CAR_SPEED * dt * car.dir;
      if (car.axis === "x") car.x += speed;
      else car.y += speed;

      var inner = this.map.inner;
      if (car.x < inner.x0 + 4) {
        car.x = inner.x0 + 4;
        car.dir = 1;
      }
      if (car.x > inner.x1 - 4) {
        car.x = inner.x1 - 4;
        car.dir = -1;
      }
      if (car.y < inner.y0 + 4) {
        car.y = inner.y0 + 4;
        car.dir = 1;
      }
      if (car.y > inner.y1 - 4) {
        car.y = inner.y1 - 4;
        car.dir = -1;
      }
      this.snapCarToStreet(car);

      if (this.cell(this.walker.x, this.walker.y) === CELL.CROSSWALK) {
        var hit =
          Math.abs(this.walker.x - car.x) < car.w * 0.55 + 3 && Math.abs(this.walker.y - car.y) < car.h * 0.55 + 3;
        if (hit) {
          var bx = this.walker.x - car.x;
          var by = this.walker.y - car.y;
          var bd = hypot(bx, by) || 1;
          this.tryMove(this.walker, (bx / bd) * 10, (by / bd) * 10);
          this.stun = STUN_TIME;
          this.say("Watch the cars!", 1.2);
        }
      }
    }
  };

  Game.prototype.sidewalkStep = function (npc, dt, speed) {
    npc.timer -= dt;
    if (npc.timer <= 0 || !this.canNpcStand(npc.x + npc.dirX, npc.y + npc.dirY)) {
      var dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      var options = [];
      for (var i = 0; i < dirs.length; i++) {
        var nx = npc.x + dirs[i][0] * 3;
        var ny = npc.y + dirs[i][1] * 3;
        if (this.canNpcStand(nx, ny)) options.push(dirs[i]);
      }
      if (options.length) {
        var pick = options[(Math.random() * options.length) | 0];
        npc.dirX = pick[0];
        npc.dirY = pick[1];
      } else {
        npc.dirX = 0;
        npc.dirY = 0;
      }
      npc.timer = 0.6 + Math.random() * 1.4;
    }
    npc.x += npc.dirX * speed * dt;
    npc.y += npc.dirY * speed * dt;
    if (!this.canNpcStand(npc.x, npc.y)) {
      npc.x -= npc.dirX * speed * dt;
      npc.y -= npc.dirY * speed * dt;
      npc.timer = 0;
    }
  };

  Game.prototype.canNpcStand = function (x, y) {
    var k = this.cell(x, y);
    return k === CELL.SIDEWALK || k === CELL.CROSSWALK;
  };

  Game.prototype.updateCrowd = function (dt) {
    for (var i = 0; i < this.people.length; i++) this.sidewalkStep(this.people[i], dt, NPC_SPEED);
    for (var j = 0; j < this.dogs.length; j++) this.sidewalkStep(this.dogs[j], dt, NPC_SPEED * 1.15);
  };

  Game.prototype.say = function (text, t) {
    this.message = text;
    this.messageT = t == null ? 1.6 : t;
  };

  Game.prototype.interruptNear = function () {
    var m = this.momo;
    for (var i = 0; i < this.people.length; i++) {
      if (dist(m, this.people[i]) < INTERRUPT_R) return "person";
    }
    for (var j = 0; j < this.dogs.length; j++) {
      if (dist(m, this.dogs[j]) < INTERRUPT_R) return "dog";
    }
    for (var k = 0; k < this.peemail.length; k++) {
      if (dist(m, this.peemail[k]) < INTERRUPT_R - 2) return "pee-mail";
    }
    for (var c = 0; c < this.cars.length; c++) {
      if (dist(m, this.cars[c]) < CAR_SPOOK_R) return "car";
    }
    return null;
  };

  Game.prototype.updatePace = function (dt, moving) {
    if (this.didPoop) return;
    var onGrass = this.cell(this.momo.x, this.momo.y) === CELL.GRASS;
    if (!onGrass) {
      if (this.poop > 0 && this.poop < 1) this.poop = Math.max(0, this.poop - dt * 0.15);
      return;
    }
    if (moving) {
      this.say("Stand still to pace.", 0.8);
      return;
    }
    var spook = this.interruptNear();
    if (spook) {
      if (this.poop > 0) {
        this.poop = 0;
        this.interruptFlash = 0.45;
        this.say("Interrupted — " + spook + ".", 1.4);
      } else {
        this.say("Too busy. Find calmer grass.", 0.9);
      }
      return;
    }
    this.poop = Math.min(1, this.poop + dt / PACE_TIME);
    this.say("Pacing…", 0.4);
    if (this.poop >= 1) {
      this.didPoop = true;
      this.poop = 1;
      this.say("Good dump. Get home.", 2.4);
    }
  };

  Game.prototype.updateOutcome = function () {
    if (this.state !== "play") return;
    var kind = this.cell(this.walker.x, this.walker.y);
    if (!this.hasLeftHome && kind !== CELL.HOME) this.hasLeftHome = true;

    if (this.clock <= 0) {
      this.state = "lost";
      this.endCopy = "He can hold it. You cannot.";
      return;
    }
    if (this.hasLeftHome && kind === CELL.HOME) {
      if (this.didPoop) {
        this.state = "won";
        this.endCopy = "Good boy.";
      } else {
        this.state = "lost";
        this.endCopy = "You left it.";
      }
    }
  };

  Game.prototype.update = function (dt, input) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;
    if (this.interruptFlash > 0) this.interruptFlash -= dt;

    if (this.state !== "play") {
      if (input.consumeRestart()) this.reset(this.map.seed);
      if (input.consumeNewBlock()) this.reset((this.map.seed + 1) >>> 0);
      return;
    }

    if (input.consumeRestart()) {
      this.reset(this.map.seed);
      return;
    }
    if (input.consumeNewBlock()) {
      this.reset((this.map.seed + 1) >>> 0);
      return;
    }

    var axis = input.axis();
    var walk = this.updateWalker(dt, axis);
    this.updateMomo(dt);
    this.updateCars(dt);
    this.updateCrowd(dt);
    this.updatePace(dt, walk.moving);
    this.clock -= dt;
    this.updateOutcome();
  };

  Game.prototype.ink = function (ctx) {
    ctx.fillStyle = INK;
    ctx.strokeStyle = INK;
  };

  Game.prototype.patterns = function (ctx) {
    if (this._pats) return this._pats;
    function pat(dots) {
      var c = document.createElement("canvas");
      c.width = 4;
      c.height = 4;
      var g = c.getContext("2d");
      g.fillStyle = BG;
      g.fillRect(0, 0, 4, 4);
      g.fillStyle = INK;
      for (var i = 0; i < dots.length; i++) g.fillRect(dots[i][0], dots[i][1], 1, 1);
      return ctx.createPattern(c, "repeat");
    }
    this._pats = {
      street: pat([
        [0, 0],
        [2, 1],
        [1, 2],
        [3, 3],
      ]),
      walk: pat([
        [0, 0],
        [2, 2],
      ]),
      grass: pat([
        [0, 0],
        [2, 1],
        [1, 3],
        [3, 2],
        [0, 2],
      ]),
      home: pat([
        [0, 0],
        [2, 1],
        [1, 2],
      ]),
    };
    return this._pats;
  };

  Game.prototype.drawYardDither = function (ctx) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  };

  Game.prototype.drawCells = function (ctx) {
    var pats = this.patterns(ctx);
    var i;
    var inner = this.map.inner;
    ctx.fillStyle = pats.walk;
    for (i = 0; i < this.map.vStreets.length; i++) {
      var vs = this.map.vStreets[i];
      ctx.fillRect(vs.walkL0, inner.y0, vs.walkL1 - vs.walkL0, inner.y1 - inner.y0);
      ctx.fillRect(vs.walkR0, inner.y0, vs.walkR1 - vs.walkR0, inner.y1 - inner.y0);
    }
    for (i = 0; i < this.map.hStreets.length; i++) {
      var hs = this.map.hStreets[i];
      ctx.fillRect(inner.x0, hs.walkT0, inner.x1 - inner.x0, hs.walkT1 - hs.walkT0);
      ctx.fillRect(inner.x0, hs.walkB0, inner.x1 - inner.x0, hs.walkB1 - hs.walkB0);
    }

    ctx.fillStyle = pats.street;
    for (i = 0; i < this.map.vStreets.length; i++) {
      vs = this.map.vStreets[i];
      ctx.fillRect(vs.asphalt0, inner.y0, vs.asphalt1 - vs.asphalt0, inner.y1 - inner.y0);
    }
    for (i = 0; i < this.map.hStreets.length; i++) {
      hs = this.map.hStreets[i];
      ctx.fillRect(inner.x0, hs.asphalt0, inner.x1 - inner.x0, hs.asphalt1 - hs.asphalt0);
    }

    this.ink(ctx);
    for (i = 0; i < this.map.vStreets.length; i++) {
      vs = this.map.vStreets[i];
      for (var j = 0; j < this.map.hStreets.length; j++) {
        hs = this.map.hStreets[j];
        this.drawZebra(ctx, vs.walkL0, hs.asphalt0, vs.walkL1, hs.asphalt1, true);
        this.drawZebra(ctx, vs.walkR0, hs.asphalt0, vs.walkR1, hs.asphalt1, true);
        this.drawZebra(ctx, vs.asphalt0, hs.walkT0, vs.asphalt1, hs.walkT1, false);
        this.drawZebra(ctx, vs.asphalt0, hs.walkB0, vs.asphalt1, hs.walkB1, false);
      }
    }

    ctx.fillStyle = pats.grass;
    for (i = 0; i < this.map.grass.length; i++) {
      var g = this.map.grass[i];
      ctx.fillRect(g.x, g.y, g.w, g.h);
    }

    ctx.fillStyle = pats.home;
    var path = this.map.home.path;
    ctx.fillRect(path.x0, path.y0, path.x1 - path.x0, path.y1 - path.y0);
    var stoop = this.map.home.stoop;
    ctx.fillRect(stoop.x - 3, stoop.y - 2, 6, 4);
  };

  Game.prototype.drawZebra = function (ctx, x0, y0, x1, y1, verticalWalk) {
    var x = Math.floor(x0);
    var y = Math.floor(y0);
    var w = Math.ceil(x1) - x;
    var h = Math.ceil(y1) - y;
    ctx.fillStyle = BG;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = INK;
    if (verticalWalk) {
      for (var yy = y; yy < y + h; yy++) {
        if (Math.floor((yy - y) / 3) % 2 === 0) ctx.fillRect(x, yy, w, 1);
      }
    } else {
      for (var xx = x; xx < x + w; xx++) {
        if (Math.floor((xx - x) / 3) % 2 === 0) ctx.fillRect(xx, y, 1, h);
      }
    }
  };

  Game.prototype.drawBuildings = function (ctx) {
    this.ink(ctx);
    var home = this.map.home.building;
    ctx.fillRect(home.x, home.y, home.w, home.h);
    ctx.fillStyle = BG;
    ctx.fillRect(home.x + 4, home.y + 5, 4, 4);
    ctx.fillRect(home.x + home.w - 8, home.y + 5, 4, 4);
    ctx.fillRect(home.x + home.w / 2 - 2, home.y + home.h - 6, 4, 6);
    this.ink(ctx);
    ctx.fillRect(home.x + home.w / 2 - 3, home.y - 5, 6, 5);

    for (var i = 0; i < this.map.buildings.length; i++) {
      var b = this.map.buildings[i];
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = BG;
      ctx.fillRect(b.x + 2, b.y + 3, 3, 3);
      if (b.w > 12) ctx.fillRect(b.x + b.w - 5, b.y + 3, 3, 3);
      this.ink(ctx);
      if (b.roof) ctx.fillRect(b.x + 1, b.y - 3, b.w - 2, 3);
    }
  };

  Game.prototype.drawActors = function (ctx) {
    this.ink(ctx);
    var i;
    for (i = 0; i < this.peemail.length; i++) {
      var m = this.peemail[i];
      ctx.fillRect(m.x - 1, m.y - 1, 3, 2);
    }
    for (i = 0; i < this.cars.length; i++) {
      var c = this.cars[i];
      ctx.fillRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
      ctx.fillStyle = BG;
      ctx.fillRect(c.x - 1, c.y - 1, 2, 2);
      this.ink(ctx);
    }
    for (i = 0; i < this.people.length; i++) {
      var p = this.people[i];
      ctx.fillRect(p.x - 2, p.y - 5, 4, 7);
    }
    for (i = 0; i < this.dogs.length; i++) {
      var d = this.dogs[i];
      ctx.fillRect(d.x - 3, d.y - 2, 6, 4);
      ctx.fillRect(d.x + 2, d.y - 3, 2, 2);
    }

    ctx.beginPath();
    ctx.moveTo(this.walker.x, this.walker.y - 4);
    ctx.lineTo(this.momo.x, this.momo.y - 1);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillRect(this.walker.x - 2, this.walker.y - 8, 5, 9);
    ctx.fillStyle = BG;
    ctx.fillRect(this.walker.x - 1, this.walker.y - 7, 2, 2);
    this.ink(ctx);

    var mx = this.momo.x;
    var my = this.momo.y;
    ctx.fillRect(mx - 3, my - 4, 7, 6);
    ctx.fillRect(mx - 4, my - 6, 3, 3);
    ctx.fillRect(mx + 2, my - 6, 3, 3);
    ctx.fillStyle = BG;
    ctx.fillRect(mx - 1, my - 2, 2, 2);
    this.ink(ctx);
    if (this.interruptFlash > 0) ctx.fillRect(mx - 5, my - 8, 2, 2);
  };

  Game.prototype.drawHud = function (ctx) {
    this.ink(ctx);
    ctx.fillRect(0, 0, W, 12);
    ctx.fillStyle = BG;
    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = "top";
    ctx.fillText(formatClock(this.clock), 4, 2);
    ctx.fillText(this.didPoop ? "POOP OK" : "POOP", 48, 2);
    var meterX = 84;
    ctx.fillRect(meterX, 3, 42, 6);
    ctx.fillStyle = INK;
    ctx.fillRect(meterX + 1, 4, 40, 4);
    ctx.fillStyle = BG;
    ctx.fillRect(meterX + 1, 4, Math.floor(40 * this.poop), 4);
    ctx.fillStyle = BG;
    var hint = this.messageT > 0 ? this.message : this.didPoop ? "Home before work." : "Sidewalks. Crosswalks. Grass.";
    ctx.fillText(hint, 132, 2);

    if (this.state !== "play") {
      ctx.fillStyle = BG;
      ctx.fillRect(70, 78, 260, 84);
      this.ink(ctx);
      ctx.fillRect(72, 80, 256, 80);
      ctx.fillStyle = BG;
      ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(this.endCopy, 84, 100);
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(this.state === "won" ? "Enter / A — same block" : "Enter / A — try this block", 84, 128);
      ctx.fillText("N — new neighborhood", 84, 142);
    }
  };

  Game.prototype.draw = function (ctx) {
    ctx.imageSmoothingEnabled = false;
    this.drawYardDither(ctx);
    this.drawCells(ctx);
    this.drawBuildings(ctx);
    this.drawActors(ctx);
    this.drawHud(ctx);
    if (this.debug) {
      ctx.fillStyle = "rgba(255,0,0,0.35)";
      if (this.map.tutorialGrass) {
        var g = this.map.tutorialGrass;
        ctx.fillRect(g.x, g.y, g.w, g.h);
      }
    }
  };

  root.GoMomoGame = { Game: Game, BG: BG, INK: INK, CLOCK: CLOCK };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.GoMomoGame;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
