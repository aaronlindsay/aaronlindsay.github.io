const LERP_STRENGTH = 0.25;
import { globalColors } from './theme.js';
import { isSafari } from './utils.js';

export class UiButton {
    constructor(x, y, label, radius = 25, textScale = 40) {
        this.x = x;
        this.y = y;
        this.label = label;
        this.radius = radius;
        this.textScale = textScale;
        this.scale = 1;
        this.isToggled = false;
        this.isHovered = false;
        this.isVisible = true;
        // this.bgColor = color(globalColors.bg); // Default, will be overridden by global bgColor if available or passed in

        // this.animationStyle = "slide";
        this.animationStyle = "stagger";
        this.hiddenOffsetY = this.animationStyle === "stagger" ? 100 : 0;
        this.yOffset = this.hiddenOffsetY;
        this.yVelocity = 0;
        this.hiddenOffsetX = this.animationStyle === "slide" ? 100 : 0;
        this.xOffset = this.hiddenOffsetX;
        this.alpha = this.isVisible ? 255 : 0;
    }

    updateSpringPhysics(hiddenOffsetY = this.hiddenOffsetY) {
        this.hiddenOffsetY = hiddenOffsetY;
        const targetOffset = this.isVisible ? 0 : this.hiddenOffsetY;
        const springStrength = 0.08;
        const damping = 0.72;
        const force = (targetOffset - this.yOffset) * springStrength;
        this.yVelocity += force;
        this.yVelocity *= damping;
        this.yOffset += this.yVelocity;
    }

    updateSlidePhysics(hiddenOffsetX = this.hiddenOffsetX) {
        this.hiddenOffsetX = hiddenOffsetX;
        const targetOffset = this.isVisible ? 0 : this.hiddenOffsetX;
        this.xOffset = lerp(this.xOffset, targetOffset, LERP_STRENGTH);
    }

    draw() {
        if (this.animationStyle === "stagger") {
            this.updateSpringPhysics(this.hiddenOffsetY);
            if (
                !this.isVisible
                && Math.abs(this.yOffset - this.hiddenOffsetY) < 1
                && Math.abs(this.yVelocity) < 0.1
            ) return;
        } else if (this.animationStyle === "slide") {
            this.updateSlidePhysics();
            if (
                !this.isVisible
                && Math.abs(this.xOffset - this.hiddenOffsetX) < 1
            ) return;
        } else if (!this.isVisible) {
            return;
        }

        // Animate scale back to 1
        this.scale = lerp(this.scale, 1, 0.62);

        // Animate alpha
        const targetAlpha = this.isVisible ? 255 : 0;
        this.alpha = lerp(this.alpha, targetAlpha, 1.5 * LERP_STRENGTH);

        push();
        translate(this.x + this.xOffset, this.y + this.yOffset);
        scale(this.scale);
        textAlign(CENTER, CENTER);
        textSize(this.textScale);
        strokeWeight(3);

        // Prepare colors with alpha
        // Create a new color explicitly to avoid modifying the passed reference
        const bgWithAlpha = color(red(globalColors.bg), green(globalColors.bg), blue(globalColors.bg), this.alpha);
        const uiWithAlpha = color(red(globalColors.ui), green(globalColors.ui), blue(globalColors.ui), this.alpha);

        if (this.isToggled) {
            fill(uiWithAlpha);
            stroke(bgWithAlpha);
        } else {
            fill(bgWithAlpha);
            stroke(uiWithAlpha);
        }

        if (isSafari) text(this.label, 0, 0);
        else text(this.label, 0, this.radius / 16);
        pop();
    }

    checkHover(mx, my) {
        if (!this.isVisible) return false;
        const currentY = this.y + this.yOffset;
        // Ignore if significantly hidden
        if (this.yOffset > this.hiddenOffsetY * 0.5) return false;

        if (dist(mx, my, this.x, currentY) < this.radius) {
            this.isHovered = true;
            this.scale = lerp(this.scale, 0.92, 0.66);
            return true;
        } else {
            this.isHovered = false;
            this.scale = lerp(this.scale, 1, 0.66);
            return false;
        }
    }

    checkClick(mx, my) {
        if (!this.isVisible) return false;
        const currentY = this.y + this.yOffset;
        // Ignore if significantly hidden
        if (this.yOffset > this.hiddenOffsetY * 0.5) return false;

        if (dist(mx, my, this.x, currentY) < this.radius) {
            this.onClick();
            return true;
        }
        return false;
    }

    triggerBounce() {
        this.scale = 0.8;
    }

    onClick() {
        this.isToggled = !this.isToggled;
        this.triggerBounce();
    }
}

export class MusicUiButton extends UiButton {
    constructor(x, y, label, radius, textScale) {
        super(x, y, label, radius, textScale);
    }

    onClick() {
        super.onClick();

        // Access global variables from window object since they are defined in wonderland.js
        // Note: This assumes jazzAmbiance and audioVolume are available globally or attached to window
        if (this.isToggled && window.jazzAmbiance && window.jazzAmbiance.isLoaded()) {
            // Only start if we are fully decayed/stopped
            if (window.audioVolume <= 0) {
                window.jazzAmbiance.loop(0, 1, 0, random(window.jazzAmbiance.duration()));
            }
            // If volume > 0, the draw loop will handle ramping it back up
        }
    }
}

export class ChaosUiButton extends UiButton {
    constructor(x, y, label, radius, textScale, onToggle) {
        super(x, y, label, radius, textScale);
        this.onToggle = onToggle;
    }

    onClick() {
        super.onClick();
        if (this.onToggle) {
            this.onToggle(this.isToggled);
        }
    }
}

export class DebugUiButton extends UiButton {
    constructor(x, y, label, radius, textScale, onToggle) {
        super(x, y, label, radius, textScale);
        this.onToggle = onToggle;
    }

    draw() {
        this.y -= this.radius / 20;
        super.draw();
        this.y += this.radius / 20;
    }

    onClick() {
        super.onClick();
        if (this.onToggle) {
            this.onToggle(this.isToggled);
        }
    }
}

export class PauseUiButton extends UiButton {
    constructor(x, y, label, radius, textScale, onToggle) {
        super(x, y, label, radius, textScale);
        this.onToggle = onToggle;
        this.textScale = textScale
    }

    draw() {
        this.y -= this.radius / 18;
        super.draw();
        this.y += this.radius / 18;
    }

    onClick() {
        super.onClick();
        if (this.onToggle) {
            this.onToggle(this.isToggled);
        }
    }
}

export class PeriscopeUiButton extends UiButton {
    constructor(x, y, label, radius, textScale, onToggle) {
        super(x, y, label, radius, textScale);
        this.onToggle = onToggle;
    }

    onClick() {
        super.onClick();
        if (this.onToggle) {
            this.onToggle(this.isToggled);
        }
    }
}

export class PaletteUiButton extends UiButton {
    constructor(x, y, label, radius, textScale, onClickHandler) {
        super(x, y, label, radius, textScale);
        this.onClickHandler = onClickHandler;
        this.label = "✎";
    }

    draw() {
        this.y -= this.radius / 18;
        super.draw();
        this.y += this.radius / 18;
    }

    onClick() {
        super.onClick(); // Bounce
        // Toggle state doesn't matter much here, it's a trigger
        this.isToggled = false; // Reset toggle immediately
        if (this.onClickHandler) {
            this.onClickHandler();
        }
    }
}

export class MenuUiButton extends UiButton {
    constructor(x, y, label, radius, textScale, childButtons = [], childPaddingFactor = 0.25) {
        super(x, y, label, radius, textScale);
        this.childPadding = radius * childPaddingFactor;
        this.buttonSpacing = 2 * this.radius + this.childPadding;
        this.currentContainerWidth = this.buttonSpacing - this.childPadding / 2;
        this.currentContainerAlpha = 0;
        // this.animationStyle = "stagger";
        this.animationStyle = "slide";

        this.childButtons = [];
        if (childButtons && childButtons.length > 0) {
            childButtons.forEach(btn => this.addChild(btn));
        }
        this.rotation = 90;
        this.targetRotation = 90;

        this.hiddenOffsetY = 100;
        this.yOffset = 0;
        this.yVelocity = 0;
        this.isContainerExpanded = false;
    }

    addChild(btn) {
        this.childButtons.push(btn);
        this.updateChildPositions();
    }

    updateChildPositions() {
        const buttonSpacing = this.radius * 2 + this.childPadding;
        this.childButtons.forEach((btn, index) => {
            btn.x = this.x - (index + 1) * buttonSpacing;
            btn.y = this.y;

            // Slide setup
            btn.animationStyle = "slide";
            btn.hiddenOffsetX = this.x - btn.x;
            // Reset Y offset since we are sliding horizontally
            btn.yOffset = 0;
            btn.hiddenOffsetY = 0;

            // Only reset xOffset if it's not already animating (optional, but good for init)
            // Actually, we want it to start hidden.
            // If we reset it every time, it might jump. 
            // But updateChildPositions is usually called once or when adding children.
            // Let's set it.
            if (!btn.isVisible) {
                btn.xOffset = btn.hiddenOffsetX;
            }
        });
    }

    draw() {
        // skip drawing if hidden
        if (!this.isVisible) return;

        const numButtons = this.childButtons.length + 1;
        const maxTotalWidth = numButtons * this.buttonSpacing + this.childPadding / 2;
        const height = this.buttonSpacing - this.childPadding / 2;
        const minWidth = height; // Circle shape

        const targetWidth = this.isContainerExpanded ? maxTotalWidth : minWidth;
        this.currentContainerWidth = lerp(this.currentContainerWidth, targetWidth, LERP_STRENGTH);

        const targetContainerAlpha = this.isContainerExpanded ? 255 : 0;
        this.currentContainerAlpha = lerp(this.currentContainerAlpha, targetContainerAlpha, LERP_STRENGTH);

        // draw container
        if (this.animationStyle === "slide") {
            push();
            rectMode(CORNER);

            // Prepare container colors with alpha
            const containerBg = color(red(globalColors.bg), green(globalColors.bg), blue(globalColors.bg), map(this.currentContainerAlpha, 0, 255, 150, 210));
            // const containerStroke = color(255, 255, 255, this.currentContainerAlpha);
            const containerStroke = color(red(globalColors.ui), green(globalColors.ui), blue(globalColors.ui), 255);

            fill(containerBg);
            stroke(containerStroke);
            strokeWeight(1);

            const rightEdge = this.x + this.radius + this.childPadding / 4;
            const leftEdge = rightEdge - this.currentContainerWidth;
            const topEdge = this.y - this.radius - this.childPadding / 4;
            rect(leftEdge, topEdge, this.currentContainerWidth, height, 2 * this.radius);
            pop();
        }

        this.childButtons.forEach(btn => btn.draw());

        if (this.animationStyle === "stagger") {
            this.updateSpringPhysics(this.hiddenOffsetY);
            // if (!this.isVisible && Math.abs(this.yOffset - this.hiddenOffsetY) < 1 && Math.abs(this.yVelocity) < 0.1) return;
        }

        // Animate scale back to 1
        this.scale = lerp(this.scale, 1, LERP_STRENGTH);
        // Animate rotation
        this.rotation = lerp(this.rotation, this.targetRotation, LERP_STRENGTH);

        push();
        translate(this.x, this.y + this.yOffset);
        scale(this.scale);

        if (this.isToggled) {
            fill(globalColors.ui);
            stroke(globalColors.bg);
        } else {
            fill(globalColors.bg);
            stroke(globalColors.ui);
        }

        rotate(this.rotation);
        strokeWeight(3);
        textAlign(CENTER, CENTER);
        textSize(this.textScale);
        if (isSafari) text(this.label, 0, -this.radius / 100);
        else text(this.label, 0, this.radius / 20);
        pop();
    }

    onClick() {
        super.onClick();
        this.targetRotation = this.isToggled ? 180 : 90;

        if (this.animationStyle === "slide") {
            if (this.isToggled) {
                // OPENING
                this.isContainerExpanded = true;

                // Stagger Left to Right (Chaos -> Music -> Debug)
                const staggerDelay = 64;

                this.childButtons.forEach((btn, index) => {
                    const reverseIndex = this.childButtons.length - 1 - index;
                    const delay = reverseIndex * staggerDelay;
                    setTimeout(() => {
                        // console.log(`Opening: ${btn.label} (index ${index}) at ${delay}ms`);
                        btn.isVisible = true;
                    }, delay);
                });
            } else {
                // CLOSING
                // Stagger Right to Left (Debug -> Music -> Chaos)
                // Then shrink container
                const staggerDelay = 0;

                this.childButtons.forEach((btn, index) => {
                    const delay = index * staggerDelay;
                    setTimeout(() => {
                        // console.log(`Closing: ${btn.label} (index ${index}) at ${delay}ms`);
                        btn.isVisible = false;
                    }, delay);
                });

                // Shrink container after buttons are gone
                const totalDelay = this.childButtons.length * staggerDelay;
                setTimeout(() => {
                    this.isContainerExpanded = false;
                }, totalDelay);
            }
        } else {
            // Default / Stagger style
            if (this.isToggled) {
                this.childButtons.forEach((btn, index) => {
                    setTimeout(() => {
                        btn.isVisible = this.isToggled;
                    }, index * 32);
                });
            }
            else {
                this.childButtons.forEach((btn, index) => {
                    btn.isVisible = this.isToggled;
                });
            }
        }
    }

    clipToWidth(screenWidth, screenPadding) {
        const numButtons = this.childButtons.length + 1;
        const currentOpenedWidth = numButtons * this.buttonSpacing + this.childPadding / 2;
        const maxWidth = screenWidth - 2 * screenPadding;

        if (currentOpenedWidth > maxWidth) {
            const ratio = maxWidth / currentOpenedWidth;
            console.log(`Clipping menu width: ${currentOpenedWidth.toFixed(1)} -> ${maxWidth.toFixed(1)} (ratio: ${ratio.toFixed(3)})`);

            this.radius *= ratio;
            this.childPadding *= ratio;
            this.textScale *= ratio;
            this.buttonSpacing = 2 * this.radius + this.childPadding;

            // Update initial container width (closed state)
            this.currentContainerWidth = this.buttonSpacing - this.childPadding / 2;

            this.childButtons.forEach(btn => {
                btn.radius *= ratio;
                btn.textScale *= ratio;
            });

            this.updateChildPositions();
        }
    }

    checkHover(mx, my) {
        let handled = super.checkHover(mx, my);
        if (this.isToggled) {
            for (let btn of this.childButtons) {
                if (btn.checkHover(mx, my)) handled = true;
            }
        }
        return handled;
    }

    checkClick(mx, my) {
        if (super.checkClick(mx, my)) return true;
        if (this.isToggled) {
            for (let btn of this.childButtons) {
                if (btn.checkClick(mx, my)) return true;
            }
        }
        return false;
    }
}
