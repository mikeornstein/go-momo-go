// House / fence / car stamps for the 20px cell grid.
// Procedural 1-bit-friendly greys by default. Drop sheets in web/assets/ to replace:
//   assets/house.png  — horizontal 40×40 frames (optional second row 40×60 for home)
//   assets/fence.png  — 20×20 (or a horizontal strip of 20×20 frames)
//   assets/car.png    — 16×10 frames (col 0 = east-west, col 1 = north-south)
(function (root) {
  "use strict";

  var BG = "#c9d63a";
  var INK = "#2a1c12";
  var WALL = "#8c7a42";
  var WALL2 = "#6e6234";
  var ROOF = "#3d2a16";
  var TRIM = "#4a381c";
  var PANE = "#c4d070";
  var CELL = 20;

  function Art() {
    this.sheets = { house: null, fence: null, car: null };
    this._load();
  }

  Art.prototype._load = function () {
    if (typeof Image === "undefined") return;
    var self = this;
    function grab(name) {
      var img = new Image();
      img.onload = function () {
        self.sheets[name] = img;
      };
      img.onerror = function () {
        /* missing sheet is the procedural path */
      };
      img.src = "assets/" + name + ".png";
    }
    grab("house");
    grab("fence");
    grab("car");
  };

  Art.prototype.drawHouse = function (ctx, b) {
    var sheet = this.sheets.house;
    if (sheet && sheet.width) {
      var frameW = 40;
      var frameH = b.home ? 60 : 40;
      if (sheet.height < frameH) frameH = sheet.height;
      var cols = Math.max(1, Math.floor(sheet.width / frameW));
      var col = (b.variant || 0) % cols;
      var rowY = 0;
      if (b.home && sheet.height >= 100) rowY = 40;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet, col * frameW, rowY, frameW, Math.min(frameH, sheet.height - rowY), b.x, b.y, b.w, b.h);
      return;
    }
    this.drawHouseProcedural(ctx, b);
  };

  Art.prototype.drawHouseProcedural = function (ctx, b) {
    var x = Math.floor(b.x);
    var y = Math.floor(b.y);
    var w = Math.floor(b.w);
    var h = Math.floor(b.h);
    var face = b.face || "s";
    var v = b.variant || 0;
    var roofH = b.home ? 10 : 8;

    ctx.fillStyle = WALL;
    ctx.fillRect(x, y + roofH - 2, w, h - (roofH - 2));

    var by;
    for (by = y + roofH; by < y + h - 1; by += 3) {
      ctx.fillStyle = Math.floor((by - y) / 3) % 2 === 0 ? WALL2 : WALL;
      ctx.fillRect(x + 1, by, w - 2, 2);
    }

    ctx.fillStyle = INK;
    ctx.fillRect(x, y + roofH - 2, w, 1);
    ctx.fillRect(x, y + roofH - 2, 1, h - (roofH - 2));
    ctx.fillRect(x + w - 1, y + roofH - 2, 1, h - (roofH - 2));
    ctx.fillRect(x, y + h - 1, w, 1);

    this.drawRoof(ctx, x, y, w, roofH, b.roof !== false);

    var doorW = 8;
    var doorH = b.home ? 14 : 10;
    var doorX = x + Math.floor(w / 2) - Math.floor(doorW / 2);
    var doorY = face === "n" ? y + roofH + 1 : y + h - doorH - 1;
    ctx.fillStyle = INK;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.fillStyle = BG;
    ctx.fillRect(doorX + 1, doorY + 1, doorW - 2, doorH - 2);
    ctx.fillStyle = INK;
    ctx.fillRect(doorX + doorW - 3, doorY + Math.floor(doorH / 2), 2, 2);

    this.drawWindows(ctx, x, y, w, h, roofH, face, v, b.home, doorY, doorH);

    if (b.home) {
      ctx.fillStyle = BG;
      ctx.fillRect(x + Math.floor(w / 2) - 3, y + h - 1, 6, 2);
    }
  };

  Art.prototype.drawRoof = function (ctx, x, y, w, roofH, peaked) {
    ctx.fillStyle = ROOF;
    if (peaked) {
      ctx.beginPath();
      ctx.moveTo(x - 2, y + roofH);
      ctx.lineTo(x + Math.floor(w / 2), y - 5);
      ctx.lineTo(x + w + 2, y + roofH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillRect(x - 1, y + 2, w + 2, roofH);
      ctx.fillStyle = INK;
      ctx.fillRect(x - 1, y + 2, w + 2, 1);
    }
    ctx.fillStyle = TRIM;
    ctx.fillRect(x + w - 8, y + 1, 4, roofH - 1);
    ctx.fillStyle = INK;
    ctx.fillRect(x + w - 8, y + 1, 4, 1);
    ctx.fillRect(x + w - 8, y + 1, 1, roofH - 2);
    ctx.fillRect(x + w - 5, y + 1, 1, roofH - 2);
  };

  Art.prototype.drawWindows = function (ctx, x, y, w, h, roofH, face, variant, home, doorY, doorH) {
    var wy = face === "n" ? y + h - 16 : y + roofH + (home ? 6 : 3);
    function pane(px, py, pw, ph) {
      ctx.fillStyle = INK;
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = PANE;
      ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
      ctx.fillStyle = INK;
      ctx.fillRect(px + Math.floor(pw / 2), py + 1, 1, ph - 2);
      ctx.fillRect(px + 1, py + Math.floor(ph / 2), pw - 2, 1);
    }
    if (variant === 1) {
      pane(x + 4, wy, 8, 8);
      pane(x + w - 12, wy, 8, 8);
      if (home) pane(x + Math.floor(w / 2) - 4, wy + 14, 8, 8);
    } else if (variant === 2) {
      pane(x + 5, wy, w - 10, 9);
      if (home) {
        pane(x + 4, wy + 14, 8, 8);
        pane(x + w - 12, wy + 14, 8, 8);
      }
    } else if (variant === 3) {
      pane(x + 3, wy, 7, 8);
      pane(x + w - 10, wy, 7, 8);
      ctx.fillStyle = INK;
      ctx.fillRect(x + 2, y + h - 12, 1, 11);
      ctx.fillRect(x + w - 3, y + h - 12, 1, 11);
    } else {
      pane(x + 4, wy, 8, 8);
      pane(x + w - 12, wy, 8, 8);
      if (home) pane(x + 4, wy + 16, 8, 8);
    }
    if (home && face === "s") {
      pane(x + w - 12, y + roofH + 22, 8, 8);
    }
  };

  Art.prototype.drawFence = function (ctx, x, y, size, n) {
    var sheet = this.sheets.fence;
    if (sheet && sheet.width) {
      var fw = 20;
      var cols = Math.max(1, Math.floor(sheet.width / fw));
      var col = ((n.E ? 1 : 0) + (n.S ? 2 : 0)) % cols;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet, col * fw, 0, Math.min(fw, sheet.width), Math.min(CELL, sheet.height), x, y, size, size);
      return;
    }
    this.drawFenceProcedural(ctx, x, y, size, n);
  };

  Art.prototype.drawFenceProcedural = function (ctx, x, y, size, n) {
    var east = n && n.E;
    var west = n && n.W;
    var north = n && n.N;
    var south = n && n.S;
    var runH = east || west || (!north && !south);
    var runV = north || south || (!east && !west);
    var i;
    ctx.fillStyle = INK;
    if (runH) {
      ctx.fillRect(x, y + 6, size, 2);
      ctx.fillRect(x, y + 13, size, 2);
      for (i = 0; i < size; i += 5) {
        ctx.fillRect(x + i + 1, y + 4, 2, size - 6);
      }
    }
    if (runV) {
      ctx.fillRect(x + 6, y, 2, size);
      ctx.fillRect(x + 13, y, 2, size);
      for (i = 0; i < size; i += 5) {
        ctx.fillRect(x + 4, y + i + 1, size - 6, 2);
      }
    }
    ctx.fillRect(x + 1, y + 4, 3, 3);
    ctx.fillRect(x + size - 4, y + 4, 3, 3);
    ctx.fillRect(x + 1, y + size - 7, 3, 3);
    ctx.fillRect(x + size - 4, y + size - 7, 3, 3);
  };

  Art.prototype.tryBlitCar = function (ctx, c, x, y) {
    var sheet = this.sheets.car;
    if (!sheet || !sheet.width) return false;
    var frameW = 16;
    var frameH = 10;
    var col = c.axis === "y" ? 1 : 0;
    if (sheet.width < frameW) return false;
    if (col * frameW >= sheet.width) col = 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      col * frameW,
      0,
      Math.min(frameW, sheet.width - col * frameW),
      Math.min(frameH, sheet.height),
      x,
      y,
      c.w,
      c.h
    );
    return true;
  };

  var api = {
    Art: Art,
    DIR: "assets/",
    SHEET_HOUSE: "assets/house.png",
    SHEET_FENCE: "assets/fence.png",
    SHEET_CAR: "assets/car.png",
    CELL: CELL,
  };

  root.GoMomoArt = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
