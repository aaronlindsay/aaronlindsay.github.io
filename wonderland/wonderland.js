import { Snowflake, SnowflakeV2 } from './snowflake.js';
import { fastBlur } from './utils.js';
import { MusicUiButton, ChaosUiButton, MenuUiButton, DebugUiButton, PauseUiButton, PaletteUiButton, PeriscopeUiButton } from './ui.js';
import { globalColors, changeTheme, currentThemeIndex, THEMES } from './theme.js';
import {
  ambientWind, setAmbientWind, getWindFromPos,
  windMask, createWindMask, fadeWindMask, sampleWindMask, drawBlow, drawBlowRing, blow,
  setBlowRange, setNoiseScale, setNoiseSampleRate,
  noiseScale, noiseSampleRate, defaultNoiseScale, defaultNoiseSampleRate,
  cleanupWindResources, setLastMouseP
} from './wind.js';
import { drawBloom, createPeriscopeImg, drawPeriscope, drawWindMask } from './effects.js';

// Adjust params
export let DEBUG = false;
let ENABLE_PERISCOPE = false;
let framePeriscopeToggled = 0;

let CNV;
export let WIDTH;
export let HEIGHT;
export let MIN_DIM_SIZE;
let AREA;
let maxRadius;

const targetFrameRate = 30;
const maxSnowflakes = 4096; // 4096;
const minRadiusFactor = 1 / 1024;
const maxRadiusFactor = 1 / 24;
let frameCount = 0;
let snowflakes = null;
let windDebugX = 10;
let windDebugY = 6;
let finishedGeneration = false;
let loadingFlake;
let loadingFlakeRadius;
let bg;
let loadingProgress = 0;
let displayedProgress = 0;

// audio
let jazzAmbiance;
let audioVolume = 0;
let audioRampDuration = 1;
let periscopeImg;
let periscopeRadiusFactor = 4 / 5;
let periscopeVignetteRadiusFactor = 1 / 4;
let periscopeRadius = 0;
let periscopeVignetteRadius = 0;

let grainImg;
let grainOffset = 20;

let menuBtn;
let musicBtn;
let chaosBtn;
let debugBtn;
let pauseBtn;
let paletteBtn;
let periscopeBtn;

// Expose variables to window for UI classes
window.audioVolume = audioVolume;
window.isPaused = false; // Initialize isPaused
// jazzAmbiance and others are exposed in setup/preload or updated in draw



function cleanupResources() {
  if (snowflakes) {
    for (let sf of snowflakes) {
      sf.destroy();
    }
  }
  snowflakes = [];
  if (loadingFlake) {
    loadingFlake.destroy();
    loadingFlake = null;
  }
  // if (bg) {
  //   bg.destroy();
  //   bg = null;
  // }
  cleanupWindResources();
}


async function generateSnowflakes(n, minRadiusFactor, maxRadiusFactor, useTimeLimit = true) {
  console.log("Generating snowflakes...");
  cleanupResources();
  createWindMask(WIDTH, HEIGHT);

  loadingFlake = new SnowflakeV2(
    WIDTH / 2, HEIGHT / 2,
    loadingFlakeRadius, createVector(0, 0)
  );
  loadingFlake.initRandom(maxRadius);
  loadingFlake.setMinRotSpeed(1.5);
  loadingFlake.render();
  const themeSequence = [...Array(THEMES.length - 1).keys()].map(i => i + 1).concat([0]);

  snowflakes = [];
  const chunkSize = 64;
  const timeLimit = 20; // ms
  while (snowflakes.length < n) {
    const startTime = millis();
    let processed = 0;

    while (snowflakes.length < n) {
      // Check exit condition for this chunk
      if (useTimeLimit) {
        if (millis() - startTime >= timeLimit) break;
      } else {
        if (processed >= chunkSize) break;
      }

      const x = random(0, WIDTH);
      const y = random(0, HEIGHT);
      const minRadius = minRadiusFactor * MIN_DIM_SIZE;
      const maxRadius = maxRadiusFactor * MIN_DIM_SIZE;
      let r = Math.max(
        1, maxRadius * Math.pow(random(0, 1), (n / 10) * maxRadiusFactor) + minRadius
      );

      // let sf = new SnowflakeV1(x, y, r, wind.copy())
      const localWind = ambientWind.copy();  // getWindFromPos(x, y);
      let sf = new SnowflakeV2(x, y, r, localWind);
      sf.initRandom(maxRadius);
      sf.render();
      snowflakes.push(sf);
      processed++;

      // Update progress during generation (first 1/5th of total progress)
      // We can't use completedOps here easily because it's local to the loop, 
      // but we know generation is 20% of the work.
      loadingProgress = (snowflakes.length / n) / (themeSequence.length + 1);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Warmup: Cycle through all themes to pre-calculate indices and allocate buffers

  // Calculate total steps for progress bar
  // Generation is 1 part, each theme transition is 1 part. Total = 1 + 4 = 5 parts.
  // Actually, let's count snowflakes processed.
  // Generation: n snowflakes
  // Warmup: n snowflakes * 4 themes
  // Total ops = n * 5

  const totalOps = n * (themeSequence.length + 1);
  let completedOps = n; // Generation is done

  let currentFlake1 = globalColors.flake1;
  let currentFlake2 = globalColors.flake2;
  for (let themeIdx of themeSequence) {
    const nextTheme = THEMES[themeIdx];

    const oldFlake1 = currentFlake1;
    const oldFlake2 = currentFlake2;
    const newFlake1 = color(nextTheme.flake1);
    const newFlake2 = color(nextTheme.flake2);

    let index = 0;
    while (index < snowflakes.length) {
      const startTime = millis();
      let processed = 0;

      while (index < snowflakes.length) {
        if (millis() - startTime >= timeLimit) break;

        const sf = snowflakes[index];
        sf.prepareRecolor(oldFlake1, oldFlake2, newFlake1, newFlake2);
        sf.applyRecolor();

        index++;
        processed++;
        completedOps++;
      }

      loadingProgress = completedOps / totalOps;
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // // Update global colors for next pass
    // globalColors.bg = color(nextTheme.bg);
    // globalColors.flake1 = color(nextTheme.flake1);
    // globalColors.flake2 = color(nextTheme.flake2);
    // globalColors.ui = color(nextTheme.ui);

    currentFlake1 = newFlake1;
    currentFlake2 = newFlake2;
  }

  finishedGeneration = true;
}

function drawLoading() {
  if (!loadingFlake) {
    console.error("drawLoading: loadingFlake is null!");
    return false;
  }
  loadingFlake.draw();
  loadingFlake.update(createVector(0, 0), maxRadius, noiseScale);

  // loading progress bar
  displayedProgress = lerp(displayedProgress, loadingProgress, 0.1);
  if (Math.abs(displayedProgress - loadingProgress) < 0.001) {
    displayedProgress = loadingProgress;
  }
  const progress = displayedProgress;
  const barHeight = Math.min(MIN_DIM_SIZE * 0.02, HEIGHT * 0.015);

  push();
  translate(WIDTH / 2, HEIGHT);

  // Background
  strokeWeight(2);
  stroke("white");
  noFill();
  rect(-WIDTH / 2 - 10, -barHeight, WIDTH + 20, barHeight + 10);

  // Foreground
  // const barHeight2 = barHeight * 0.9;
  fill("white");
  noStroke();
  rect(-WIDTH / 2 - 10, -barHeight, (WIDTH + 20) * progress, barHeight + 10);


  // imageMode(CENTER);
  // tint(globalColors.bg);
  pop();

  // drawBloom(WIDTH, HEIGHT);
  return true
}

function preload() {
  jazzAmbiance = loadSound("assets/jazzambiance.mp3");
}

function setup() {
  WIDTH = windowWidth;
  HEIGHT = windowHeight;
  AREA = Math.sqrt(WIDTH * HEIGHT);
  MIN_DIM_SIZE = Math.min(WIDTH, HEIGHT);
  loadingFlakeRadius = MIN_DIM_SIZE / 4;
  // periscopeRadius = 7 * MIN_DIM_SIZE / 12;
  // periscopeVignetteRadius = MIN_DIM_SIZE / 10;
  periscopeRadius = periscopeRadiusFactor * MIN_DIM_SIZE;
  periscopeVignetteRadius = periscopeVignetteRadiusFactor * MIN_DIM_SIZE;

  // CNV = createCanvas(WIDTH, HEIGHT, WEBGL);
  CNV = createCanvas(WIDTH, HEIGHT);
  globalColors.bg = color(globalColors.bg);
  globalColors.flake1 = color(globalColors.flake1);
  globalColors.flake2 = color(globalColors.flake2);
  globalColors.ui = color(globalColors.ui);
  maxRadius = maxRadiusFactor * MIN_DIM_SIZE;
  setAmbientWind(createVector(0, 1));
  setBlowRange(MIN_DIM_SIZE / 4);
  // _reusableWind = createVector(0, 0); // Moved to wind.js
  // CNV.mouseClicked(pauseDraw);

  noFill();
  colorMode(RGB, 255, 255, 255, 255);
  angleMode(DEGREES);
  imageMode(CENTER);
  blendMode(BLEND);
  frameRate(targetFrameRate);
  pixelDensity(1);

  generateSnowflakes(maxSnowflakes, minRadiusFactor, maxRadiusFactor);

  // Initialize Buttons
  const isLandscape = WIDTH > HEIGHT;
  const buttonRadius = AREA / (isLandscape ? 32 : 24);
  const buttonPadding = 0.85 * buttonRadius;
  const textScale = 1.4 * buttonRadius;

  chaosBtn = new ChaosUiButton(
    0, 0, // Position handled by menu
    "☁", buttonRadius, textScale,
    (isToggled) => {
      if (isToggled) {
        setNoiseScale(defaultNoiseScale * 2.5);
        setNoiseSampleRate(defaultNoiseSampleRate * 3.5);
      } else {
        setNoiseScale(defaultNoiseScale);
        setNoiseSampleRate(defaultNoiseSampleRate);
      }
    }
  );
  chaosBtn.isVisible = false;

  musicBtn = new MusicUiButton(
    0, 0, // Position handled by menu
    "♬", buttonRadius, textScale * 0.875
  );
  musicBtn.isVisible = false;

  debugBtn = new DebugUiButton(
    0, 0, // Position handled by menu
    "𖢥", buttonRadius, textScale,
    (isToggled) => {
      DEBUG = isToggled;
    }
  );
  debugBtn.isVisible = false;

  pauseBtn = new PauseUiButton(
    0, 0, // Position handled by menu
    "⏯︎", buttonRadius, textScale * 1.15,
    (isToggled) => {
      window.isPaused = isToggled;
    }
  );
  pauseBtn.isVisible = false;

  paletteBtn = new PaletteUiButton(
    0, 0, // Position handled by menu
    "✎", buttonRadius, textScale,
    () => {
      changeTheme(snowflakes);
    }
  );
  paletteBtn.isVisible = false;

  periscopeBtn = new PeriscopeUiButton(
    0, 0, // Position handled by menu
    "◉", buttonRadius, textScale * 0.95,
    (isToggled) => {
      ENABLE_PERISCOPE = isToggled;
      framePeriscopeToggled = frameCount;
    }
  );
  periscopeBtn.isVisible = false;

  const childPaddingFactor = 0.125;
  const childButtons = [debugBtn, musicBtn, pauseBtn, periscopeBtn, paletteBtn, chaosBtn];
  menuBtn = new MenuUiButton(
    WIDTH - buttonRadius - buttonPadding, HEIGHT - buttonRadius - buttonPadding,
    // "➦", buttonRadius, textScale
    "❄", buttonRadius, textScale * 1.25, childButtons, childPaddingFactor
  );
  menuBtn.clipToWidth(WIDTH, buttonPadding);



  periscopeImg = createPeriscopeImg(WIDTH, HEIGHT, periscopeRadius, periscopeVignetteRadius);

  // Generate grain texture
  // grainImg = createGrainImg(WIDTH + 2 * grainOffset, HEIGHT + 2 * grainOffset);

  window.addEventListener('beforeunload', cleanupResources);
}

function draw() {
  // noLoop();
  background(globalColors.bg);
  fadeWindMask();

  if (!finishedGeneration || displayedProgress < 0.999) {
    return drawLoading();
  }

  if (mouseIsPressed) {
    blow(snowflakes, maxRadius, WIDTH, HEIGHT, AREA / 5);
  }
  else {
    setLastMouseP(null);
  }

  const inViewRadius = periscopeRadius + 2 * maxRadius;
  for (let sf of snowflakes) {
    let shouldDraw = true;
    if (ENABLE_PERISCOPE) {
      const dx = sf.x - WIDTH / 2;
      const dy = sf.y - HEIGHT / 2;
      if (dx * dx + dy * dy > inViewRadius * inViewRadius) {
        shouldDraw = false;
      }
    }

    if (shouldDraw) {
      sf.draw();
      const wind = getWindFromPos(sf.x, sf.y, frameCount);
      if (sf.r > 14 && wind.mag() > 3) {
        drawBlow(sf.x + 2 * wind.x, sf.y + 2 * wind.y, sf.x, sf.y, WIDTH, HEIGHT, AREA / 24, 8, 0);
      }
      sf.update(wind, maxRadius, noiseScale);
    } else {
      const wind = getWindFromPos(sf.x, sf.y, frameCount);
      sf.update(wind, maxRadius, noiseScale);
    }
  }

  // Apply fast blur to windMask
  windMask.loadPixels();
  const blurred = fastBlur(windMask.pixels, windMask.width, windMask.height, 1);
  windMask.pixels.set(blurred);
  windMask.updatePixels();

  drawWindMask(WIDTH, HEIGHT, windMask);

  // Audio volume handling
  // Update window.audioVolume for UI classes
  window.audioVolume = audioVolume;
  window.jazzAmbiance = jazzAmbiance; // Ensure this is available
  window.noiseScale = noiseScale;
  window.noiseSampleRate = noiseSampleRate;

  if (jazzAmbiance && jazzAmbiance.isLoaded()) {
    const shouldPlay = musicBtn.isToggled || mouseIsPressed;
    let targetVolume = shouldPlay ? 1 : 0;
    const decayRate = shouldPlay ? 1 : 5;
    let rampSpeed = 1 / (targetFrameRate * decayRate * audioRampDuration);



    if (audioVolume < targetVolume) {
      audioVolume = Math.min(audioVolume + rampSpeed, targetVolume);
    } else if (audioVolume > targetVolume) {
      audioVolume = Math.max(audioVolume - rampSpeed, targetVolume);
    }

    jazzAmbiance.setVolume(audioVolume);

    if (audioVolume <= 0 && jazzAmbiance.isPlaying()) {
      jazzAmbiance.stop();
    }
  }

  if (ENABLE_PERISCOPE) {
    // Only draw blow ring every 8 seconds
    const numSteps = 16;
    // const framesUntilNextRing = targetFrameRate * 2;
    const framesUntilNextRing = numSteps;
    const remainder = (frameCount - framePeriscopeToggled) % framesUntilNextRing;
    const freq = (Math.sin(frameCount / targetFrameRate) + 1) / 2;

    const cond = remainder < numSteps;
    // const cond = true;
    if (cond) {
      drawBlowRing(WIDTH / 2, HEIGHT / 2, periscopeRadius, freq * periscopeVignetteRadius / 3, numSteps, numSteps, remainder);
    }
  }


  // Draw periscope
  if (ENABLE_PERISCOPE && periscopeImg) {
    // push();
    // tint(globalColors.bg);
    // image(periscopeImg, WIDTH / 2, HEIGHT / 2);
    // pop();
    drawPeriscope(WIDTH, HEIGHT, periscopeImg, globalColors.bg);
  }

  menuBtn.draw();
  menuBtn.checkHover(mouseX, mouseY);

  if (
    menuBtn.isHovered ||
    debugBtn.isHovered ||
    musicBtn.isHovered ||
    chaosBtn.isHovered ||
    pauseBtn.isHovered ||
    paletteBtn.isHovered ||
    periscopeBtn.isHovered
  ) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }


  if (DEBUG) {
    drawDebug();
  }
  // drawBloom(WIDTH, HEIGHT);

  frameCount++;
}


let fpsBuffer = new Float32Array(30);
let fpsIndex = 0;
let fpsCount = 0;

function drawDebug() {
  // show fps
  push();
  translate(0, 0);
  noStroke();
  textSize(22);
  fill('yellow');

  const currentFps = frameRate();
  fpsBuffer[fpsIndex] = currentFps;
  fpsIndex = (fpsIndex + 1) % fpsBuffer.length;
  if (fpsCount < fpsBuffer.length) fpsCount++;

  let sum = 0;
  for (let i = 0; i < fpsCount; i++) {
    sum += fpsBuffer[i];
  }
  const avgFps = sum / fpsCount;

  text(`FPS: ${round(avgFps)}`, 6, 22);
  pop();

  // show wind field
  const wHeight = HEIGHT / windDebugY;
  for (let j = 0; j < windDebugY; j++) {
    const wy = j * wHeight;
    const wWidth = WIDTH / windDebugX;
    for (let i = 0; i < windDebugX; i++) {
      const wx = i * wWidth;
      push();
      translate(wx, wy);
      noFill();
      stroke("green");
      strokeWeight(1);
      rect(0, 0, wWidth, wHeight);
      push();
      translate(wWidth / 2, wHeight / 2);
      const windSize = wHeight / 12;
      strokeWeight(Math.max(1, windSize / 2));
      const localWind = getWindFromPos((i + 0.5) * wWidth, (j + 0.5) * wHeight, frameCount);
      const xScaled = windSize * localWind.x;
      const yScaled = windSize * localWind.y;
      line(0, 0, xScaled, yScaled);
      pop();
      pop();
    }
  }
}


function saveImg() {
  saveCanvas(CNV, 'myCanvas', 'png');
}

function pauseDraw() {
  if (isLooping() === true) {
    noLoop();
    // saveImg();
  } else {
    loop();
  }
}


function mousePressed() {
  // Ensure AudioContext is running (browser autoplay policy)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }

  // Check for menu and child button clicks (delegated)
  if (menuBtn.checkClick(mouseX, mouseY)) {
    return;
  }

  if (jazzAmbiance && jazzAmbiance.isLoaded()) {

    // Only start if we are fully decayed/stopped
    if (audioVolume <= 0) {
      jazzAmbiance.loop(0, 1, 0, random(jazzAmbiance.duration()));
    }
    // Volume ramp is handled in draw()
  }
}

function mouseReleased() {
  // Volume ramp down is handled in draw() based on mouseIsPressed
}

function keyPressed() {
  if (key === '`') {
    if (chaosBtn.isToggled === menuBtn.isToggled) chaosBtn.onClick();
    if (paletteBtn.isToggled === menuBtn.isToggled) paletteBtn.onClick();
    if (periscopeBtn.isToggled === menuBtn.isToggled) periscopeBtn.onClick();
    if (pauseBtn.isToggled === menuBtn.isToggled) pauseBtn.onClick();
    if (musicBtn.isToggled === menuBtn.isToggled) musicBtn.onClick();
    if (debugBtn.isToggled === menuBtn.isToggled) debugBtn.onClick();
    menuBtn.onClick();
  } else if (key === ' ') {
    menuBtn.onClick();
  } else if (key === '1' || key === 'r') {
    chaosBtn.onClick();
  } else if (key === '2' || key === 'c') {
    paletteBtn.onClick();
  } else if (key === '3' || key === 'o') {
    periscopeBtn.onClick();
  } else if (key === '4' || key === 'p') {
    pauseBtn.onClick();
  } else if (key === '5' || key === 'm') {
    musicBtn.onClick();
  } else if (key === '6' || key === 'd') {
    debugBtn.onClick();
  }
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
window.mousePressed = mousePressed;
window.mouseReleased = mouseReleased;
window.keyPressed = keyPressed;
window.touchStarted = touchStarted;
window.touchMoved = touchMoved;

function touchStarted() {
  mousePressed();
  return false;
}

function touchMoved() {
  return false;
}