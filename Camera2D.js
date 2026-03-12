class Camera2D {
  constructor(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.x = 0;
    this.y = 0;
  }

  follow(targetX, targetY, lerpAmt) {
    const desiredX = targetX - this.viewW / 2;
    const desiredY = targetY - this.viewH / 2;
    this.x = lerp(this.x, desiredX, lerpAmt);
    this.y = lerp(this.y, desiredY, lerpAmt);
  }

  clampToWorld(worldW, worldH) {
    const maxX = max(0, worldW - this.viewW);
    const maxY = max(0, worldH - this.viewH);
    this.x = constrain(this.x, 0, maxX);
    this.y = constrain(this.y, 0, maxY);
  }

  begin() {
    push();
    translate(-this.x, -this.y);
  }
  end() {
    pop();
  }
}
