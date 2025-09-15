// Hand Controller using MediaPipe Hands
// Maps the user's index fingertip Y to normalized [0,1] positions for left and right hands.

const statusEl = document.getElementById('status');
const overlayEl = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const noCamBtn = document.getElementById('noCamBtn');
const inputVideo = document.getElementById('inputVideo');
const debugCanvas = document.getElementById('debugCanvas');
const camOverlay = document.getElementById('camOverlay');
const toggleDebug = document.getElementById('toggleDebug');

let hands, camera;
let useCamera = true;
let initialized = false;

// Track left and right hands separately
let lastYLeft = 0.5;
let lastYRight = 0.5;
let smoothYLeft = 0.5;
let smoothYRight = 0.5;
let detectedLeft = false;
let detectedRight = false;

// Simple EMA smoothing to dampen jitter
const SMOOTHING_ALPHA = 0.35; // 0..1 (higher = quicker response)
// Allow reaching screen extremes sooner by ignoring unreliable edge regions
const EDGE_MARGIN = 0.12; // 12% margin at top and bottom
// Grace period to hold last value when detection briefly drops
const HOLD_MS = 450;

let lastSeenLeft = 0;
let lastSeenRight = 0;

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function remapWithMargin(y) {
  // Map [EDGE_MARGIN, 1-EDGE_MARGIN] -> [0,1]
  const span = 1 - 2 * EDGE_MARGIN;
  return clamp01((y - EDGE_MARGIN) / span);
}

export function getPaddleYLeft() { return smoothYLeft; }
export function getPaddleYRight() { return smoothYRight; }
export function hasLeftHand() { return detectedLeft; }
export function hasRightHand() { return detectedRight; }

export function isUsingCamera() {
  return useCamera;
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg || '';
}

function drawDebug(results) {
  const ctx = debugCanvas.getContext('2d');
  ctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
  if (!results || !results.image) return;

  const cw = debugCanvas.width;
  const ch = debugCanvas.height;
  // Mirror horizontally so preview matches user perspective
  ctx.save();
  ctx.translate(cw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, 0, 0, cw, ch);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      window.drawConnectors?.(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#7aa2f7', lineWidth: 2 });
      window.drawLandmarks?.(ctx, landmarks, { color: '#6be675', lineWidth: 1, radius: 2 });
    }
  }
  ctx.restore();
}

function handleResults(results) {
  drawDebug(results);

  detectedLeft = false;
  detectedRight = false;

  const lms = results.multiHandLandmarks || [];
  const handsMeta = results.multiHandedness || [];

  if (lms.length === 0) {
    setStatus('Show your hands to control both paddles');
    // slight relax toward center when no hands
    const now = Date.now();
    if (now - lastSeenLeft > HOLD_MS) lastYLeft = 0.5; // else hold
    if (now - lastSeenRight > HOLD_MS) lastYRight = 0.5; // else hold
  } else {
    setStatus('Tracking hands');
    for (let i = 0; i < lms.length; i++) {
  let meta = (Array.isArray(handsMeta) && handsMeta[i] && handsMeta[i].label) ? handsMeta[i].label : '';
  // Since we mirror the preview, swap handedness to match user perspective
  if (meta === 'Left') meta = 'Right'; else if (meta === 'Right') meta = 'Left';
      const indexTip = lms[i][8];
      const y = remapWithMargin(clamp01(indexTip.y));
      if (meta === 'Left') { // user's left hand
        detectedLeft = true;
        lastYLeft = y;
        lastSeenLeft = Date.now();
      } else if (meta === 'Right') { // user's right hand
        detectedRight = true;
        lastYRight = y;
        lastSeenRight = Date.now();
      } else {
        // If classification missing, assign first to whichever not seen yet
        if (!detectedLeft) { detectedLeft = true; lastYLeft = y; lastSeenLeft = Date.now(); }
        else if (!detectedRight) { detectedRight = true; lastYRight = y; lastSeenRight = Date.now(); }
      }
    }
    // If only one hand, relax the other toward center slightly
    const now = Date.now();
    if (!detectedLeft && now - lastSeenLeft > HOLD_MS) lastYLeft = 0.5;
    if (!detectedRight && now - lastSeenRight > HOLD_MS) lastYRight = 0.5;
  }

  // Smooth both
  smoothYLeft = SMOOTHING_ALPHA * lastYLeft + (1 - SMOOTHING_ALPHA) * smoothYLeft;
  smoothYRight = SMOOTHING_ALPHA * lastYRight + (1 - SMOOTHING_ALPHA) * smoothYRight;
}

async function initHands() {
  if (initialized) return;
  initialized = true;

  setStatus('Loading hand tracker...');
  hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    selfieMode: false,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65,
  });
  hands.onResults(handleResults);

  try {
    // Start camera stream using the MediaPipe Camera helper
    camera = new window.Camera(inputVideo, {
      onFrame: async () => {
        await hands.send({ image: inputVideo });
      },
      width: 320,
      height: 180,
    });
    await camera.start();
    overlayEl.classList.add('hidden');
    setStatus('Camera started');
  } catch (err) {
    console.error(err);
  setStatus('Camera error. Falling back to keyboard for left paddle.');
    useCamera = false;
    overlayEl.classList.add('hidden');
  }
}

function stopCamera() {
  try { camera?.stop?.(); } catch {}
}

// Keyboard fallback (left paddle only)
let keyY = 0.5;
const KEY_SPEED = 0.02; // per frame

function setupKeyboardFallback() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keyY = Math.max(0, keyY - KEY_SPEED);
    if (e.key === 'ArrowDown') keyY = Math.min(1, keyY + KEY_SPEED);
  });
  setInterval(() => {
    if (!useCamera) {
      lastYLeft = keyY;
      smoothYLeft = SMOOTHING_ALPHA * lastYLeft + (1 - SMOOTHING_ALPHA) * smoothYLeft;
    }
  }, 16);
}

function setupUI() {
  startBtn?.addEventListener('click', async () => {
    useCamera = true;
    await initHands();
  });

  noCamBtn?.addEventListener('click', () => {
    useCamera = false;
    overlayEl.classList.add('hidden');
  setStatus('Keyboard mode (left only): use Up/Down arrows');
    stopCamera();
  });

  toggleDebug?.addEventListener('change', () => {
    const on = toggleDebug.checked;
    camOverlay.style.display = on ? 'block' : 'none';
  });

  // Hide debug by default on small screens
  if (window.innerWidth < 700) {
    toggleDebug.checked = false;
    camOverlay.style.display = 'none';
  }
}

setupUI();
setupKeyboardFallback();
