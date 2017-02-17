var canvas;

// setup
function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', -1);
  // Create object
  scale = 2;//floor(random(4)) + 1;
  thickness = 3;//floor(random(4)) + 1;
  walkers = new Walkers();
  buildWalkers(walkers, 50);
	background(180);
}

// build array of n walkers
var buildWalkers = function(obj, n) {
  var choice = floor(random(3));
  for (var i = 0; i < n; i++) {
    var w = new Walker(choice);
    append(obj.members, w);
  }
}

// draw
function draw() {
  walkers.step();
  walkers.display();

}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(180);
  walkers.reset();
}


function Walkers() {
  this.members = [];

  this.display = function() {
    for (var i = 0; i < this.members.length; i++) {
      this.members[i].display();
    }
  }

  this.step = function() {
    for (var i = 0; i < this.members.length; i++) {
      this.members[i].flourish(scale);
    }
  }

  this.reset = function() {
    for (var i = 0; i < this.members.length; i++) {
      this.members[i].x = width / 2;
      this.members[i].y = height / 2;
    }
  }
}

// object depicting a random walk
function Walker(choice) {
	this.x = width / 2;//modulus(floor(random(width)) * scale + scale / 2, width);
  this.y = height / 2;//modulus(floor(random(height)) * scale + scale / 2, height);
  this.color = 0;
  this.inc = true;
  this.justChanged = false;
  this.choice = choice;
	this.rand1 = random(255);
	this.rand2 = random(255);

	this.display = function() {

		strokeWeight(thickness);
    switch(this.choice) {
    	case 0:
        stroke(this.color, this.rand1, this.rand2, 120);
        break;
      case 1:
        stroke(this.rand1, this.color, this.rand2, 120);
        break;
      case 2:
        stroke(this.rand1, this.rand2, this.color, 120);
        break;
    }

		point(this.x, this.y);
	}

	this.step = function() {

		var choice = Math.floor(Math.random() * 24);

    if (mouseIsPressed) {
      this.flourish(scale);
    }
    else {
      switch(choice) {
        case 0, 1:
    	  	this.x = modulus((this.x + scale), width);
    		  break;
        case 2, 3:
      	  this.x = modulus((this.x - scale), width);
          break;
        case 4, 5:
        	this.y = modulus((this.y + scale), height);
          break;
        case 6, 7:
      	  this.y = modulus((this.y - scale), height);
          break;
        case 23:
          this.gravitate();
          break;
      }
    }

    if (this.color < 0) {
    	this.inc = true;
    }
    else if (this.color > 255) {
    	this.inc = false;
    }

    if (!this.justChanged && this.inc) {
			this.color++; // = modulus(this.color + 1, 255);
    }
    else if (!this.justChanged && !this.inc) {
    	this.color--; // = 255 - modulus(this.color + 1, 255);
    }

    this.justChanged = !this.justChanged;
  }

  this.flourish = function(amt) {

    /*
    var dist = createVector(mouseX - this.x, mouseY - this.y);
    var normal = dist.div(dist.mag());
    normal.x = floor(normal.x);
    normal.y = floor(normal.y);
    dir = normal.mult(amt);
    */

    this.x = this.x + round(random(-1, 1)) * amt;
    this.y = this.y + round(random(-1, 1)) * amt;

    if (this.color < 0) {
      this.inc = true;
    }
    else if (this.color > 255) {
      this.inc = false;
    }

    if (!this.justChanged && this.inc) {
      this.color++; // = modulus(this.color + 1, 255);
    }
    else if (!this.justChanged && !this.inc) {
      this.color--; // = 255 - modulus(this.color + 1, 255);
    }

    this.justChanged = !this.justChanged;

/*
    if (this.x < mouseX) {
      if (this.y < mouseY) {
        this.x = modulus(this.x + dir.x, width);
        this.y = modulus(this.y + dir.y, height);
      }
      else {
        this.x = modulus(this.x + dir.x, width);
        this.y = modulus(this.y - dir.y, height);
      }
    }
    else {
      if (this.y < mouseY) {
        this.x = modulus(this.x - dir.x, width);
        this.y = modulus(this.y + dir.y, height);
      }
      else {
        this.x = modulus(this.x - dir.x, width);
        this.y = modulus(this.y - dir.y, height);
      }
    }
    */
  }

  this.gravitate = function() {

    var dist = createVector(mouseX - this.x, mouseY - this.y);
    var normal = createVector(0, 0);

    if (dist.x > dist.y) {
      if (this.x > mouseX) {
        normal.x = -1;
        normal.y = 0;
      }
      else if (this.x < mouseX) {
        normal.x = 1;
        normal.y = 0;
      }
      else {
        normal.x = 0;
        normal.y = 0;
      }
    }
    else if (dist.x < dist.y) {
      if (this.y > mouseY) {
        normal.x = 0;
        normal.y = -1;
      }
      else if (this.y < mouseY) {
        normal.x = 0;
        normal.y = 1;
      }
      else {
        normal.x = 0;
        normal.y = 0;
      }
    }
    else {
      normal.x = 0;
      normal.y = 0;
    }

    /*
    var normal = dist.div(dist.mag());
    if
    normal.x = floor(normal.x);
    normal.y = floor(normal.y);
    dir = normal.mult(scale);
    */

    this.x += normal.x * scale;
    this.y += normal.y * scale;
  }
}


// because js only has a remainder function build in ? ? ?
function modulus(arg, mod) {
  if (arg >= 0) {
    return arg % mod;
  }
  else {
    return modulus(mod + arg, mod);
  }
}
