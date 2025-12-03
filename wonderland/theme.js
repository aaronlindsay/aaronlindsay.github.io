export let globalColors = {
    bg: "#000c12ff",
    flake1: "#ffffffee",
    flake2: "#8c9facaa",
    ui: "#ffffffff"
};

export const THEMES = [
    {
        name: "Midnight",
        bg: "#000f16ff",
        flake1: "#ffffffee",
        flake2: "#889caaaa",
        ui: "#ffffffff"
    },
    {
        name: "Sunset",
        bg: "#060013ff",
        flake1: "#ffeee9ee",
        flake2: "#bb717aaa",
        ui: "#ffe9e2eff"
    },
    {
        name: "Glacier",
        bg: "#001c1cff",
        flake1: "#e1feffee",
        flake2: "#0087cfaa",
        ui: "#e1feffff"
    },
    {
        name: "Forest",
        bg: "#041100ff",
        flake1: "#fffde3ee",
        flake2: "#ca9652bd",
        ui: "#fffbccff"
    },
    {
        name: "Silver and Gold",
        bg: "#212121ff",
        flake1: "#dbedfdee",
        flake2: "#e3d74bbd",
        ui: "#fffcdaff"
    },
    {
        name: "Princess",
        bg: "#3b0034ff",
        flake1: "#ffe3fdee",
        flake2: "#b073d6bd",
        ui: "#ffeafdff"
    },
];

export let currentThemeIndex = 0;
let isPreparingTheme = false;

export function changeTheme(snowflakes, index = currentThemeIndex + 1, onComplete) {
    currentThemeIndex = index % THEMES.length;
    const theme = THEMES[currentThemeIndex];

    console.log("Preparing theme:", theme.name);

    // Don't change globalColors yet!
    // Just start the background preparation
    prepareThemeAsync(theme, snowflakes, true, onComplete);
}

function prepareThemeAsync(nextTheme, snowflakes, useTimeLimit = true, onComplete) {
    if (isPreparingTheme || !snowflakes) return;
    isPreparingTheme = true;

    const oldFlake1 = globalColors.flake1;
    const oldFlake2 = globalColors.flake2;
    const newFlake1 = color(nextTheme.flake1);
    const newFlake2 = color(nextTheme.flake2);

    const oldBg = globalColors.bg;
    const newBg = color(nextTheme.bg);

    const total = snowflakes.length;
    let index = 0;
    const chunkSize = 64;
    const timeLimit = 16; // ms

    function processChunk() {
        const startTime = millis();
        let processed = 0;

        while (index < total) {
            if (useTimeLimit) {
                if (millis() - startTime >= timeLimit) break;
            } else {
                if (processed >= chunkSize) break;
            }

            const sf = snowflakes[index];
            sf.prepareRecolor(oldFlake1, oldFlake2, newFlake1, newFlake2);
            index++;
            processed++;
        }

        // Interpolate background color
        const progress = index / total;
        globalColors.bg = lerpColor(oldBg, newBg, progress);

        if (index < total) {
            requestAnimationFrame(processChunk);
        } else {
            finalizeThemeChange(nextTheme, snowflakes, onComplete);
        }
    }

    processChunk();
}

function finalizeThemeChange(theme, snowflakes, onComplete) {
    // Update global colors
    globalColors.bg = color(theme.bg);
    globalColors.flake1 = color(theme.flake1);
    globalColors.flake2 = color(theme.flake2);
    globalColors.ui = color(theme.ui);

    // Apply changes to all snowflakes instantly
    for (let sf of snowflakes) {
        sf.applyRecolor();
    }

    isPreparingTheme = false;
    console.log("Theme change complete!");

    if (onComplete) {
        onComplete();
    }
}
