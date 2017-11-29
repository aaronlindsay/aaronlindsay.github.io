var cube = {};
cube.nodes =
[
  // zero
  //{x: 0, y: 0, z: 0},
  // corners
  {x: -127, y: -127, z: -127},
  {x: -127, y: -127, z: 127},
  {x: -127, y: 127, z: -127},
  {x: -127, y: 127, z: 127},
  {x: 127, y: -127, z: -127},
  {x: 127, y: -127, z: 127},
  {x: 127, y: 127, z: -127},
  {x: 127, y: 127, z: 127},
  // edges
  {x: -127, y: -127, z: 0},
  {x: -127, y: 0, z: -127},
  {x: -127, y: 127, z: 0},
  {x: -127, y: 0, z: 127},
  {x: 0, y: -127, z: -127},
  {x: 0, y: -127, z: 127},
  {x: 0, y: 127, z: -127},
  {x: 0, y: 127, z: 127},
  {x: 127, y: 0, z: -127},
  {x: 127, y: -127, z: 0},
  {x: 127, y: 0, z: 127},
  {x: 127, y: 127, z: 0},
  // faces
  {x: 0, y: 0, z: 127},
  {x: 0, y: 0, z: -127},
  {x: 0, y: -127, z: 0},
  {x: 0, y: 127, z: 0},
  {x: -127, y: 0, z: 0},
  {x: 127, y: 0, z: 0},
  // grays
  {x: -91, y: -91, z: -91},
  {x: -53, y: -53, z: -53},
  //{x: -17, y: -17, z: -17},
  //{x: 21, y: 21, z: 21},
  {x: 54, y: 54, z: 54},
  {x: 88, y: 88, z: 88},
];

cube.sortedNodes = [];

cube.edges =
[
  { begin: cube.nodes[0], end: cube.nodes[1] },
  { begin: cube.nodes[1], end: cube.nodes[3] },
  { begin: cube.nodes[3], end: cube.nodes[2] },
  { begin: cube.nodes[2], end: cube.nodes[0] },
  { begin: cube.nodes[4], end: cube.nodes[5] },
  { begin: cube.nodes[5], end: cube.nodes[7] },
  { begin: cube.nodes[7], end: cube.nodes[6] },
  { begin: cube.nodes[6], end: cube.nodes[4] },
  { begin: cube.nodes[0], end: cube.nodes[4] },
  { begin: cube.nodes[1], end: cube.nodes[5] },
  { begin: cube.nodes[2], end: cube.nodes[6] },
  { begin: cube.nodes[3], end: cube.nodes[7] },
  { begin: cube.nodes[2], end: cube.nodes[5] },
  { begin: cube.nodes[0], end: cube.nodes[7] },
  { begin: cube.nodes[3], end: cube.nodes[4] },
  { begin: cube.nodes[1], end: cube.nodes[6] },
];

var compactify = function(nodes, magnitude) {
  for (var n = 0; n < nodes.length; n++) {
    nodes[n].x = nodes[n].x / magnitude;
    nodes[n].y = nodes[n].y / magnitude;
    nodes[n].z = nodes[n].z / magnitude;
  }
}

var rotate3DZ = function(figure, theta){
  theta = -theta;
  for (var n = 0; n < figure.nodes.length; n++) {
    var x = figure.nodes[n].x;
    var y = figure.nodes[n].y;
    figure.nodes[n].x = x * Math.cos(theta) - y * Math.sin(theta);
    figure.nodes[n].y = y * Math.cos(theta) + x * Math.sin(theta);
  }
};

var rotate3DX = function(figure, theta){
  theta = -theta;
  for (var n = 0; n < figure.nodes.length; n++) {
    var y = figure.nodes[n].y;
    var z = figure.nodes[n].z;
    figure.nodes[n].y = y * Math.cos(theta) - z * Math.sin(theta);
    figure.nodes[n].z = z * Math.cos(theta) + y * Math.sin(theta);
  }
};

var rotate3DY = function(figure, theta){
  theta = -theta;
  for (var n = 0; n < figure.nodes.length; n++) {
    var x = figure.nodes[n].x;
    var z = figure.nodes[n].z;
    figure.nodes[n].x = x * Math.cos(theta) - z * Math.sin(theta);
    figure.nodes[n].z = z * Math.cos(theta) + x * Math.sin(theta);
  }
};

var rotate3DN = function(figure, theta, dx, dy, dz){
  theta = -theta;
  for (var n = 0; n < figure.nodes.length; n++) {
    var x = figure.nodes[n].x;
    var y = figure.nodes[n].y;
    var z = figure.nodes[n].z;
    var R = [
      [Math.cos(theta) + dx * dx * (1 - Math.cos(theta)),
        dx * dy * (1 - Math.cos(theta)) - dz * Math.sin(theta),
        dx * dz * (1 - Math.cos(theta)) + dy * Math.sin(theta)],
        [dy * dx * (1 - Math.cos(theta)) + dz * Math.sin(theta),
          Math.cos(theta) + dy * dy * (1 - Math.cos(theta)),
          dy * dz * (1 - Math.cos(theta)) - dx * Math.sin(theta)],
          [dz * dx * (1 - Math.cos(theta)) - dy * Math.sin(theta),
            dz * dy * (1 - Math.cos(theta)) + dx * Math.sin(theta),
            Math.cos(theta) + dz * dz * (1 - Math.cos(theta))]
          ];
          var newX = x * R[0][0] + y * R[0][1] + z * R[0][2];
          var newY = x * R[1][0] + y * R[1][1] + z * R[1][2];
          var newZ = x * R[2][0] + y * R[2][1] + z * R[2][2];
          figure.nodes[n].x = constrain(newX, -128, 128);
          figure.nodes[n].y = constrain(newY, -128, 128);
          figure.nodes[n].z = constrain(newZ, -128, 128);
        }
      };

      var sketchProc = function(p) {

        var backgroundColor;
        var nodeColor;
        var edgeColor;
        var nodeSize;

        p.mousePressed = function() {
          //brushstroke = !brushstroke;
          /*
          zRotation = Math.random(1000) / 50000;
          xRotation = Math.random(1000) / 50000;
          yRotation = Math.random(1000) / 50000;
          nRotation = Math.random(1000) / 50000;
          */
          isRotating = !isRotating;
        }

        p.setup = function() {
          backgroundColor = p.color(9,9,9);
          edgeColor = p.color(34, 68, 204);
          brushstroke = false;
          isRotating = true;
          zRotation = 0.004;
          xRotation = 0.008;
          yRotation = 0.006;
          nRotation = 0.01;

          p.frameRate(120);
          var canvas = p.createCanvas(600,600);
          canvas.parent('colorCube');
          p.textAlign(p.CENTER,p.CENTER);
          p.background(backgroundColor);
          tick = 0;
          rotate3DY(cube, Math.PI / 4);
          rotate3DZ(cube, Math.PI / 4);
        };

        // BEGIN Draw Loop

        p.draw = function(){
          if (!brushstroke && !p.mouseIsPressed) {
            p.background(backgroundColor);
          }
          p.translate(p.width/2, p.width/2);
          cube.sortedNodes = mergeSort(cube.nodes);
          compactify(cube.sortedNodes, .2 * Math.sin(Math.PI * tick / 50) + 1.2);

          tick++;
          /*
          p.stroke(edgeColor);
          for (n = 0; n < cube.edges.length; n++) {
          p.line(cube.edges[n].begin.x, cube.edges[n].begin.y, cube.edges[n].end.x, cube.edges[n].end.y);
        }
        */

        p.noStroke();
        for (var n = cube.sortedNodes.length - 1; n >= Math.floor((cube.sortedNodes.length - 1) / 2); n--) {
          p.fill(p.color(cube.sortedNodes[n].x + 127, -cube.sortedNodes[n].y + 127, cube.sortedNodes[n].z + 127));
          var nodeSize = ((cube.sortedNodes[n].z + 127) / 18) + 14;
          p.ellipse(cube.sortedNodes[n].x, cube.sortedNodes[n].y, nodeSize, nodeSize);
        }
        if (!brushstroke && !p.mouseIsPressed) {
          p.fill(32 * Math.sin(Math.PI * tick / 100) + 127, 32 * Math.sin(Math.PI * tick / 100) + 127, 32 * Math.sin(3 * (Math.PI * tick / 100) / 2) + 127);
          //p.textFont("Patagonia");
          p.textSize(20);
          p.textStyle(p.ITALIC);
          p.text("AARON", 0, -22);
          p.fill(32 * Math.sin(3 * (Math.PI * tick / 100) / 2) + 127, 32 * Math.sin(Math.PI * tick / 100) + 127, 32 * Math.sin(Math.PI * tick / 100) + 127);
          p.textSize(17);
          p.text("LINDSAY", 0, -6);
          p.fill(127, 127, 127);
          p.textSize(15);
          p.textStyle(p.BOLD);
          p.fill(-32 * Math.sin(Math.PI * tick / 100) + 112, -32 * Math.sin(Math.PI * tick / 100) + 112, -32 * Math.sin(Math.PI * tick / 100) + 112);
          p.text("DOT COM", 0, 8);
          p.textSize(22.5);
          p.textStyle(p.NORMAL);
          p.fill(32 * Math.sin(Math.PI * tick / 100) + 96, 32 * Math.sin(Math.PI * tick / 100) + 96, 32 * Math.sin(Math.PI * tick / 100) + 96);
          p.text("WEB.0", 0, 25);
          /*
          p.textSize(15.5);
          p.textStyle(p.BOLD);
          p.fill(-32 * Math.sin(Math.PI * tick / 50) + 80, -32 * Math.sin(Math.PI * tick / 50) + 80, -32 * Math.sin(Math.PI * tick / 50) + 80);
          p.text("DISRUPT", 0, 41);
          p.textSize(11);
          p.textStyle(p.BOLD);
          p.fill(32 * Math.sin(Math.PI * tick / 50) + 64, 32 * Math.sin(Math.PI * tick / 50) + 64, 32 * Math.sin(Math.PI * tick / 50) + 64);
          p.text("MAINFRAME", 0, 53);
          p.textSize(8.3);
          p.textStyle(p.BOLD);
          p.fill(-32 * Math.sin(Math.PI * tick / 50) + 48, -32 * Math.sin(Math.PI * tick / 50) + 48, -32 * Math.sin(Math.PI * tick / 50) + 48);
          p.text("MOTHERBOARD", 0, 63);
          */
        }
        for (var n = Math.floor((cube.sortedNodes.length - 1) / 2); n >= 0; n--) {
          p.fill(p.color(cube.sortedNodes[n].x + 127, -cube.sortedNodes[n].y + 127, cube.sortedNodes[n].z + 127));
          var nodeSize = ((cube.sortedNodes[n].z + 127) / 18) + 14;
          p.ellipse(cube.sortedNodes[n].x, cube.sortedNodes[n].y, nodeSize, nodeSize);
        }

        if (isRotating) {
          rotate3DZ(cube, zRotation);
          rotate3DX(cube, xRotation);
          rotate3DY(cube, yRotation);
          rotate3DN(cube, nRotation, 1, 1, 1);
        }

      };

      // END Draw Loop

    };

    function mergeSort(arr)
    {
      var newArr = [];
      for (var n = 0; n < arr.length; n++) {
        newArr.push(clone(arr[n]));
      }
      if (newArr.length < 2)
      return newArr;

      var middle = parseInt(newArr.length / 2);
      var left   = arr.slice(0, middle);
      var right  = arr.slice(middle, newArr.length);

      return merge(mergeSort(left), mergeSort(right));
    }

    function merge(left, right)
    {
      var result = [];

      while (left.length && right.length) {
        if (left[0].z >= right[0].z) {
          result.push(left.shift());
        } else {
          result.push(right.shift());
        }
      }

      while (left.length)
      result.push(left.shift());

      while (right.length)
      result.push(right.shift());

      return result;
    }

    function clone(obj) {
      var copy;

      // Handle the 3 simple types, and null or undefined
      if (null == obj || "object" != typeof obj) return obj;

      // Handle Date
      if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
      }

      // Handle Array
      if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
          copy[i] = clone(obj[i]);
        }
        return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
      }

      throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    function constrain(n, low, high) {
      if (n < low) {
        return low;
      }
      else if (n > high) {
        return high;
      }
      else
      return n;
    }

    new p5(sketchProc, document.getElementById("canvasContainer"));
