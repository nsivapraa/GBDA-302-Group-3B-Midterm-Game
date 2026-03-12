// sketch.js

let grassImg, stoneImg, keyImg, heartImg, playerImg;
let pixelFont;

const VIEW_W = 800;
const VIEW_H = 480;

let currentScreen = "start";
let allLevelsData;
let levelIndex = 0;
let level;
let player;
let cam;

// Controls overlay
let showControls = false;

let helpBtn = { x: 0, y: 0, w: 36, h: 36 };
let closeBtn = { x: 0, y: 0, w: 120, h: 36 };

// --------------------
// Preload assets
// --------------------
function preload() {
  grassImg = loadImage("assets/tiles/grass.png");
  stoneImg = loadImage("assets/tiles/stone.png");
  keyImg = loadImage("assets/key.png");
  heartImg = loadImage("assets/heart.png");
  playerImg = loadImage("assets/player.png");
  pixelFont = loadFont("assets/fonts/PressStart2P-Regular.ttf");
  allLevelsData = loadJSON("levels.json");
}

// --------------------
// Setup canvas
// --------------------
function setup() {
  createCanvas(800, 480);
  textFont(pixelFont);
  textSize(15);

  cam = new Camera2D(width, height);
  loadLevel(levelIndex);
}

// --------------------
// Draw Start Screen
// --------------------
function drawStart() {
  background("#000000");
  textAlign(CENTER, BASELINE);

  fill(255);
  textSize(35);
  text("KEEP MOVING FORWARD", width / 2, 70);

  textSize(13.5);
  text("a game about managing energy and finding support", width / 2, 100);

  const boxW = min(640, width * 0.8);
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 125;

  fill(245);
  stroke(0, 200);
  rect(boxX, boxY, boxW, boxH, 20);
  noStroke();

  fill(0);
  textStyle(BOLD);
  textSize(33);
  text("GOAL", width / 2, boxY + 60);

  textSize(15);
  fill(30);
  text("Find 3 keys and unlock the door!", width / 2, boxY + 95);

  stroke(0, 80);
  line(boxX + 50, boxY + 112, boxX + boxW - 50, boxY + 112);
  noStroke();

  const col1 = width / 2 - 200;
  const col2 = width / 2;
  const col3 = width / 2 + 200;
  const rowY = boxY + 155;

  fill(125, 207, 0);
  textStyle(BOLD);
  textSize(20);
  text("ENERGY", col1, rowY);

  fill(30);
  textSize(10);
  text("Represents your", col1, rowY + 30);
  text("mental capacity", col1, rowY + 45);

  fill(207, 0, 0);
  textSize(20);
  text("LOW ENERGY", col2, rowY);

  fill(30);
  textSize(10);
  text("• Movement slows", col2, rowY + 30);
  text("• Screen darkens", col2, rowY + 45);

  fill(0, 207, 204);
  textSize(20);
  text("RECOVER", col3, rowY);

  fill(30);
  textSize(10);
  text("Find HEARTS to", col3, rowY + 30);
  text("regain energy", col3, rowY + 45);

  const btnW = 200;
  const btnH = 50;
  const btnX = width / 2 - btnW / 2;
  const btnY = height - 105;

  fill(255);
  rect(btnX, btnY, btnW, btnH, 10);

  fill(0);
  textSize(18);
  text("START GAME", width / 2, btnY + btnH / 2 + 9);

  textSize(10);
  fill(255);
  text("Press H anytime to view controls", width / 2, height - 25);
}

// --------------------
// Start button click
// --------------------
function startMousePressed() {
  const btnW = 200;
  const btnH = 50;
  const btnX = width / 2 - btnW / 2;
  const btnY = height - 105;

  if (
    mouseX >= btnX &&
    mouseX <= btnX + btnW &&
    mouseY >= btnY &&
    mouseY <= btnY + btnH
  ) {
    currentScreen = "game";
    loadLevel(levelIndex);
  }
}

// --------------------
// Load level
// --------------------
function loadLevel(i) {
  levelIndex = i;

  level = LevelLoader.fromLevelsJson(allLevelsData, i);
  level.heartImg = heartImg;
  level.keyImg = keyImg;

  player = new BlobPlayer();
  player.spawnFromLevel(level);

  cam.x = player.x - width / 2;
  cam.y = player.y - height / 2;
  cam.clampToWorld(level.w, level.h);
}

// --------------------
// Draw loop
// --------------------
function draw() {
  if (currentScreen === "start") {
    drawStart();
    return;
  }

  if (currentScreen === "end") {
    drawEnd();
    return;
  }

  if (player.levelComplete) {
    currentScreen = "end";
    return;
  }

  player.update(level);
  level.updateTimers();

  cam.follow(player.x, player.y, level.camLerp);
  cam.clampToWorld(level.w, level.h);

  cam.begin();
  level.drawWorld();
  player.draw();
  cam.end();

  drawHUD();
  drawHelpButton();

  if (showControls) {
    drawControlsOverlay();
  }
}

// --------------------
// Draw keyboard key
// --------------------
function drawKey(x, y, label) {
  const w = 36;
  const h = 30;

  fill(255);
  stroke(0, 80);
  rect(x, y - h / 2, w, h, 6);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(14);
  text(label, x + w / 2, y);
}

// --------------------
// Controls overlay
// --------------------
function drawControlsOverlay() {
  fill(0, 160);
  rect(0, 0, width, height);

  const boxW = 520;
  const boxH = 340;
  const boxX = width / 2 - boxW / 2;
  const boxY = height / 2 - boxH / 2;

  fill(255, 235);
  stroke(40);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 16);

  fill(0);
  noStroke();

  textAlign(CENTER);
  textSize(30);
  text("CONTROLS", width / 2, boxY + 45);

  const rowStart = boxY + 95;
  const spacing = 42;

  const keyStartX = width / 2 - 150;
  const textX = width / 2 + 20;

  textAlign(LEFT, CENTER);
  textSize(16);

  drawKey(keyStartX, rowStart, "→");
  drawKey(keyStartX + 50, rowStart, "D");
  text("Move Right", textX, rowStart);

  drawKey(keyStartX, rowStart + spacing, "←");
  drawKey(keyStartX + 50, rowStart + spacing, "A");
  text("Move Left", textX, rowStart + spacing);

  drawKey(keyStartX, rowStart + spacing * 2, "↑");
  drawKey(keyStartX + 50, rowStart + spacing * 2, "W");
  text("Move Up", textX, rowStart + spacing * 2);

  drawKey(keyStartX, rowStart + spacing * 3, "↓");
  drawKey(keyStartX + 50, rowStart + spacing * 3, "S");
  text("Move Down", textX, rowStart + spacing * 3);

  stroke(0, 60);
  strokeWeight(1);

  const linePad = 100;
  const lineOffset = 20; // controls how far below the text the line appears

  line(
    boxX + linePad,
    rowStart + lineOffset,
    boxX + boxW - linePad,
    rowStart + lineOffset,
  );

  line(
    boxX + linePad,
    rowStart + spacing + lineOffset,
    boxX + boxW - linePad,
    rowStart + spacing + lineOffset,
  );

  line(
    boxX + linePad,
    rowStart + spacing * 2 + lineOffset,
    boxX + boxW - linePad,
    rowStart + spacing * 2 + lineOffset,
  );

  line(
    boxX + linePad,
    rowStart + spacing * 3 + lineOffset,
    boxX + boxW - linePad,
    rowStart + spacing * 3 + lineOffset,
  );

  noStroke();

  fill(40);
  textSize(12);
  textAlign(CENTER);
  text("Press H anytime to toggle this screen", width / 2, boxY + 270);

  closeBtn.x = width / 2 - closeBtn.w / 2;
  closeBtn.y = boxY + boxH - 45;

  fill(210);
  rect(closeBtn.x, closeBtn.y - 5, closeBtn.w, closeBtn.h, 10);

  fill(0);
  textSize(14);
  text("CLOSE", width / 2, closeBtn.y + 20 - 5);
}

// --------------------
// Help button
// --------------------
function drawHelpButton() {
  helpBtn.x = width - 50;
  helpBtn.y = 12;

  fill(255);
  stroke(0);
  rect(helpBtn.x, helpBtn.y, helpBtn.w, helpBtn.h, 8);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  text("?", helpBtn.x + helpBtn.w / 2, helpBtn.y + helpBtn.h / 2);
}

// --------------------
// HUD
// --------------------
function drawHUD() {
  const pad = 14;

  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  textSize(14);

  const keysText = `Keys: ${player.keysCollected}/${player.keysNeeded}`;
  text(keysText, pad, pad);

  const barX = pad;
  const barY = pad + 26;
  const barW = 180;
  const barH = 14;

  fill(220);
  rect(barX, barY, barW, barH, 6);

  const t = player.energy / player.energyMax;
  fill(70);
  rect(barX, barY, barW * t, barH, 6);

  fill(0);
  text(`Energy`, barX, barY + 18);

  if (player.isLowEnergy()) {
    const a = map(1 - t, 0, 1, 0, 160);
    fill(0, a);
    rect(0, 0, width, height);
  }
}

// --------------------
// Inputs
// --------------------
function keyPressed() {
  if (currentScreen === "start") {
    if (keyCode === ENTER) currentScreen = "game";
    return;
  }

  if (currentScreen === "end") {
    if (key === "r" || key === "R") currentScreen = "start";
    return;
  }

  if (key === "h" || key === "H") {
    showControls = !showControls;
  }

  if (key === "r" || key === "R") {
    loadLevel(levelIndex);
  }
}

function mousePressed() {
  if (currentScreen === "start") {
    startMousePressed();
    return;
  }

  if (currentScreen === "end") {
    endMousePressed();
    return;
  }

  if (
    mouseX > helpBtn.x &&
    mouseX < helpBtn.x + helpBtn.w &&
    mouseY > helpBtn.y &&
    mouseY < helpBtn.y + helpBtn.h
  ) {
    showControls = true;
  }

  if (
    showControls &&
    mouseX > closeBtn.x &&
    mouseX < closeBtn.x + closeBtn.w &&
    mouseY > closeBtn.y &&
    mouseY < closeBtn.y + closeBtn.h
  ) {
    showControls = false;
  }
}

// --------------------
// End screen
// --------------------
function drawEnd() {
  background(0);

  const boxW = 640;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 130;

  fill(245);
  stroke(0, 200);
  rect(boxX, boxY, boxW, boxH, 20);
  noStroke();

  textAlign(CENTER, CENTER);

  fill(225);
  textSize(35);
  text("LEVEL COMPLETE!", width / 2, 55);

  fill(0);
  textSize(20);
  text("You kept moving forward.", width / 2, height / 2);

  fill(225);
  textSize(16);
  text("Press 'R' or click to restart the game", width / 2, 420);
}

function endMousePressed() {
  currentScreen = "start";
}
