const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const instructions = document.querySelector(".instructions");

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const FPS = 40;
const jump_amount = -12;
const max_fall_speed = 12;
const acceleration = 1;

let pipe_speed = -3;
let game_mode = "prestart";
let time_game_last_running;
let bottom_bar_offset = 0;
let pipes = [];

function MySprite(img_url) {
  this.x = 0;
  this.y = 0;
  this.visible = true;
  this.velocity_x = 0;
  this.velocity_y = 0;
  this.MyImg = new Image();
  this.MyImg.src = img_url || "";
  this.angle = 0;
  this.flipV = false;
  this.flipH = false;
}

MySprite.prototype.draw = function () {
  if (!this.visible) return;
  ctx.save();
  ctx.translate(this.x + this.MyImg.width / 2, this.y + this.MyImg.height / 2);
  ctx.rotate((this.angle * Math.PI) / 180);
  if (this.flipV) ctx.scale(1, -1);
  if (this.flipH) ctx.scale(-1, 1);
  ctx.drawImage(this.MyImg, -this.MyImg.width / 2, -this.MyImg.height / 2);
  ctx.restore();

  this.x += this.velocity_x;
  this.y += this.velocity_y;
};

function imagesTouching(a, b) {
  if (!a.visible || !b.visible) return false;
  return !(a.x + a.MyImg.width < b.x ||
           b.x + b.MyImg.width < a.x ||
           a.y + a.MyImg.height < b.y ||
           b.y + b.MyImg.height < a.y);
}

function playerInput(e) {
  e.preventDefault();

  switch (game_mode) {
    case "prestart":
      game_mode = "running";
      instructions.classList.remove("show");
      break;

    case "running":
      bird.velocity_y = jump_amount;
      break;
    case "over":
      if (Date.now() - time_game_last_running > 1000) {
        resetGame();
        game_mode = "running";
      }
      break;
  }
}
canvas.addEventListener("touchstart", playerInput);
canvas.addEventListener("mousedown", playerInput);
window.addEventListener("keydown", playerInput);

const bird = new MySprite("./images/linguica.png");
function resetBird() {
  bird.x = canvas.width * 0.25;
  bird.y = canvas.height / 2;
  bird.velocity_y = 0;
  bird.angle = 0;
}
resetBird();

function birdPhysics() {
  if (bird.velocity_y < max_fall_speed) {
    bird.velocity_y += acceleration;
  }
  bird.y += bird.velocity_y;

  if (bird.velocity_y < 0) bird.angle = -20;
  else bird.angle = Math.min(bird.angle + 4, 80);

  if (bird.y > canvas.height - bird.MyImg.height || bird.y < - bird.MyImg.height) {
    game_mode = "over";
  }
}

// Canos
function addPipe(x, topGapY, gapSize) {
  const top = new MySprite("./images/espeto.png");
  top.x = x;
  top.y = topGapY - top.MyImg.height;
  top.velocity_x = pipe_speed;

  const bottom = new MySprite("./images/espeto.png");
  bottom.x = x;
  bottom.y = topGapY + gapSize;
  bottom.velocity_x = pipe_speed;
  bottom.flipV = true;

  pipes.push(top, bottom);
}

function createLevel() {
  pipes = [];
  const spacing = 280;
  const positions = [100, 50, 250, 150, 100, 150, 200, 250, 30, 300, 100, 250, 50];
  const gaps = [140, 140, 140, 120, 120, 120, 120, 120, 100, 100, 80, 80, 60];

  positions.forEach((gapY, i) => {
    addPipe(canvas.width + i * spacing + 300, gapY, gaps[i] || 100);
  });

  const finish = new MySprite("http://s2js.com/img/etc/flappyend.png");
  finish.x = canvas.width + 13 * spacing;
  finish.velocity_x = pipe_speed;
  pipes.push(finish);
}

const pipeImg = new Image();
pipeImg.src = "./images/espeto.png";
pipeImg.onload = () => {
  createLevel();
};

const groundImg = new Image();
groundImg.src = "http://s2js.com/img/etc/flappybottom.png";

function drawGround() {
  bottom_bar_offset += pipe_speed;

  if (bottom_bar_offset <= -groundImg.width) bottom_bar_offset = 0;

  ctx.drawImage(groundImg, bottom_bar_offset, canvas.height - groundImg.height);
  ctx.drawImage(groundImg, bottom_bar_offset + groundImg.width, canvas.height - groundImg.height);
}

function drawScoreAndGameOver() {
  let score = 0;
  pipes.forEach(p => { if (p.x + p.MyImg.width < bird.x) score += 0.5; });

  if (game_mode === "over") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 50px Pacifico";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE CHURRASCO!", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = "40px Pacifico";
    ctx.fillText("Pontos: " + Math.floor(score), canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = "30px Pacifico";
    ctx.fillText("Toque ou clique para jogar novamente", canvas.width / 2, canvas.height / 2 + 100);
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  bird.draw();
  drawGround();

  if (game_mode === "prestart") {
    instructions.classList.add("show");
  }

  if (game_mode === "running") {
    time_game_last_running = Date.now();
    bottom_bar_offset += pipe_speed;

    pipes.forEach(p => p.draw());
    birdPhysics();

    pipes.forEach(p => {
      if (imagesTouching(bird, p)) game_mode = "over";
    });
  }

  if (game_mode === "over") {
    birdPhysics();
    drawScoreAndGameOver();
  }
}

function resetGame() {
  resetBird();
  createLevel();
}

setInterval(gameLoop, 1000 / FPS);