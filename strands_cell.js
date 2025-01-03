class Cell {
  constructor(pos, gx, gy, size, letter) {
    this.pos = pos;
    this.gx = gx;
    this.gy = gy;
    this.size = size;
    this.letter = letter;  // The letter displayed by this cell
    
    // Additional attributes
    let halfSize = Math.floor(this.size / 2)
    this.c = this.pos.add(createVector(halfSize, halfSize));
    this.isSelected = false;
    this.isComplete = false;
    this.prevLetter = null;

    // Animation attributes
    this.frame = null;
  }

  triggerAnimation(frame, childFrameOffset) {
    if (this.prevLetter !== null) {
      let childFrame = frame + childFrameOffset;
      this.prevLetter.triggerAnimation(childFrame, childFrameOffset);
    }
    this.frame = frame;
  }

  animate() {
    let offsets = [1, 2, 3, 4, 5, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    let offset = 0;
    if (this.frame == offsets.length) {
      this.frame = null;
    } else if (this.frame !== null) {
      if (this.frame >= 0) {
        offset = offsets[this.frame];
      }
      this.frame += 1;
    }
    noStroke();
    ellipseMode(CENTER)
    circle(this.pos.x, this.pos.y, Math.floor(4 * this.size / 5) + offset);
  }

  connect(other) {
    if (this.isComplete || (this.isSelected && this !== other)) {
        // console.log('1', this, other)
      // do nothing
    } else if (this === other) {
        // console.log('2', this, other)
    //   this.completeAll();
    } else if (this.isAdjacent(other)) {
        // console.log('3', this, other)
      this.isSelected = true;
      this.prevLetter = other;
      this.frame = 1;
    } else {
        // console.log('4', this, other)
      // do nothing again
    }

    // this.isSelected = true;
    // this.prevLetter = other;
  }

  disconnect() {
    this.prevLetter = null;
    this.isSelected = false;
    this.isComplete = false;
  }
  
  disconnectAll() {
    if (this.prevLetter !== null) {
      this.prevLetter.disconnectAll();
    }
    this.disconnect();
  }

  complete() {
    this.isComplete = true;
    this.isSelected = false;
  }

  completeAll () {
    // console.log(this.prevLetter)
    if (this.prevLetter !== null) {
      this.prevLetter.completeAll();
    }
    this.complete();
    this.triggerAnimation(0, -4);
  }

  hasParent(other) {
    let tf = false;
    if (this.prevLetter !== null) {
      tf = this.prevLetter.hasParent(other);
    }
    tf = (this === other || tf);
    return tf
  }

  isAdjacent(other) {
    let tf = true;
    if (other !== null) {
      let dx = Math.abs(other.gx - this.gx);
      let dy = Math.abs(other.gy - this.gy);

      // Adjacent if both horizontal and vertical displacement are <= 1
      tf = (dx <= 1 && dy <= 1);
    }
    return tf;
  }

  getGuess() {
    let guess = "";
    if (this.prevLetter !== null) {
      guess = this.prevLetter.getGuess();
    }
    guess += this.letter;
    return guess
  }

  getGuessCellCoords() {
    let cellCoords = [[this.gx, this.gy]];
    if (this.prevLetter !== null) {
      cellCoords = cellCoords.concat(this.prevLetter.getGuessCellCoords());
    }
    // cellCoords.concat([[this.gx, this.gy]])
    console.log('cellCoords', cellCoords)
    return cellCoords
  }

  // Draws the cell on the canvas
  drawBackdrop() {
    // Handle animations
    let offsets = [1, 2, 3, 4, 5, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    let offset = 0;
    if (this.frame == offsets.length) {
      this.frame = null;
    } else if (this.frame !== null) {
      if (this.frame >= 0) {
        offset = offsets[this.frame];
      }
      this.frame += 1;
    }

    // If the cell is selected, draw it with a highlight color
    let c;
    let co;
    let cOffset = 2 * offset;
    if (this.isSelected) {
      c = color(172, 220, 235);
      co = color(172 + cOffset, 220 + cOffset, 235 + cOffset); // Light highlight color
    //   fill(172, 220, 235); // Light highlight color
    //   stroke(172, 220, 235);
    } else if (this.isComplete) {
      c = color(250, 203, 6);
      co = color(250 + cOffset, 203 + cOffset, 6 + cOffset);
    //   fill(250, 203, 6);
    //   stroke(250, 203, 6);
    } else {
      c = color(255);
      co = color(255);
      noFill();           // Default background color
    }
    fill(co);
    stroke(c);
    // If the cell is connected, draw a connecting line
    if (this.prevLetter !== null) {
    //   console.log("Saw prevLetter")
      strokeWeight(Math.floor(this.size / 5 + offset / 3));
      line(this.pos.x, this.pos.y, this.prevLetter.pos.x, this.prevLetter.pos.y);
    }

    // Draw a circle backdrop
    noStroke();
    ellipseMode(CENTER)
    circle(this.pos.x, this.pos.y, Math.floor(4 * this.size / 5) + offset);
  }

  drawLetter() {
    // Draw the letter in the center of the cell
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(Math.floor(2 * this.size / 5));
    text(this.letter, this.pos.x, this.pos.y);
  }
}
