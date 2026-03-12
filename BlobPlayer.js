class BlobPlayer {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.r = 26;

    this.accel = 0.7;
    this.maxSpeed = 4.0;
    this.friction = 0.86;

    this.vx = 0;
    this.vy = 0;

    this.t = 0;
    this.tSpeed = 0.01;
    this.wobble = 7;
    this.points = 48;
    this.wobbleFreq = 0.9;

    this.energy = 100;
    this.energyMax = 100;
    this.lowThreshold = 35;
    this.heartGain = 18;
    this.slowMultiplier = 0.55;

    this.dipMin = 12;
    this.dipMax = 26;
    this.dipEveryMinMs = 2200;
    this.dipEveryMaxMs = 5200;
    this.nextDipAt = 0;

    this.keysCollected = 0;
    this.keysNeeded = 3;
    this.levelComplete = false;
  }

  // -------------------------------
  // Spawn player from level
  // -------------------------------
  spawnFromLevel(level) {
    this.x = level.start.x;
    this.y = level.start.y;
    this.r = level.start.r;

    const e = level.energyCfg ?? {};
    this.energyMax = e.max ?? 100;
    this.energy = this.energyMax;
    this.lowThreshold = e.lowThreshold ?? 35;
    this.heartGain = e.heartGain ?? 18;
    this.slowMultiplier = e.slowMultiplier ?? 0.55;

    this.dipMin = e.dipMin ?? 12;
    this.dipMax = e.dipMax ?? 26;
    this.dipEveryMinMs = e.dipEveryMinMs ?? 2200;
    this.dipEveryMaxMs = e.dipEveryMaxMs ?? 5200;

    this.nextDipAt = millis() + random(this.dipEveryMinMs, this.dipEveryMaxMs);

    this.vx = 0;
    this.vy = 0;

    this.keysCollected = 0;
    // ✅ Make sure keysNeeded is never zero
    this.keysNeeded = Math.max(1, (level.keys ?? []).length);
    this.levelComplete = false;
  }

  isLowEnergy() {
    return this.energy <= this.lowThreshold;
  }

  // -------------------------------
  // Update player each frame
  // -------------------------------
  update(level) {
    if (!this.levelComplete && millis() >= this.nextDipAt) {
      this.energy -= random(this.dipMin, this.dipMax);
      this.energy = constrain(this.energy, 0, this.energyMax);
      this.nextDipAt =
        millis() + random(this.dipEveryMinMs, this.dipEveryMaxMs);
    }

    let mx = 0;
    let my = 0;
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) mx -= 1;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) mx += 1;
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) my -= 1;
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) my += 1;

    const slow = map(this.energy, 0, this.energyMax, this.slowMultiplier, 1);

    if (mx !== 0 || my !== 0) {
      const mag = sqrt(mx * mx + my * my);
      mx /= mag;
      my /= mag;
      this.vx += this.accel * mx * slow;
      this.vy += this.accel * my * slow;
    }

    this.vx *= this.friction;
    this.vy *= this.friction;

    const maxV = this.maxSpeed * slow;
    this.vx = constrain(this.vx, -maxV, maxV);
    this.vy = constrain(this.vy, -maxV, maxV);

    this.x += this.vx;
    this.y += this.vy;

    // NEW: resolve collisions with maze walls before any pickups/unlocks
    this.resolveCollisions(level);

    this.collectKeys(level);
    this.collectHearts(level);
    this.checkDoor(level);

    this.t += this.tSpeed;
  }

  // -------------------------------
  // Key collection
  // -------------------------------
  collectKeys(level) {
    for (const k of level.keys) {
      if (k.collected) continue;
      if (dist(this.x, this.y, k.x, k.y) <= this.r + k.r) {
        k.collected = true;
        this.keysCollected += 1;
        // ✅ Optional debug log
        console.log("Key collected", this.keysCollected, "/", this.keysNeeded);
      }
    }
  }

  collectHearts(level) {
    const now = millis();
    for (const h of level.hearts) {
      // If it's in cooldown, skip
      if (h.collected) continue;

      // Optional: if it just reappeared this frame and the blob is still overlapping,
      // give it a tiny grace period to require the player to move off and back on.
      if (now < h.recentlyAvailableUntil) continue;

      if (dist(this.x, this.y, h.x, h.y) <= this.r + h.r) {
        // Consume heart and start cooldown
        h.collected = true;
        h.respawnAt = now + level.heartsCfg.respawnMs;

        // Apply energy gain (existing logic)
        this.energy += this.heartGain;
        this.energy = constrain(this.energy, 0, this.energyMax);
      }
    }
  }
  // -------------------------------
  // Check if player reached the door
  // -------------------------------
  checkDoor(level) {
    if (this.keysCollected < this.keysNeeded) return;

    const d = level.door;
    const a = {
      x: this.x - this.r,
      y: this.y - this.r,
      w: this.r * 2,
      h: this.r * 2,
    };
    const b = { x: d.x, y: d.y, w: d.w, h: d.h };

    // ✅ Use the static overlap function
    if (BlobPlayer.overlap(a, b)) this.levelComplete = true;
  }

  // -------------------------------
  // Rectangle collision detection
  // -------------------------------
  static overlap(a, b) {
    return !(
      a.x + a.w < b.x ||
      a.x > b.x + b.w ||
      a.y + a.h < b.y ||
      a.y > b.y + b.h
    );
  }

  static clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // BlobPlayer.js
  resolveCollisions(level) {
    if (!level.maze || level.maze.length === 0) return;

    const ts = level.tileSize;
    // Player's bounding box in tile indices
    const minCx = Math.floor((this.x - this.r) / ts) - 1;
    const maxCx = Math.floor((this.x + this.r) / ts) + 1;
    const minCy = Math.floor((this.y - this.r) / ts) - 1;
    const maxCy = Math.floor((this.y + this.r) / ts) + 1;

    // Iterate a couple of times to stabilize in corners
    for (let iter = 0; iter < 2; iter++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          if (!level.isWallCell(cx, cy)) continue;

          const rectWorld = {
            x: cx * ts,
            y: cy * ts,
            w: ts,
            h: ts,
          };

          const res = BlobPlayer.resolveCircleRect(
            this.x,
            this.y,
            this.r,
            rectWorld,
          );
          if (res.overlap) {
            this.x += res.px;
            this.y += res.py;

            // Dampen velocity along the push axis to avoid jitter
            if (Math.abs(res.px) > Math.abs(res.py)) this.vx = 0;
            else if (Math.abs(res.py) > Math.abs(res.px)) this.vy = 0;
            else {
              this.vx = 0;
              this.vy = 0;
            }
          }
        }
      }
    }
  }

  // Returns {overlap:boolean, px:number, py:number} where (px,py)
  // is the minimum push-out vector to separate the circle from the rect.
  static resolveCircleRect(cx, cy, r, rect) {
    // Closest point on rect to circle center
    const closestX = BlobPlayer.clamp(cx, rect.x, rect.x + rect.w);
    const closestY = BlobPlayer.clamp(cy, rect.y, rect.y + rect.h);

    // Vector from closest point to circle center
    let dx = cx - closestX;
    let dy = cy - closestY;
    let distSq = dx * dx + dy * dy;

    // If center is inside rect, push along the smallest axis out to radius
    const inside =
      cx > rect.x &&
      cx < rect.x + rect.w &&
      cy > rect.y &&
      cy < rect.y + rect.h;

    if (inside) {
      const left = cx - rect.x;
      const right = rect.x + rect.w - cx;
      const top = cy - rect.y;
      const bottom = rect.y + rect.h - cy;

      const minAxis = Math.min(left, right, top, bottom);
      let px = 0,
        py = 0;
      if (minAxis === left) px = this.r - left;
      else if (minAxis === right) px = -(this.r - right);
      else if (minAxis === top) py = this.r - top;
      else py = -(this.r - bottom);
      return { overlap: true, px, py };
    }

    // Circle overlap test outside rect
    if (distSq > r * r) return { overlap: false, px: 0, py: 0 };

    const dist = Math.max(1e-6, Math.sqrt(distSq));
    const pen = r - dist;
    const nx = dx / dist,
      ny = dy / dist;
    return { overlap: true, px: nx * pen, py: ny * pen };
  }

  draw() {
    push();
    imageMode(CENTER);

    let size = this.r * 4;
    let facingRight = this.vx >= 0;
    let offsetY = 0;
    if (abs(this.vx) > 0.1 || abs(this.vy) > 0.1)
      offsetY = sin(frameCount * 0.1) * 3;

    translate(this.x, this.y + offsetY);
    if (!facingRight) scale(-1, 1);

    image(playerImg, 0, 0, size, size);
    pop();
  }
}
