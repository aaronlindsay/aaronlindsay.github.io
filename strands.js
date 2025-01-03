const cellSize = 50
const gw = 6;
const gh = 8;
const totalCells = gw * gh;
const boundarySize = 1;
const canvasSize = [
  (gw + 2 * boundarySize) * cellSize,
  (gh + 2 * boundarySize) * cellSize,
]
let grid = [];
let currentGuess = [];
let words = [
  "phoebe",
  "bridgers",
  "sid",
  "peter",
  "larry",
  "andy",
  "pasta",
  "fankyousarah"
];
let solutions = [];
let connectSound;
let completeSound;
let victorySound;
let path;
let frame = 0;

function preload() {
  connectSound = loadSound("assets/water_drip.mp3");
  completeSound = loadSound("assets/water_drip_little.mp3");
  victorySound = loadSound("assets/water_drop.mp3");
}

function isMouseOnGrid() {
  let borderSize = cellSize * boundarySize;
  return (
    mouseX >= borderSize &&
    mouseX <= canvasSize[0] - borderSize &&
    mouseY >= borderSize &&
    mouseY <= canvasSize[1] - borderSize
  );
}

function canvasPressed() {
  let lastCell = null;
  if (currentGuess.length > 0) {
    lastCell = currentGuess[currentGuess.length - 1];
  }

  if (isMouseOnGrid()) {
    let cell = getCellAtPos(mouseX, mouseY);
    let hasParent = (lastCell !== null && lastCell.hasParent(cell))
    let isAdjacent = cell.isAdjacent(lastCell)

    let isSame = (cell === lastCell)
    if (cell.isComplete) {
      // do nothing
    } else if (isSame) {
      let foundMatch = checkCurrentGuess(cell);
      if (foundMatch) {
        cell.completeAll();
        currentGuess = [];
        completeSound.play();

        if (grid.every(c => c.isComplete)) {
          let min = -50;
          let max = -4;
          for (let c of grid) {
            let delay = Math.floor(Math.random() * (max - min + 1)) + min;
            c.frame = delay;
          }
          victorySound.play();
        }
      }
    } else if (!hasParent && isAdjacent) {
      console.log('connect')
      cell.connect(lastCell)
      currentGuess.push(cell);
      connectSound.play();
    }

    let foundMatch = checkCurrentGuess(cell);
  } else {
    if (currentGuess.length > 0) {
      lastCell = currentGuess[currentGuess.length - 1];
      lastCell.disconnectAll();
    }
    currentGuess = []
  }
}

function getCellIndex(gx, gy) {
  let index = gx + gy * gw;
  return index
}

function getCellAtIndex(gx, gy) {
  index = getCellIndex(gx, gy);
  return grid[index]
}

function getGridPosFromIndex(index) {
  let gx = index % gw;
  let gy = Math.floor(index / gw);
  return [gx, gy]
}

function getIndexFromPos(x, y) {
  let [gx, gy] = getGridPosFromPos(x, y);
  let index = getCellIndex(gx, gy);
  return index
}

function getGridPosFromPos(x, y) {
  let gx = floor(x / cellSize) - boundarySize;
  let gy = floor(y / cellSize) - boundarySize;
  return [gx, gy]
}

function getGridOrigin(gx, gy) {
  let x = (boundarySize + gx) * cellSize;
  let y = (boundarySize + gy) * cellSize;
  return createVector(x, y)
}

function getCellAtPos(x, y) {
  let [gx, gy] = getGridPosFromPos(x, y);
  let cell = getCellAtIndex(gx, gy);
  return cell
}

function getAdjacentCellsAtPos(x, y) {
  let cell = getCellAtPos(x, y);
  let gx = cell.gx;
  let gy = cell.gy;
  let adjacentCells = getAdjacentAtIndex(gx, gy);
  return adjacentCells
}


function getAdjacentCellsAtIndex(gx, gy) {
  adjacentIndices = getAdjacentIndices(gx, gy);
  const adjacentCells = [];

  for (const index of adjacentIndices) {
    adjacentCells.push(getCellAtIndex(index[0], index[0]))
  }

  return adjacentCells;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at indices i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getOrientation(p, q, r) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (val === 0) return 0; // Colinear
  return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
}

function doSegmentsIntersect(p1, p2, p3, p4) {
  // Check for shared endpoints
  if (arraysEqual(p1, p3) || arraysEqual(p1, p4) ||
      arraysEqual(p2, p3) || arraysEqual(p2, p4)) {
    return false; // Endpoint touching does not count as intersection
  }

  const o1 = getOrientation(p1, p2, p3);
  const o2 = getOrientation(p1, p2, p4);
  const o3 = getOrientation(p3, p4, p1);
  const o4 = getOrientation(p3, p4, p2);

  // General case: If the orientations differ
  return o1 !== o2 && o3 !== o4;
}

function findHamiltonianPath(adjacencyList, coordinates) {
  const vertices = [];
  for (let i = 0; i < adjacencyList.length; i++) {
    vertices.push(i);
  }
  const numVertices = vertices.length;
  const edges = [];

  shuffleArray(vertices);

  // test = doSegmentsIntersect([2, 0], [3, 1], [3, 0], [2, 1]);
  // console.log('Intersect test, should be true', test)

  // Helper function for backtracking
  function backtrack(path, visited) {
    // If the path includes all vertices, return the path
    if (path.length === numVertices) {
      return path.slice(); // Return a copy of the path
    }

    const lastVertex = path[path.length - 1];
    const neighbors = adjacencyList[lastVertex].slice();
    // shuffleArray(neighbors); // Randomize neighbor order

    // let shuffledNeighbors = shuffle(neighbors.slice());
    // for (const neighbor of shuffledNeighbors) {
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // Form the new segment
        const newSegment = [coordinates[lastVertex], coordinates[neighbor]];

        // Check for intersections with existing edges
        let intersects = false;
        for (const edge of edges) {
          if (doSegmentsIntersect(edge[0], edge[1], newSegment[0], newSegment[1])) {
            intersects = true;
            break;
          }
        }

        if (!intersects) {
          // Add the neighbor to the path
          path.push(neighbor);
          visited.add(neighbor);
          edges.push(newSegment);

          // Explore further
          const result = backtrack(path, visited);
          if (result) {
            return result; // Found a valid path
          }

          // Backtrack: Remove the last segment and vertex
          path.pop();
          visited.delete(neighbor);
          edges.pop();
        }
      }
    }

    // No valid path found from this vertex
    return null;
  }

  // Try starting from each vertex
  for (const startVertex of vertices) {
    const path = [startVertex];
    const visited = new Set([startVertex]);

    const result = backtrack(path, visited);
    if (result) {
      return result;
    }
  }

  console.log('No path found')
  // No Hamiltonian Path found
  return null;
}

function getAdjacentIndices(gx, gy) {
  const adjacentIndices = [];

  // Define the relative positions of all 8 possible adjacent cells
  const directions = [
    { dx: -1, dy: -1 }, // Top-Left
    { dx:  0, dy: -1 }, // Top
    { dx:  1, dy: -1 }, // Top-Right
    { dx: -1, dy:  0 }, // Left
    // { dx:  0, dy:  0 }, // Current Cell (excluded)
    { dx:  1, dy:  0 }, // Right
    { dx: -1, dy:  1 }, // Bottom-Left
    { dx:  0, dy:  1 }, // Bottom
    { dx:  1, dy:  1 }  // Bottom-Right
  ];

  // Iterate through each direction to find valid adjacent cells
  for (const direction of directions) {
    const newX = gx + direction.dx;
    const newY = gy + direction.dy;

    // Check if the new coordinates are within grid boundaries
    if (
      newX >= 0 &&
      newX < gw &&
      newY >= 0 &&
      newY < gh
    ) {
      adjacentIndices.push([newX, newY]);
    }
  }

  return adjacentIndices;
}

function checkCurrentGuess(cell) {
  let guess = cell.getGuess();
  let guessInWords = words.includes(guess);
  let wordIndex = words.indexOf(guess);
  let cellCoords = cell.getGuessCellCoords();
  const json1 = JSON.stringify(cellCoords);
  const json2 = JSON.stringify(solutions[wordIndex]);
  const reversedJson1 = JSON.stringify(cellCoords.slice().reverse());
  let cellCoordsCorrect = json1 === json2 || reversedJson1 === json2;
  console.log(cellCoords)
  console.log(solutions[wordIndex])

  let foundMatch = guessInWords && cellCoordsCorrect;
  console.log(guess)
  return foundMatch
}


function areNeighbors(pointA, pointB) {
  const dx = Math.abs(pointA[0] - pointB[0]);
  const dy = Math.abs(pointA[1] - pointB[1]);
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

function buildAdjacencyList(points, pairings) {
  function pairExists_WithReverse(parentArray, targetPair) {
    // Destructure the target pair for clarity
    const [a, b] = targetPair;
  
    // Iterate through each subarray in the parent array
    return parentArray.some(subarray => {
      // Ensure the current element is an array with exactly two elements
      if (!Array.isArray(subarray)) {
        console.warn("Encountered a non-array element. Skipping.");
        return false;
      }
  
      if (subarray.length !== 2) {
        console.warn("Encountered an array that does not have exactly two elements. Skipping.");
        return false;
      }
  
      // Destructure the subarray for comparison
      const [x, y] = subarray;
  
      // Check for both original and reversed order
      return (x === a && y === b) || (x === b && y === a);
    });
  }

  const adjacencyList = [];
  
  for (let i = 0; i < points.length; i++) {
    adjacencyList[i] = [];
    for (let j = 0; j < points.length; j++) {
      alreadyPaired = pairExists_WithReverse(pairings, [i, j]);
      // if (i !== j && areNeighbors(points[i], points[j]) && !alreadyPaired) {
      if (i !== j && areNeighbors(points[i], points[j])) {
        adjacencyList[i].push(j);
      }
    }
  }
  
  return adjacencyList;
}

function generateGrid() {
  let letters = "";
  let wordLengths = [];
  for (let word of words) {
    const shouldReverse = Math.random() < 0.5;
    word_ = shouldReverse ? word.split('').reverse().join('') : word;
    letters += word_;
    wordLengths.push(word.length);
  }

  let coordinates = [];
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      coordinates.push([gx, gy]);
    }
  }

  // for (let i = coordinates.length - 1; i > 0; i--) {
  //   // Generate a random index from 0 to i
  //   let j = Math.floor(Math.random() * (i + 1));
  //   // Swap elements array[i] and array[j]
  //   [coordinates[i], coordinates[j]] = [coordinates[j], coordinates[i]];
  // }

  let adjacencyList = buildAdjacencyList(coordinates, []);
  path = findHamiltonianPath(adjacencyList, coordinates);

  let curLetter = 0;
  let curWord = 0;
  let wordSolution = [];
  for (let i = 0; i < path.length; i++) {
    console.log('path[i]', path[i])
    let [gx, gy] = getGridPosFromIndex(path[i]);
    let o = getGridOrigin(gx, gy);
    c = new Cell(o, gx, gy, cellSize, letters.charAt(i));
    grid.push(c);
    wordSolution.push([gx, gy]);
    console.log('wordSolution', wordSolution)
    curLetter += 1;
    if (curLetter == words[curWord].length) {
      curLetter = 0;
      curWord += 1;
      solutions.push(wordSolution);
      wordSolution = [];
    }
    console.log('solutions', solutions)
  }

  grid.sort((a, b) => {
    const valueA = getCellIndex(a.gx, a.gy);
    const valueB = getCellIndex(b.gx, b.gy);
    return valueA - valueB; // Ascending order
  });
}

function setup() {
  let canvas = createCanvas(canvasSize[0], canvasSize[1]);
  canvas.mousePressed(canvasPressed);
  words = words.map(word => word.toUpperCase());
  // generateGrid();
  generateGrid();
  // frameRate(1);
  // noLoop();
}

function draw() {
  background(255);
  
  // // DEBUG
  // let coordPairings = []
  // for (let i = 0; i < path.length; i++) {
  //   stroke(255, 0, 0, 126);
  //   strokeWeight(10); 

  //   let [gx1, gy1] = getGridPosFromIndex(path[i]);
  //   let o1 = getGridOrigin(gx1, gy1);     // Thick point for visibility
  //   point(o1.x + cellSize/2, o1.y + cellSize/2);

  //   if (i < path.length - 1) {
  //     let [gx2, gy2] = getGridPosFromIndex(path[i + 1]);
  //     let o2 = getGridOrigin(gx2, gy2);
  //     point(o2.x + cellSize/2, o2.y + cellSize/2);
  
  //     strokeWeight(2); 
  //     line(o1.x + cellSize/2, o1.y + cellSize/2, o2.x + cellSize/2, o2.y + cellSize/2);

  //     coordPairings.push([[gx1, gy1], [gx2, gy2]]);
  //   }
  // }
  
  for (let cell of grid) {
    cell.drawBackdrop();
  }

  for (let cell of grid) {
    cell.drawLetter();
  }
}


