import { WIDTH, HEIGHT, MIN_DIM_SIZE, DEBUG } from './wonderland.js';
import { globalColors } from './theme.js';

export function deg2rad(deg) {
  return (Math.PI / 180) * deg;
}

export class Snowflake {
  constructor(
    x = 0, y = 0, r = 0, v = createVector(0, 1), theta = 0, weight = 1, rotSpeed = 1, color = globalColors.flake1, color2 = globalColors.flake2
  ) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.v = v;
    this.theta = theta;
    this.weight = weight;
    this.rotSpeed = rotSpeed;
    this.color = color;
    this.color2 = color2;
    this.baseRotSpeed = rotSpeed;
    this.lowDetailThreshold = 2.5;
    this.g = null;
  }

  initRandom(maxRadius, maxRotSpeed = 2.5) {
    this.scaleToR(maxRadius);
    this.theta = random(0, 360);
    this.rotSpeed = random(-maxRotSpeed, maxRotSpeed);
    this.baseRotSpeed = this.rotSpeed;
  }

  setMinRotSpeed(minRotSpeed) {
    if (Math.abs(this.rotSpeed) < minRotSpeed) {
      // If the absolute value of the rotation speed is less than the minimum, set it to the minimum
      this.rotSpeed = this.rotSpeed < 0 ? -minRotSpeed : minRotSpeed;
    }
    this.baseRotSpeed = this.rotSpeed;
  }

  respawn() {
    const slope = Math.abs(this.v.x / this.v.y);

    const boundarySide = slope * (HEIGHT + this.r);
    const boundaryTop = WIDTH + 2 * this.r;
    const boundaryTotal = 2 * boundarySide + boundaryTop;
    const newPos = random(0, boundaryTotal);

    if (newPos < boundarySide) {
      this.x = -this.r;
      this.y = newPos / slope;
    }
    else if (newPos < boundarySide + boundaryTop) {
      this.x = newPos - boundarySide;
      this.y = -this.r;
    }
    else {
      this.x = WIDTH + this.r;
      this.y = (newPos - boundarySide - boundaryTop) / slope;
    }
  }

  scaleToR(maxRadius) {
    this.weight = floor(Math.max(1, this.r / 12));  // scale to r
  }

  update(wind, maxRadius, noiseScale) {
    if (!window.isPaused) {
      this.handleOutOfBounds();
      this.fall();
      this.settle(wind, maxRadius, noiseScale);
    }
    else {
      this.v.x *= 0.99;
      this.v.y *= 0.99;
    }
    this.spin();
  }

  fall() {
    this.x += this.v.x * Math.max(1, this.r / 8);
    this.y += this.v.y * Math.max(1, this.r / 8);
  }

  spin() {
    if (this.r > this.lowDetailThreshold) {
      this.theta += this.rotSpeed;
    }
  }

  settle(localWind, maxRadius, noiseScale) {
    const lerpAmt = 0.02 * Math.max(0.15, (this.r / maxRadius)) * localWind.mag() / noiseScale;
    this.v.lerp(localWind, lerpAmt);
    this.rotSpeed = lerp(this.rotSpeed, this.baseRotSpeed, 2 * lerpAmt);
  }

  applyBlow(blowStrength, mouseP, lastMouseP, range, maxRadius) {
    const dx = this.x - mouseP.x;
    const dy = this.y - mouseP.y;
    const distSq = dx * dx + dy * dy;
    const rangeSq = range * range;

    if (distSq < rangeSq) {
      const dist = Math.sqrt(distSq);
      const force = p5.Vector.sub(mouseP, lastMouseP).mult(blowStrength / MIN_DIM_SIZE);

      if (!window.isPaused) {
        const radiusScale = 0.9 * this.r / maxRadius + 0.1;
        this.v.add(p5.Vector.mult(force, radiusScale)); // scale to radius
      }

      // change spin
      const flakeP = createVector(this.x, this.y);
      const dTheta = p5.Vector.sub(flakeP, lastMouseP).angleBetween(
        p5.Vector.sub(flakeP, mouseP)
      );
      const dRotSpeed = dTheta * force.mag() * dist / range / 16;
      this.rotSpeed += dRotSpeed;

      if (DEBUG) {
        stroke("red");
        strokeWeight(Math.max(0.3, floor(this.r / 8)));
        line(mouseP.x, mouseP.y, this.x, this.y);
        noStroke();
      }
      return true; // affected
    }
    return false; // not affected
  }

  handleOutOfBounds() {
    const oobY = this.y > HEIGHT + this.r + 1 || this.y < -this.r - 1;
    const oobX = this.x > WIDTH + this.r + 1 || this.x < -this.r - 1;
    const oob = oobX || oobY;

    if (oob) {
      this.respawn();
    }
  }

  draw() {
    // draw graphic if at least low detail
    if (this.r > this.lowDetailThreshold && this.g) {
      const ctx = drawingContext;
      const rad = deg2rad(this.theta);
      const c = Math.cos(rad);
      const s = Math.sin(rad);

      // Apply transform: translate(x, y) -> rotate(theta)
      ctx.setTransform(c, s, -s, c, this.x, this.y);

      // Draw image centered
      // Accessing the underlying canvas of the p5.Image for drawImage
      ctx.drawImage(this.g.canvas, -this.g.width / 2, -this.g.height / 2);

      // Reset transform to identity
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // otherwise draw a circle
    else {
      noStroke();
      fill(this.color);
      circle(this.x, this.y, 2 * this.r);
    }
  }

  render() {
    throw new Error("Method 'render()' must be implemented by derived classes.")
  }

  recolor(oldC1, oldC2, newC1, newC2) {
    // Legacy direct recolor (unused now but kept for reference or fallback)
    if (!this.g) return;
    this.prepareRecolor(oldC1, oldC2, newC1, newC2);
    this.applyRecolor();
  }

  prepareRecolor(oldC1, oldC2, newC1, newC2) {
    if (!this.g) return;

    const w = this.g.width;
    const h = this.g.height;

    // Reuse swapBuffer if available and matching size
    if (this.swapBuffer && this.swapBuffer.width === w && this.swapBuffer.height === h) {
      this.nextG = this.swapBuffer;
    } else {
      this.nextG = createImage(w, h);
      this.nextG.loadPixels();
    }

    // this.nextG.loadPixels();

    // Optimization: Direct pixel copy if source is p5.Image
    // p5.Graphics doesn't have 'pixels' ready usually, and copy() handles density scaling.
    if (this.g instanceof p5.Image && !(this.g instanceof p5.Graphics)) {
      this.g.loadPixels();
      this.nextG.pixels.set(this.g.pixels);
    } else {
      // Fallback for p5.Graphics (first transition)
      this.nextG.copy(this.g, 0, 0, w, h, 0, 0, w, h);
      // Reload pixels after copy
      this.nextG.loadPixels();
    }

    // Use nextG dimensions for loop bounds (nextG is always density 1)
    const totalPixels = 4 * w * h;

    // Pre-calculate target RGB values (0-255)
    const old1 = [red(oldC1), green(oldC1), blue(oldC1)];
    const old2 = [red(oldC2), green(oldC2), blue(oldC2)];
    const new1 = [red(newC1), green(newC1), blue(newC1)];
    const new2 = [red(newC2), green(newC2), blue(newC2)];

    // Tolerance for matching
    const tolerance = 5;

    for (let i = 0; i < totalPixels; i += 4) {
      const r = this.nextG.pixels[i];
      const g = this.nextG.pixels[i + 1];
      const b = this.nextG.pixels[i + 2];
      const a = this.nextG.pixels[i + 3];

      if (a === 0) continue;

      if (Math.abs(r - old1[0]) < tolerance && Math.abs(g - old1[1]) < tolerance && Math.abs(b - old1[2]) < tolerance) {
        this.nextG.pixels[i] = new1[0];
        this.nextG.pixels[i + 1] = new1[1];
        this.nextG.pixels[i + 2] = new1[2];
      }
      else if (Math.abs(r - old2[0]) < tolerance && Math.abs(g - old2[1]) < tolerance && Math.abs(b - old2[2]) < tolerance) {
        this.nextG.pixels[i] = new2[0];
        this.nextG.pixels[i + 1] = new2[1];
        this.nextG.pixels[i + 2] = new2[2];
      }
    }
    this.nextG.updatePixels();

    this.nextColor = newC1;
    this.nextColor2 = newC2;
  }

  applyRecolor() {
    if (this.nextG) {
      const oldG = this.g;
      this.g = this.nextG;
      this.nextG = null;

      // If oldG was a p5.Graphics, destroy it.
      // If it was a p5.Image, save it as swapBuffer for reuse.
      if (oldG) {
        if (oldG instanceof p5.Image && !(oldG instanceof p5.Graphics)) {
          this.swapBuffer = oldG;
        } else if (typeof oldG.remove === 'function') {
          oldG.remove();
          this.swapBuffer = null; // Can't reuse Graphics as Image buffer easily
        }
      }
    }
    if (this.nextColor) {
      this.color = this.nextColor;
      this.color2 = this.nextColor2;
      this.nextColor = null;
      this.nextColor2 = null;
    }
  }

  destroy() {
    if (this.g) {
      if (typeof this.g.remove === 'function') this.g.remove();
      this.g = null;
    }
    if (this.nextG) {
      // nextG is likely an Image, so just null it. 
      // If it were Graphics, we'd remove it, but we switched to Image.
      // Just in case:
      if (typeof this.nextG.remove === 'function') this.nextG.remove();
      this.nextG = null;
    }
  }
}

export class SnowflakeV2 extends Snowflake {
  constructor(
    x = 0, y = 0, r = 0, v = createVector(0, 1), theta = 0, weight = 1, rotSpeed = 1,
    color = globalColors.flake1, color2 = globalColors.flake2
  ) {
    super(x, y, r, v, theta, weight, rotSpeed, color, color2);
    this.order = 6;
    this.angle = 360 / this.order;
    this.numMainBranches = 3;
    this.numSecondaryBranches = 2;
    this.mainBranchLengths = this.getRandomBranchLengths(this.numMainBranches);
    this.mainBranchWeights = this.getRandomBranchWeights(this.numMainBranches);
    this.secondaryBranchLengths = this.getRandomBranchLengths(this.numSecondaryBranches);
    this.secondaryBranchWeights = this.getRandomBranchWeights(this.numSecondaryBranches);
  }

  getRandomBranchLengths(numBranches, scale = 1) {
    let branchLengths = [];
    for (let j = 0; j < numBranches; j++) {
      let xPos = (j + 1) * this.r / (numBranches + 1);
      const branchLengthFloor = 0;
      let branchLength = scale * max(  // bias toward longer branches
        random(branchLengthFloor, xPos / 2),
        random(branchLengthFloor, xPos)
      );
      branchLengths.push(branchLength);
    }
    return branchLengths
  }

  getRandomBranchWeight(floor = 0) {
    return random(floor, this.r / 14);
  }

  getRandomBranchWeights(numBranches) {
    let branchWeights = [];
    for (let j = 0; j < numBranches; j++) {
      let branchWeight = this.getRandomBranchWeight(0);
      branchWeights.push(branchWeight);
    }
    return branchWeights
  }

  scaleToR(maxRadius) {
    super.scaleToR(maxRadius);
    this.numMainBranches = Math.max(
      1, Math.floor(random(this.r / 16, this.r / (4 + this.r / 8)))
    );
    this.numSecondaryBranches = Math.floor(random(this.r / 24, this.r / (8 + this.r / 8)));
    this.mainBranchLengths = this.getRandomBranchLengths(this.numMainBranches);
    this.mainBranchWeights = this.getRandomBranchWeights(this.numMainBranches);
    this.secondaryBranchLengths = this.getRandomBranchLengths(this.numSecondaryBranches);
    this.secondaryBranchWeights = this.getRandomBranchWeights(this.numSecondaryBranches);
  }

  render() {
    angleMode(DEGREES);
    const mainMaxLastBranchPos = this.numMainBranches * this.r / (this.numMainBranches + 1);
    const secondaryMaxLastBranchPos = this.numSecondaryBranches * this.r / (this.numSecondaryBranches + 1);

    // max radial distance of branches
    const mainMaxR = 4 * mainMaxLastBranchPos * cos(this.angle / 2);
    const secondaryMaxR = 4 * secondaryMaxLastBranchPos * cos(this.angle / 2);

    // set graphics to smallest necessary size
    const graphicsSize = Math.max(1, Math.ceil(2 * this.r), mainMaxR, secondaryMaxR);

    // Use temporary graphics for drawing
    let pg = createGraphics(graphicsSize, graphicsSize);
    pg.angleMode(DEGREES);

    pg.push();
    pg.translate(pg.width / 2, pg.height / 2);

    // Draw secondary arms
    this.renderLimbs(
      pg,
      this.color2, this.angle / 2,
      this.numSecondaryBranches,
      this.secondaryBranchLengths,
      this.secondaryBranchWeights
    )
    // Draw main limbs
    this.renderLimbs(
      pg,
      this.color, 0,
      this.numMainBranches,
      this.mainBranchLengths,
      this.mainBranchWeights
    )
    pg.pop();

    // Save as lightweight image
    if (this.g && typeof this.g.remove === 'function') this.g.remove();
    this.g = pg.get();
    this.g.loadPixels(); // Pre-load pixels for fast read
    // this.g = createImage(graphicsSize, graphicsSize);
    // this.g.loadPixels(); // Pre-load pixels for fast read
    // this.g.copy(pg, 0, 0, graphicsSize, graphicsSize, 0, 0, graphicsSize, graphicsSize);
    // this.g.updatePixels();

    // Pre-allocate swap buffer for fast write during first transition
    // This increases initial memory usage but ensures the first theme change is instant
    if (this.swapBuffer && typeof this.swapBuffer.remove === 'function') this.swapBuffer.remove();
    this.swapBuffer = createImage(graphicsSize, graphicsSize);
    this.swapBuffer.loadPixels(); // Pre-load pixels for fast write

    // Cleanup heavy graphics
    pg.remove();
  }

  renderLimbs(pg, color, angle, numBranches, branchLengths, branchWeights) {
    pg.push()
    pg.strokeWeight(this.getRandomBranchWeight(this.weight));
    for (let i = 0; i < this.order; i++) {
      pg.rotate(this.angle);
      this.renderLimb(pg, color, angle, numBranches, branchLengths, branchWeights);
    }
    pg.pop();
  }

  renderLimb(pg, color, angle, numBranches, branchLengths, branchWeights) {
    pg.push();
    pg.noFill();
    pg.stroke(color);
    pg.rotate(angle);
    pg.line(0, 0, this.r, 0);

    for (let j = 0; j < numBranches; j++) {
      let xPos = (j + 1) * this.r / (numBranches + 1);
      let branchLength = branchLengths[j];
      pg.push()
      pg.translate(xPos, 0);
      pg.strokeWeight(branchWeights[j]);

      pg.push();
      pg.rotate(this.angle);
      pg.line(0, 0, branchLength, 0);
      pg.pop();

      pg.push();
      pg.rotate(-this.angle);
      pg.line(0, 0, branchLength, 0);
      pg.pop();
      pg.pop();
    }
    pg.pop();
  }
}

