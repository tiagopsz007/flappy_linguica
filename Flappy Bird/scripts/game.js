// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FPS = 60;
const JUMP_AMOUNT = -8;
const MAX_FALL_SPEED = 8;
const ACCELERATION = 0.4;
const PIPE_SPEED = -3;
const GAP_SIZE = 180;
const BIRD_SIZE = 50;
const PIPE_WIDTH = 80;
const COLLISION_MARGIN = 8;

// Game state
let gameMode = 'prestart';
let score = 0;
let highScore = 0;
let bird = null;
let pipes = [];
let finishLine = null;
let imagesLoaded = 0;
const totalImages = 3;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const prestartScreen = document.getElementById('prestart-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const restartButton = document.getElementById('restart-button');
const finalScoreEl = document.getElementById('final-score');
const finalHighscoreEl = document.getElementById('final-highscore');
const highscoreDisplay = document.getElementById('highscore-display');

// Load images
const birdImage = new Image();
const pipeImage = new Image();
const finishImage = new Image();

birdImage.onload = onImageLoad;
pipeImage.onload = onImageLoad;
finishImage.onload = onImageLoad;

birdImage.src = './images/linguica.png';
pipeImage.src = './images/espeto.png';
finishImage.src = './images/churrasqueira.png';

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    initGame();
    requestAnimationFrame(gameLoop);
  }
}

function createSprite(x, y, width, height, image, velocityX = 0, velocityY = 0) {
  return {
    x,
    y,
    width,
    height,
    velocityX,
    velocityY,
    visible: true,
    image,
    angle: 0,
    flipV: false
  };
}

function initGame() {
  // Initialize bird
  bird = createSprite(
    CANVAS_WIDTH / 3,
    CANVAS_HEIGHT / 2,
    BIRD_SIZE,
    BIRD_SIZE,
    birdImage
  );

  // Initialize pipes
  const pipePositions = [
    { x: 600, gapY: 150 },
    { x: 900, gapY: 100 },
    { x: 1200, gapY: 250 },
    { x: 1500, gapY: 200 },
    { x: 1800, gapY: 150 },
    { x: 2100, gapY: 180 },
    { x: 2400, gapY: 100 },
    { x: 2700, gapY: 250 },
    { x: 3000, gapY: 150 },
    { x: 3300, gapY: 200 }
  ];

  pipes = pipePositions.map(pos => ({
    top: createSprite(
      pos.x,
      0,
      PIPE_WIDTH,
      pos.gapY,
      pipeImage,
      PIPE_SPEED
    ),
    bottom: (() => {
      const sprite = createSprite(
        pos.x,
        pos.gapY + GAP_SIZE,
        PIPE_WIDTH,
        CANVAS_HEIGHT - (pos.gapY + GAP_SIZE),
        pipeImage,
        PIPE_SPEED
      );
      sprite.flipV = true;
      return sprite;
    })(),
    passed: false
  }));

  // Initialize finish line
  finishLine = createSprite(
    3600,
    CANVAS_HEIGHT / 2 - 100,
    100,
    200,
    finishImage,
    PIPE_SPEED
  );
}

function checkCollision(sprite1, sprite2) {
  if (!sprite1.visible || !sprite2.visible) return false;

  const s1Left = sprite1.x + COLLISION_MARGIN;
  const s1Right = sprite1.x + sprite1.width - COLLISION_MARGIN;
  const s1Top = sprite1.y + COLLISION_MARGIN;
  const s1Bottom = sprite1.y + sprite1.height - COLLISION_MARGIN;

  const s2Left = sprite2.x;
  const s2Right = sprite2.x + sprite2.width;
  const s2Top = sprite2.y;
  const s2Bottom = sprite2.y + sprite2.height;

  return !(
    s1Right < s2Left ||
    s1Left > s2Right ||
    s1Bottom < s2Top ||
    s1Top > s2Bottom
  );
}

function drawSprite(sprite) {
  if (!sprite.visible) return;

  ctx.save();
  ctx.translate(sprite.x + sprite.width / 2, sprite.y + sprite.height / 2);

  if (sprite.angle) {
    ctx.rotate((sprite.angle * Math.PI) / 180);
  }

  if (sprite.flipV) {
    ctx.scale(1, -1);
  }

  ctx.drawImage(
    sprite.image,
    -sprite.width / 2,
    -sprite.height / 2,
    sprite.width,
    sprite.height
  );

  ctx.restore();
}

function updateBird() {
  if (!bird) return;

  // Apply gravity
  if (bird.velocityY < MAX_FALL_SPEED) {
    bird.velocityY += ACCELERATION;
  }

  // Update position
  bird.y += bird.velocityY;

  // Tilt based on velocity
  if (bird.velocityY < 0) {
    bird.angle = -20;
  } else if (bird.angle < 70) {
    bird.angle += 3;
  }

  // Check boundaries
  if (bird.y < 0) {
    bird.y = 0;
    bird.velocityY = 0;
  }

  if (bird.y + bird.height > CANVAS_HEIGHT - 50) {
    bird.y = CANVAS_HEIGHT - 50 - bird.height;
    endGame();
  }
}

function updatePipes() {
  if (!bird) return;

  pipes.forEach(pipe => {
    pipe.top.x += pipe.top.velocityX;
    pipe.bottom.x += pipe.bottom.velocityX;

    // Check if bird passed the pipe
    if (!pipe.passed && pipe.top.x + pipe.top.width < bird.x) {
      pipe.passed = true;
      score++;
      updateScoreDisplay();
    }

    // Check collision
    if (checkCollision(bird, pipe.top) || checkCollision(bird, pipe.bottom)) {
      endGame();
    }
  });

  // Update finish line
  if (finishLine) {
    finishLine.x += finishLine.velocityX;

    // Check if reached finish line
    if (checkCollision(bird, finishLine)) {
      endGame();
    }
  }
}

function updateScoreDisplay() {
  // Score is displayed on canvas, so no need for separate update
}

function draw() {
  // Clear canvas
  ctx.fillStyle = 'hsl(200, 60%, 85%)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw ground
  ctx.fillStyle = 'hsl(25, 40%, 45%)';
  ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

  // Draw pipes
  pipes.forEach(pipe => {
    drawSprite(pipe.top);
    drawSprite(pipe.bottom);
  });

  // Draw finish line
  if (finishLine) {
    drawSprite(finishLine);
  }

  // Draw bird
  if (bird) {
    drawSprite(bird);
  }

  // Draw score
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.strokeText(`Pontos: ${score}`, 20, 40);
  ctx.fillText(`Pontos: ${score}`, 20, 40);
}

function gameLoop() {
  if (gameMode === 'running') {
    updateBird();
    updatePipes();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function handleJump() {
  if (gameMode === 'prestart') {
    gameMode = 'running';
    prestartScreen.classList.add('hidden');
    if (bird) {
      bird.velocityY = JUMP_AMOUNT;
    }
  } else if (gameMode === 'running') {
    if (bird) {
      bird.velocityY = JUMP_AMOUNT;
    }
  }
}

function endGame() {
  if (gameMode === 'over') return;
  
  gameMode = 'over';
  
  // Update high score
  if (score > highScore) {
    highScore = score;
    highscoreDisplay.textContent = highScore;
  }
  
  // Show game over screen
  finalScoreEl.textContent = score;
  finalHighscoreEl.textContent = highScore;
  gameoverScreen.classList.remove('hidden');
}

function resetGame() {
  score = 0;
  gameMode = 'prestart';
  
  // Hide game over screen
  gameoverScreen.classList.add('hidden');
  prestartScreen.classList.remove('hidden');
  
  // Reset bird
  if (bird) {
    bird.y = CANVAS_HEIGHT / 2;
    bird.x = CANVAS_WIDTH / 3;
    bird.velocityY = 0;
    bird.angle = 0;
  }

  // Reset pipes
  const pipePositions = [
    { x: 600, gapY: 150 },
    { x: 900, gapY: 100 },
    { x: 1200, gapY: 250 },
    { x: 1500, gapY: 200 },
    { x: 1800, gapY: 150 },
    { x: 2100, gapY: 180 },
    { x: 2400, gapY: 100 },
    { x: 2700, gapY: 250 },
    { x: 3000, gapY: 150 },
    { x: 3300, gapY: 200 }
  ];

  pipes.forEach((pipe, index) => {
    const pos = pipePositions[index];
    pipe.top.x = pos.x;
    pipe.top.y = 0;
    pipe.top.height = pos.gapY;
    pipe.bottom.x = pos.x;
    pipe.bottom.y = pos.gapY + GAP_SIZE;
    pipe.bottom.height = CANVAS_HEIGHT - (pos.gapY + GAP_SIZE);
    pipe.passed = false;
  });

  // Reset finish line
  if (finishLine) {
    finishLine.x = 3600;
  }
}

// Event listeners
canvas.addEventListener('click', handleJump);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleJump();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleJump();
  }
});

restartButton.addEventListener('click', resetGame);