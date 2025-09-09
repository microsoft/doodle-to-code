// Simple Pong game logic and rendering
// Left paddle controlled by hand (or keyboard fallback)

import { getPaddleYLeft, getPaddleYRight, hasRightHand } from './hand-controller.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// Game state
const state = {
  ball: { x: W * 0.5, y: H * 0.5, vx: 5, vy: 3, r: 9 },
  left: { y: H * 0.5, h: 100, w: 14 },
  right: { y: H * 0.5, h: 100, w: 14, speed: 4.2 },
  score: { l: 0, r: 0 },
};

const PADDING = 16;
const NET_COLOR = 'rgba(255,255,255,0.12)';
const PADDLE_COLOR = '#e7eef7';
const BALL_COLOR = '#00f7ff';

// Utility
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function resetBall(direction = 1) {
  state.ball.x = W * 0.5;
  state.ball.y = H * 0.5;
  const speed = 6;
  const angle = (Math.random() * 0.8 - 0.4);
  state.ball.vx = direction * speed * (1 + Math.random() * 0.2);
  state.ball.vy = speed * angle;
}

function update() {
  // Control left paddle from hand controller
  const nyL = getPaddleYLeft(); // 0..1
  state.left.y = clamp(nyL * H, state.left.h / 2, H - state.left.h / 2);

  // Right paddle: if right hand detected, use it; else AI
  if (hasRightHand()) {
    const nyR = getPaddleYRight();
    state.right.y = clamp(nyR * H, state.right.h / 2, H - state.right.h / 2);
  } else {
    const targetY = state.ball.y;
    if (Math.abs(targetY - state.right.y) > 6) {
      state.right.y += Math.sign(targetY - state.right.y) * state.right.speed;
    }
    state.right.y = clamp(state.right.y, state.right.h / 2, H - state.right.h / 2);
  }

  // Move ball
  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  // Collide with top/bottom
  if (state.ball.y < state.ball.r || state.ball.y > H - state.ball.r) {
    state.ball.vy *= -1;
    state.ball.y = clamp(state.ball.y, state.ball.r, H - state.ball.r);
  }

  // Collide with paddles
  // Left paddle rect
  const lp = { x: PADDING, y: state.left.y - state.left.h / 2, w: state.left.w, h: state.left.h };
  // Right paddle rect
  const rp = { x: W - PADDING - state.right.w, y: state.right.y - state.right.h / 2, w: state.right.w, h: state.right.h };

  // Ball rect
  const b = { x: state.ball.x - state.ball.r, y: state.ball.y - state.ball.r, w: state.ball.r * 2, h: state.ball.r * 2 };

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  if (intersects(lp, b) && state.ball.vx < 0) {
    const relative = (state.ball.y - state.left.y) / (state.left.h / 2); // -1..1
    const bounceAngle = relative * 0.6; // radians-ish scaling
    const speed = Math.min(12, Math.hypot(state.ball.vx, state.ball.vy) * 1.05 + 0.5);
    state.ball.vx = Math.abs(Math.cos(bounceAngle) * speed);
    state.ball.vy = Math.sin(bounceAngle) * speed;
    state.ball.x = lp.x + lp.w + state.ball.r + 1;
  }

  if (intersects(rp, b) && state.ball.vx > 0) {
    const relative = (state.ball.y - state.right.y) / (state.right.h / 2);
    const bounceAngle = relative * 0.6;
    const speed = Math.min(12, Math.hypot(state.ball.vx, state.ball.vy) * 1.05 + 0.5);
    state.ball.vx = -Math.abs(Math.cos(bounceAngle) * speed);
    state.ball.vy = Math.sin(bounceAngle) * speed;
    state.ball.x = rp.x - state.ball.r - 1;
  }

  // Score
  if (state.ball.x < -20) {
    state.score.r += 1;
    updateScore();
    resetBall(1);
  } else if (state.ball.x > W + 20) {
    state.score.l += 1;
    updateScore();
    resetBall(-1);
  }
}

function drawNet() {
  ctx.strokeStyle = NET_COLOR;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // background vignette already via CSS; draw net
  drawNet();

  // paddles
  ctx.fillStyle = PADDLE_COLOR;
  ctx.shadowColor = 'rgba(0,247,255,0.35)';
  ctx.shadowBlur = 14;
  ctx.fillRect(PADDING, state.left.y - state.left.h / 2, state.left.w, state.left.h);
  ctx.fillRect(W - PADDING - state.right.w, state.right.y - state.right.h / 2, state.right.w, state.right.h);

  // ball with glow
  ctx.fillStyle = BALL_COLOR;
  ctx.shadowColor = 'rgba(255,97,246,0.45)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();
  // reset shadows for other drawings
  ctx.shadowBlur = 0;
}

function updateScore() {
  document.getElementById('scoreLeft').textContent = String(state.score.l);
  document.getElementById('scoreRight').textContent = String(state.score.r);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetBall();
updateScore();
loop();
