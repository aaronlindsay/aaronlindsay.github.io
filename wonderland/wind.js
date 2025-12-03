export let ambientWind;
let _reusableWind;
export const defaultNoiseScale = 8;
export const defaultNoiseSampleRate = 0.0025;
export let noiseScale = defaultNoiseScale;
export let noiseSampleRate = defaultNoiseSampleRate;

export const blowStrength = 6;
export let blowRange;
export let windMask;
export const windMaskScale = 1 / 32;
export let lastMouseP = null;

export function setAmbientWind(v) {
    ambientWind = v;
}

export function setBlowRange(r) {
    blowRange = r;
}

export function setNoiseScale(s) {
    noiseScale = s;
}

export function setNoiseSampleRate(s) {
    noiseSampleRate = s;
}

export function setLastMouseP(p) {
    lastMouseP = p;
}

export function getWindFromPos(x, y, frameCount, addSample = false) {
    const noiseX = noise(noiseSampleRate * frameCount + y / 1000) - 0.5;
    const noiseY = noise(noiseSampleRate * frameCount + x + 10000);

    // Reuse vector if available, otherwise create new (fallback/init)
    if (!_reusableWind) {
        _reusableWind = createVector(0, 0);
    }

    _reusableWind.set(noiseX, noiseY);
    _reusableWind.x *= noiseScale;
    _reusableWind.y *= noiseScale * Math.pow(noiseX, 2);

    _reusableWind.add(ambientWind);
    if (addSample) {
        const windSample = sampleWindMask(x, y);
        _reusableWind.x += windSample[0] / 32;
        _reusableWind.y += windSample[1] / 32;
    }
    return _reusableWind;
}

function getWindMaskIndex(x, y) {
    const windMaskX = constrain(floor(x * windMaskScale), 0, windMask.width - 1);
    const windMaskY = constrain(floor(y * windMaskScale), 0, windMask.height - 1);
    const windMaskIndex = (windMaskY + windMaskX * windMask.height) * 4;
    return windMaskIndex;
}

export function sampleWindMask(x, y) {
    const windMaskIndex = getWindMaskIndex(x, y);

    // Handle transparent pixels (browser might zero out RGB if Alpha is 0)
    if (windMask.pixels[windMaskIndex + 3] === 0) {
        return [0, 0];
    }

    let blowX = windMask.pixels[windMaskIndex] - 127;
    let blowY = windMask.pixels[windMaskIndex + 1] - 127;
    return [blowX, blowY];
}

export function cleanupWindResources() {
    if (windMask) {
        windMask.remove();
        windMask = null;
    }
}

export function createWindMask(width, height) {
    windMask = createGraphics(Math.floor(width * windMaskScale), Math.floor(height * windMaskScale));
    windMask.loadPixels();
    windMask.colorMode(RGB, 255, 255, 255, 255);
    windMask.blendMode(BLEND);
    windMask.pixelDensity(1);
    for (let i = 0; i < windMask.pixels.length; i += 4) {
        windMask.pixels[i] = 127;
        windMask.pixels[i + 1] = 127;
        windMask.pixels[i + 2] = 127;
        windMask.pixels[i + 3] = 0;
    }
    windMask.updatePixels();
}

export function blow(snowflakes, maxRadius, width, height, blowRange) {
    const mouseP = createVector(mouseX, mouseY);

    if (lastMouseP === null) {
        lastMouseP = mouseP;
        return false;
    }

    for (let sf of snowflakes) {
        sf.applyBlow(blowStrength, mouseP, lastMouseP, blowRange, maxRadius);
    }

    const scale = 2.2;
    drawBlow(mouseP.x, mouseP.y, lastMouseP.x, lastMouseP.y, width, height, blowRange, scale);

    lastMouseP = mouseP;
    return true;
}

export function drawBlow(mouseX, mouseY, lastMouseX, lastMouseY, width, height, blowRange, scale = 1, colorPerturbation = 0) {
    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;

    const minDimSize = Math.min(width, height);
    const factorX = 127 / minDimSize * scale;
    const factorY = 127 / minDimSize * scale;

    let pX = 0, pY = 0, pG = 0;
    if (colorPerturbation > 0) {
        pX = random(-colorPerturbation, colorPerturbation);
        pY = random(-colorPerturbation, colorPerturbation);
        pG = random(-colorPerturbation, colorPerturbation);
    }

    const dxMapped = Math.max(0, Math.min(255, 127 + dx * factorX + pX));
    const dyMapped = Math.max(0, Math.min(255, 127 + dy * factorY + pY));
    const greenChannel = Math.max(0, Math.min(255, 127 + pG));

    const distSq = dx * dx + dy * dy;
    const maxDistSq = width * width + height * height;
    const dNorm = distSq / maxDistSq;

    const a = Math.min(scale * 256 * 512 * dNorm, 255);
    windMask.stroke(dxMapped, greenChannel, dyMapped, a);

    const dNormMapped = dNorm * 0.92 + 0.08;

    windMask.strokeWeight(16 * dNormMapped * blowRange * windMaskScale);
    windMask.line(
        mouseX * windMaskScale,
        mouseY * windMaskScale,
        lastMouseX * windMaskScale,
        lastMouseY * windMaskScale
    );
}

export function drawBlowRing(x, y, radius, blowRange, scale = 1, numSteps = 16, drawStep = null) {
    const stepSize = 1 / numSteps;
    const width = windowWidth;
    const height = windowHeight;
    drawStep = drawStep % numSteps;

    // Draw all steps if drawStep is null, else only draw the specified step
    for (let i = 0; i < numSteps; i++) {
        if (drawStep !== null && i !== drawStep) {
            continue;
        }
        const p1 = (i - 1) * stepSize * Math.PI * 2;
        const p2 = i * stepSize * Math.PI * 2;
        const x1 = x + radius * Math.cos(p1);
        const y1 = y + radius * Math.sin(p1);
        const x2 = x + radius * Math.cos(p2);
        const y2 = y + radius * Math.sin(p2);
        drawBlow(x1, y1, x2, y2, width, height, blowRange, scale);
    }
}

export function fadeWindMask() {
    windMask.loadPixels();
    const fadeAmount = 0.0175;
    for (let i = 0; i < windMask.pixels.length; i += 4) {
        const target = 127;
        const currentR = windMask.pixels[i];
        const currentB = windMask.pixels[i + 2];
        const currentA = windMask.pixels[i + 3];

        const moveTowards = (current, target, fadeAmount) => {
            const shouldLerp = Math.abs(current - target) > 1 / fadeAmount;
            if (shouldLerp) {
                return lerp(current, target, fadeAmount);
            }
            if (current < target) {
                return current + 1;
            } else if (current > target) {
                return current - 1;
            }
            return current;
        };

        windMask.pixels[i] = moveTowards(currentR, target, fadeAmount);
        windMask.pixels[i + 2] = moveTowards(currentB, target, fadeAmount);
        windMask.pixels[i + 3] = moveTowards(currentA, 0, fadeAmount);
    }

    windMask.updatePixels();
}
