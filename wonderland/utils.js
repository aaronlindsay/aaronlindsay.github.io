/**
 * Applies a fast blur effect to pixel data using a 3-pass box blur algorithm,
 * which approximates a Gaussian blur.
 *
 * @param {Uint8ClampedArray|Array} pixels - The pixel data (r, g, b, a).
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {number} radius - The blur radius.
 * @returns {Uint8ClampedArray} - The blurred pixel data.
 */
export function fastBlur(pixels, width, height, radius) {
    // Ensure dimensions are integers
    width = Math.floor(width);
    height = Math.floor(height);

    // Create a copy of the pixels to avoid modifying the original array in place immediately
    // and to serve as the source for the first pass.
    let src = new Uint8ClampedArray(pixels);
    let dest = new Uint8ClampedArray(pixels.length);

    // 3 passes of box blur approximates a Gaussian blur
    boxBlur(src, dest, width, height, radius);
    boxBlur(dest, src, width, height, radius);
    boxBlur(src, dest, width, height, radius);

    return dest;
}

/**
 * Performs a single pass of box blur (horizontal and vertical).
 */
function boxBlur(src, dest, width, height, radius) {
    const length = src.length;
    // Create a temporary array for the horizontal pass result
    // We can reuse 'dest' for the horizontal pass, then blur 'dest' vertically into 'dest' (or back to src? no, we need a temp buffer or careful management)
    // To keep it simple and correct:
    // H-blur src -> temp
    // V-blur temp -> dest

    // However, to save memory, we can try to do it in place if careful, but standard way is 2 passes.
    // Let's use a temporary buffer for the intermediate step.
    const temp = new Uint8ClampedArray(length);

    boxBlurH(src, temp, width, height, radius);
    boxBlurV(temp, dest, width, height, radius);
}

/**
 * Horizontal box blur.
 */
function boxBlurH(src, dest, width, height, radius) {
    for (let i = 0; i < height; i++) {
        // Initial window setup
        const li = i * width;

        // We need to handle the boundary conditions.
        // A sliding window approach:

        // Calculate initial sum for the first pixel
        // Range: [0 - radius, 0 + radius]
        // Clamped to [0, width-1]

        let r = 0, g = 0, b = 0, a = 0;
        let hits = 0;

        // Pre-fill the window for the first pixel (column 0)
        for (let x = -radius; x <= radius; x++) {
            let px = Math.min(width - 1, Math.max(0, x));
            let idx = (li + px) * 4;
            r += src[idx];
            g += src[idx + 1];
            b += src[idx + 2];
            a += src[idx + 3];
            hits++;
        }

        for (let x = 0; x < width; x++) {
            // Output the average
            let outIdx = (li + x) * 4;
            dest[outIdx] = r / hits;
            dest[outIdx + 1] = g / hits;
            dest[outIdx + 2] = b / hits;
            dest[outIdx + 3] = a / hits;

            // Slide the window
            // Remove the leftmost pixel that is leaving the window
            let leftX = x - radius;
            let leftPx = Math.min(width - 1, Math.max(0, leftX));
            let leftIdx = (li + leftPx) * 4;

            // Add the rightmost pixel that is entering the window
            let rightX = x + radius + 1;
            let rightPx = Math.min(width - 1, Math.max(0, rightX));
            let rightIdx = (li + rightPx) * 4;

            r -= src[leftIdx];
            g -= src[leftIdx + 1];
            b -= src[leftIdx + 2];
            a -= src[leftIdx + 3];

            r += src[rightIdx];
            g += src[rightIdx + 1];
            b += src[rightIdx + 2];
            a += src[rightIdx + 3];
        }
    }
}

/**
 * Vertical box blur.
 */
function boxBlurV(src, dest, width, height, radius) {
    for (let i = 0; i < width; i++) {
        let r = 0, g = 0, b = 0, a = 0;
        let hits = 0;

        // Pre-fill window for the first pixel (row 0)
        for (let y = -radius; y <= radius; y++) {
            let py = Math.min(height - 1, Math.max(0, y));
            let idx = (py * width + i) * 4;
            r += src[idx];
            g += src[idx + 1];
            b += src[idx + 2];
            a += src[idx + 3];
            hits++;
        }

        for (let y = 0; y < height; y++) {
            let outIdx = (y * width + i) * 4;
            dest[outIdx] = r / hits;
            dest[outIdx + 1] = g / hits;
            dest[outIdx + 2] = b / hits;
            dest[outIdx + 3] = a / hits;

            let topY = y - radius;
            let topPy = Math.min(height - 1, Math.max(0, topY));
            let topIdx = (topPy * width + i) * 4;

            let bottomY = y + radius + 1;
            let bottomPy = Math.min(height - 1, Math.max(0, bottomY));
            let bottomIdx = (bottomPy * width + i) * 4;

            r -= src[topIdx];
            g -= src[topIdx + 1];
            b -= src[topIdx + 2];
            a -= src[topIdx + 3];

            r += src[bottomIdx];
            g += src[bottomIdx + 1];
            b += src[bottomIdx + 2];
            a += src[bottomIdx + 3];
        }
    }
}

const ua = navigator.userAgent.toLowerCase();
const isChrome = typeof window.chrome !== "undefined";
export const isSafari = !isChrome && ua.indexOf('safari') > -1;
