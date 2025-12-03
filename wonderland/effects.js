import { fastBlur } from './utils.js';

let grainImg;
const grainOffset = 20;

export function createGrainImg(width, height) {
    let grainImg = createImage(width + 2 * grainOffset, height + 2 * grainOffset);
    grainImg.loadPixels();
    for (let i = 0; i < grainImg.width; i++) {
        for (let j = 0; j < grainImg.height; j++) {
            // Random gray value
            const gray = random(100, 255);
            grainImg.set(i, j, color(gray, 255));
        }
    }
    grainImg.updatePixels();
    return grainImg;
}

export function drawFilmGrain(width, height, off = 20) {
    if (!grainImg) return;
    push();
    blendMode(SOFT_LIGHT);
    const xOffset = random(-off, off);
    const yOffset = random(-off, off);
    image(grainImg, width / 2 + xOffset, height / 2 + yOffset);
    pop();
}

export function createPeriscopeImg(width, height, radius, vignetteRadius = 0) {
    let img = createImage(width, height);
    img.loadPixels();

    const cx = width / 2;
    const cy = height / 2;

    // Pre-calculate squared distances to avoid sqrt in loop if possible, 
    // but for linear gradient we need sqrt.
    // Since this is run once, sqrt is fine.

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (x + y * width) * 4;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let alpha = 255;

            if (dist < radius - vignetteRadius) {
                alpha = 0;
            } else if (dist < radius) {
                // Interpolate from 0 to 255
                const t = (dist - (radius - vignetteRadius)) / vignetteRadius;
                // Use smoothstep for nicer transition: t * t * (3 - 2 * t)
                const smoothT = t * t * (3 - 2 * t);
                alpha = Math.floor(smoothT * 255);
            } else {
                alpha = 255;
            }

            img.pixels[idx] = 255;
            img.pixels[idx + 1] = 255;
            img.pixels[idx + 2] = 255;
            img.pixels[idx + 3] = alpha;
        }
    }

    img.updatePixels();

    const scale = 0.0625;
    img.resize(Math.floor(width * scale), Math.floor(height * scale));
    return img;
}

export function drawBloom(width, height) {
    // Bloom Effect
    // Create a copy of the finished canvas
    // Downscale for performance and to increase blur radius effectiveness
    const bloomScale = 0.25; // 0.125; // 1/8th scale
    const bloomRadius = 1;
    const bloomAlpha = 0.2; // Fraction of alpha channel values

    let bloomImg = get();
    bloomImg.resize(Math.floor(width * bloomScale), Math.floor(height * bloomScale));
    bloomImg.loadPixels();

    const blurredBloom = fastBlur(bloomImg.pixels, bloomImg.width, bloomImg.height, bloomRadius);
    bloomImg.pixels.set(blurredBloom);
    bloomImg.updatePixels();

    push();
    blendMode(ADD);
    tint(255, 255 * bloomAlpha);
    image(bloomImg, width / 2, height / 2, width, height);
    pop();
}

export function drawPeriscope(width, height, periscopeImg, bgColor) {
    push();
    // blendMode(MULTIPLY);
    blendMode(DARKEST);
    tint(bgColor);
    image(periscopeImg, width / 2, height / 2, width, height);
    pop();
}

export function drawWindMask(width, height, windMask) {
    push();
    blendMode(ADD);
    image(windMask, width / 2, height / 2, width, height);
    pop();
}