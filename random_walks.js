var canvas;

// preload assets
function preload () {
  me = loadImage("assets/me.jpg");
  megray = loadImage("assets/megray.jpg");

  /*
  image(black_king, this.square.posx - scale / 20,
                    this.square.posy - scale / 12,
                    black_king.width / 5, black_king.height / 5);
                    */
}

// setup
function setup() {
  //canvas = createCanvas(windowWidth, windowHeight);
  canvasSize = 256;
  canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent('random_walks');
  //canvas.position(0, 0);
  //canvas.style('z-index', -1);
  // Create object
  scaleOne = 2;//floor(random(4)) + 1;
  arrDim = 64;
  scaleTwo = canvasSize / arrDim;
  thickness = 3;//floor(random(4)) + 1;
  randomize = false;

  colorArr = [];
  /*
  var count = 0;
  for (var j = 0; j < arrDim; j++) {
    colorArr[j] = [];
    for (var i = 0; i < arrDim; i++) {
      //colorArr[j][i] = color(count, count, count);
      colorArr[j][i] = color(random(256),random(256),random(256));
      count++;
    }
  }
  */
  image(me, 0, 0);
  for (var j = 0; j < arrDim; j++) {
    colorArr[j] = [];
    for (var i = 0; i < arrDim; i++) {
      //colorArr[j][i] = color(count, count, count);
      var c = get(i, j);
      colorArr[j][i] = c;
    }
  }
  walkers = new Walkers();
  buildWalkers(walkers, 100);
	background(color(9,9,9));
}

// find appropriate color
var getColor = function(x, y) {
  var i = floor(x / (canvasSize / arrDim));
  var j = floor(y / (canvasSize / arrDim));
  if (i >= 0 && i < arrDim && j >= 0 && j < arrDim) {
    return colorArr[j][i];
  }
  else {
    return color(18,18,18,0);
  }
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

/*
  var rand = random(999);
  if ((randomize && rand < 25) || (!randomize && rand < 1)) {
      randomize = !randomize;
  }
  */

}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(180);
  walkers.reset();
}

mousePressed = function() {
  randomize = !randomize;
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
      this.members[i].flourish(scaleOne);
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
	this.x = modulus(floor(random(width)) * scaleOne + scaleOne / 2, width);//width / 2;//
  this.y = modulus(floor(random(height)) * scaleOne + scaleOne / 2, height);//height / 2;//
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
    var thisColor = getColor(this.x, this.y);

    if (!randomize && (distance(this.x, this.y, canvasSize / 2, canvasSize / 2) < canvasSize / 2 - 3)) {
      stroke(thisColor);
    }
    if (distance(this.x, this.y, canvasSize / 2, canvasSize / 2) > canvasSize / 2) {
      stroke(color(18,18,18,0));
    }

		point(this.x, this.y);
	}

	this.step = function() {

		var choice = Math.floor(Math.random() * 24);

    if (mouseIsPressed) {
      this.flourish(scaleOne);
    }
    else {
      switch(choice) {
        case 0, 1:
    	  	this.x = modulus((this.x + scaleOne), width);
    		  break;
        case 2, 3:
      	  this.x = modulus((this.x - scaleOne), width);
          break;
        case 4, 5:
        	this.y = modulus((this.y + scaleOne), height);
          break;
        case 6, 7:
      	  this.y = modulus((this.y - scaleOne), height);
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
    dir = normal.mult(scaleOne);
    */

    this.x += normal.x * scaleOne;
    this.y += normal.y * scaleOne;
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

// distance function
function distance(x1, y1, x2, y2) {
   var distance = Math.sqrt((Math.pow(x1 - x2, 2)) + (Math.pow(y1 - y2, 2)));
   return distance;
}
