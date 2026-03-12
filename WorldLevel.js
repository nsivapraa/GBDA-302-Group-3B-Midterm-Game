// WorldLevel.js
class WorldLevel {
  constructor(levelJson) {
    // --- NEW: grid + tile size ---
    this.tileSize = levelJson.tileSize ?? 64;
    this.maze = levelJson.maze ?? []; // 2D array of numbers

    // Compute world size from grid
    const rows = this.maze.length;
    const cols = rows > 0 ? this.maze[0].length : 0;
    this.w = cols * this.tileSize;
    this.h = rows * this.tileSize;

    // Theme / camera as before
    this.theme = Object.assign(
      { bg: "#F0F0F0", blob: "#1478FF" },
      levelJson.theme ?? {},
    );
    this.camLerp = levelJson.camera?.lerp ?? 0.12;

    // --- Start position ---
    // If grid has a '2', use that; else fallback to provided start
    const startCell = this.findFirstCellWithValue(2);
    this.start = startCell
      ? {
          x: startCell.x * this.tileSize + this.tileSize / 2,
          y: startCell.y * this.tileSize + this.tileSize / 2,
          r: levelJson.start?.r ?? 26,
        }
      : Object.assign({ x: 120, y: 120, r: 26 }, levelJson.start ?? {});

    // --- Door ---
    // If grid has a '3', use that; else fallback
    const doorCell = this.findFirstCellWithValue(3);
    if (doorCell) {
      this.door = {
        x: doorCell.x * this.tileSize + this.tileSize * 0.2,
        y: doorCell.y * this.tileSize + this.tileSize * 0.1,
        w: this.tileSize * 0.6,
        h: this.tileSize * 0.8,
      };
    } else {
      const d = levelJson.door ?? {
        x: this.w - 120,
        y: this.h - 180,
        w: 48,
        h: 90,
      };
      this.door = { x: d.x, y: d.y, w: d.w ?? 48, h: d.h ?? 90 };
    }

    // --- Keys & hearts from grid indices (optional) ---
    // If keys/hearts are provided as grid coords (x,y in tiles), convert:
    this.keys = (levelJson.keys ?? []).map((k) => ({
      x:
        Number.isInteger(k.x) && Number.isInteger(k.y)
          ? k.x * this.tileSize + this.tileSize / 2
          : k.x,
      y:
        Number.isInteger(k.x) && Number.isInteger(k.y)
          ? k.y * this.tileSize + this.tileSize / 2
          : k.y,
      r: k.r ?? 12,
      collected: false,
    }));

    // Read per-level heart timing (with safe fallbacks)
    this.heartsCfg = {
      respawnMs: levelJson.heartsCfg?.respawnMs ?? 6000,
      graceMs: levelJson.heartsCfg?.graceMs ?? 200,
    };

    // Build hearts with timer fields
    this.hearts = (levelJson.hearts ?? []).map((h) => {
      // If you defined hearts in grid (tile) coords, your existing conversion stays.
      return {
        x:
          Number.isInteger(h.x) && Number.isInteger(h.y)
            ? h.x * this.tileSize + this.tileSize / 2
            : h.x,
        y:
          Number.isInteger(h.x) && Number.isInteger(h.y)
            ? h.y * this.tileSize + this.tileSize / 2
            : h.y,
        r: h.r ?? 12,
        collected: false,
        respawnAt: 0,
        recentlyAvailableUntil: 0,
      };
    });

    // Energy config same as before
    this.energyCfg = Object.assign(
      {
        max: 100,
        lowThreshold: 35,
        dipMin: 12,
        dipMax: 26,
        dipEveryMinMs: 2200,
        dipEveryMaxMs: 5200,
        heartGain: 18,
        slowMultiplier: 0.55,
      },
      levelJson.energy ?? {},
    );
  }

  updateTimers() {
    const now = millis();
    for (const h of this.hearts) {
      if (h.collected && h.respawnAt > 0 && now >= h.respawnAt) {
        // Make it live again
        h.collected = false;
        h.respawnAt = 0;
        h.recentlyAvailableUntil = now + this.heartsCfg.graceMs;
      }
    }
  }

  findFirstCellWithValue(val) {
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[0].length; x++) {
        if (this.maze[y][x] === val) return { x, y };
      }
    }
    return null;
  }

  isWallCell(cx, cy) {
    // cx, cy are integer cell indices
    if (cy < 0 || cy >= this.maze.length) return true;
    if (cx < 0 || cx >= this.maze[0].length) return true;
    return this.maze[cy][cx] === 1;
  }

  drawWorld() {
    this.drawBackground();
    this.drawMaze(); // NEW: walls/floors from grid
    this.drawDoor();
    this.drawKeys();
    this.drawHearts();
  }

  drawBackground() {
    background(this.theme.bg);
  }

  drawMaze() {
    const ts = this.tileSize;
    imageMode(CORNER);
    for (let r = 0; r < this.maze.length; r++) {
      for (let c = 0; c < this.maze[0].length; c++) {
        const v = this.maze[r][c];
        const img = v === 1 ? stoneImg : grassImg;
        image(img, c * ts, r * ts, ts, ts);
      }
    }
  }

  drawKeys() {
    push();
    imageMode(CENTER);
    const scale = 3;
    for (const k of this.keys) {
      if (k.collected) continue;
      const floatOffset = sin(frameCount * 0.04 + k.x) * 2;

      push();
      drawingContext.shadowBlur = 25;
      drawingContext.shadowColor = "rgba(255, 215, 0, 0.8)";
      image(keyImg, k.x, k.y + floatOffset, k.r * scale, k.r * scale);
      pop();
    }
    pop();
  }

  drawHearts() {
    push();
    imageMode(CENTER);
    for (const h of this.hearts) {
      if (h.collected) continue; // hidden while on cooldown
      const floatOffset = sin(frameCount * 0.05 + h.x) * 4;
      image(heartImg, h.x, h.y + floatOffset, h.r * 2.5, h.r * 2.5);
    }
    pop();
  }

  drawDoor() {
    push();
    rectMode(CORNER);
    noStroke();
    fill("#c60000");
    rect(this.door.x, this.door.y, this.door.w, this.door.h, 8);
    fill(200);
    ellipse(
      this.door.x + this.door.w * 0.75,
      this.door.y + this.door.h * 0.55,
      8,
      8,
    );
    pop();
  }
  // (keys/hearts/door draw methods unchanged)
}
