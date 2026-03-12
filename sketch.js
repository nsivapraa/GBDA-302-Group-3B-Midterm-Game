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
  createCanvas(VIEW_W, VIEW_H);
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
// STORY SCREEN
// --------------------
function drawStoryScreen() {
  background(0);

  textAlign(CENTER, CENTER);

  // main story text
  fill(255);
  textSize(15);

  text(
    "Depression affects 5% of the global population.\n\n" +
      "Rachel is one of them.\n\n" +
      "Because of depression, Rachel struggles\n" +
      "to complete everyday tasks.\n\n" +
      "Help Rachel get through the day",
    width / 2,
    height / 2 - 40,
  );

  // glowing line
  push();

  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = "rgba(180,255,0,0.9)";

  fill(180, 255, 0);
  textSize(18);

  text("and find her way home.", width / 2, height / 2 + 75);

  pop();

  const btnW = 160;
  const btnH = 50;
  const btnX = width / 2 - btnW / 2;
  const btnY = height - 100;

  fill(255);
  rect(btnX, btnY, btnW, btnH, 10);

  fill(0);
  textSize(18);
  text("NEXT", width / 2, btnY + btnH / 2 + 6);
}

// --------------------
// Start button
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
    currentScreen = "story";
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

  if (currentScreen === "story") {
    drawStoryScreen();
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
// Mouse input
// --------------------
function mousePressed() {
  if (currentScreen === "start") {
    startMousePressed();
    return;
  }

  if (currentScreen === "story") {
    const btnW = 160;
    const btnH = 50;
    const btnX = width / 2 - btnW / 2;
    const btnY = height - 100;

    if (
      mouseX >= btnX &&
      mouseX <= btnX + btnW &&
      mouseY >= btnY &&
      mouseY <= btnY + btnH
    ) {
      currentScreen = "game";
      loadLevel(levelIndex);
    }

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
