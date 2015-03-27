// gol2.js
// (TODO: gol2.js website here)
// (c) 2014 Max Hubenthal
// gol2 may be freely distributed under the MIT license.

// Wrap the library in an IIFE
(function(window){ 
  // Declare gol2 object for use in global namespace
  var gol2 = {
      
    // Current version.
    VERSION: "2.0"
  };

  /////////////////////////////////////////////
  //  gol2 constants & gol2 setup
  /////////////////////////////////////////////

  // References to <canvas> element
  // Note: for gol2 to work, set the id of the <canvas>
  //   element to "gol2_canvas".
  var gol2_canvas = document.getElementById("gol2_canvas");
  var gol2_ctx = gol2_canvas.getContext('2d');   

  // Assign color to cell states
  var state0 = "rgb(255,255,255)"; // Dead cell
  var state1 = "rgb(255,204,204)"; // Cell alive one cycle
  var state2 = "rgb(255,102,102)"; // Cell alive two cycles
  var state3 = "rgb(255,0,0)"; // Cell alive three cycles
  var state4 = "rgb(153,0,0)"; // Cell alive four cycles
  var state5 = "rgb(51,0,0)"; // Cell alive five or more cycles
  var state6 = "rgb(153,255,255)"; // Cell recently dead

  // Array of colors, assigned depending on cell's state: [dead, alive 1, alive 2, alive 3, alive 4, alive 5, recently dead]
  var gol2_stateColors = [state0,state1,state2,state3,state4,state5,state6];

  // Use two boards, one for current gol2, one to hold next gol2
  var gol2_lifeBoard1 = [], gol2_lifeBoard2 = [];
    
  // Set flag to start gol2 at board one
  var gol2_board1isCurrent = true;
  // Set default gol2 board and cell sizes and colors, and interval for speed of life
  // (Grid lines are drawn at 1px wide)
  var gol2_backgroundColor = state5, gol2_backgroundWidth, gol2_backgroundHeight, gol2_boardCellHeight = 30, gol2_boardCellWidth = 60, gol2_cellSize = 10, gol2_cellColor = state0, gol2_lifeSpeed = 250, gol2_intervalId;

  // Set offset values for gol2 origin
  var gol2_originX = 0, gol2_originY = 0;
  // Set default canvas size
  gol2_backgroundWidth = ((gol2_boardCellWidth*gol2_cellSize)+gol2_boardCellWidth+1);
  gol2_backgroundHeight = ((gol2_boardCellHeight*gol2_cellSize)+gol2_boardCellHeight+1);
  gol2_canvas.width = gol2_backgroundWidth;
  gol2_canvas.height = gol2_backgroundHeight;

  // Set default values for state of board
  var gol2_isPaused = true;

  /////////////////////////////////////////////
  //  Internal gol2 functions
  /////////////////////////////////////////////

  // Draw black rectangle container, size of life board
  function gol2_drawBackground(){
    gol2_ctx.fillStyle = gol2_backgroundColor;
    gol2_ctx.fillRect(gol2_originX,gol2_originY,gol2_backgroundWidth,gol2_backgroundHeight);
  }

  // Draw complete board of dead(white) cells
  function gol2_drawEmptyLife(){
    gol2_ctx.fillStyle = gol2_cellColor;
    for(var xPos=1;xPos<gol2_backgroundWidth;xPos+=(gol2_cellSize+1)){
      for(var yPos=1;yPos<gol2_backgroundHeight;yPos+=(gol2_cellSize+1)){
        gol2_ctx.fillRect(xPos,yPos,gol2_cellSize,gol2_cellSize);
      }
    }
  }

  // Draw current board of life
  function gol2_drawLife(){
    var x=0, y=0;
    var xPos = 1, yPos = 1;
    // Use board1 if current
    if(gol2_board1isCurrent){
      for(xPos=1;xPos<gol2_backgroundWidth;xPos+=(gol2_cellSize+1)){
        y=0;
        for(yPos=1;yPos<gol2_backgroundHeight;yPos+=(gol2_cellSize+1)){
          // Fill cell based on state of cell
          gol2_ctx.fillStyle = gol2_stateColors[gol2_lifeBoard1[y][x].state];
          gol2_ctx.fillRect(xPos,yPos,gol2_cellSize,gol2_cellSize);
          y++;
        }
        x++;
      }
    } 
    // Else, board2 is current 
    if(!gol2_board1isCurrent){
      for(xPos=1;xPos<gol2_backgroundWidth;xPos+=(gol2_cellSize+1)){
        y=0;
        for(yPos=1;yPos<gol2_backgroundHeight;yPos+=(gol2_cellSize+1)){
          // Fill cell based on state of cell
          gol2_ctx.fillStyle = gol2_stateColors[gol2_lifeBoard2[y][x].state];
          gol2_ctx.fillRect(xPos,yPos,gol2_cellSize,gol2_cellSize);
          y++;
        }
        x++;
      }
    }
  } 

  // Draw complete empty board
  function gol2_drawEmptyBoard(){
    gol2_drawBackground();
    gol2_drawEmptyLife();
  }

  // Set both life boards to all dead ("0" values)
  function gol2_clearLife(boardToClear){
    for(var yPos=0;yPos<gol2_boardCellHeight;yPos++){
      boardToClear[yPos] = [];
      for(var xPos=0;xPos<gol2_boardCellWidth;xPos++){
        boardToClear[yPos][xPos] = {state: 0};
      }
    }
  }

  // Get number of live neighbors, looking at the grid as a toroidal sphere
  function gol2_getNeighborCount(array,y,x){
    var liveNabes = 0;
    function convertState(stateValue){
      // Convert state value to 1 or 0
      return (stateValue === 0 || stateValue === 6) ? 0 : 1;
    }
    // Check north
    function checkNorth(){
      if(y===0){
        liveNabes += convertState(array.slice(y-1)[0][x].state);
      }
      if(y!==0){
        liveNabes += convertState(array.slice(y-1,y)[0][x].state);
      } 
    }
    // Check south
    function checkSouth(){
      if(y===array.length-1){
        liveNabes += convertState(array.slice(0,1)[0][x].state);
      }
      if(y!==array.length-1){
        liveNabes += convertState(array.slice(y+1,y+2)[0][x].state);
      }
    } 
    // Check west
    function checkWest(){
      if(x===0){
        liveNabes += convertState(array[y][array[0].length-1].state);
      }
      if(x!==0){
        liveNabes += convertState(array[y][x-1].state);
      } 
    } 
    // Check east
    function checkEast(){
      if(x===array[0].length-1){
        liveNabes += convertState(array[y][0].state);
      }
      if(x!==array[0].length-1){
        liveNabes += convertState(array[y][x+1].state);
      }  
    }
    // Check northwest
    function checkNorthwest(){
      if(y===0 && x!==0){
        liveNabes += convertState(array.slice(y-1)[0][x-1].state);
      }
      if(y!==0 && x!==0){
        liveNabes += convertState(array[y-1][x-1].state);
      } 
      if(y===0 && x===0){
        liveNabes += convertState(array[array.length-1][array[0].length-1].state);
      }
      if(y!==0 && x===0){
        liveNabes += convertState(array[y-1][array[0].length-1].state);
      } 
    }
    // Check northeast
    function checkNortheast(){
      if(y===0 && x!==array[0].length-1){
        liveNabes += convertState(array[array.length-1][x+1].state);
      }
      if(y!==0 && x!==array[0].length-1){
        liveNabes += convertState(array[y-1][x+1].state);
      } 
      if(y===0 && x===array[0].length-1){
        liveNabes += convertState(array[array.length-1][0].state);
      }
      if(y!==0 && x===array[0].length-1){
        liveNabes += convertState(array[y-1][0].state);
      } 
    }
    // Check southwest
    function checkSouthwest(){
      if(y!==array.length-1 && x!==0){
        liveNabes += convertState(array[y+1][x-1].state);
      }
      if(y!==array.length-1 && x===0){
        liveNabes += convertState(array[y+1][array[0].length-1].state);
      } 
      if(y===array.length-1 && x===array[0].length-1){
        liveNabes += convertState(array[0][array[0].length-1].state);
      }
      if(y===array.length-1 && x!==0){
        liveNabes += convertState(array[0][x-1].state);
      }
    }
    // Check southeast
    function checkSoutheast(){
      if(y!==array.length-1 && x!==array[0].length-1){
        liveNabes += convertState(array[y+1][x+1].state);
      }
      if(y!==array.length-1 && x===array[0].length-1){
        liveNabes += convertState(array[y+1][0].state);
      }
      if(y===array.length-1 && x===array[0].length-1){
        liveNabes += convertState(array[0][0].state);
      }
      if(y===array.length-1 && x!==array[0].length-1){
        liveNabes += convertState(array[0][x+1].state);
      }
    }
    // Check cardinal directions
    checkNorth();
    checkSouth();
    checkWest();
    checkEast();
    checkNorthwest();
    checkNortheast();
    checkSouthwest();
    checkSoutheast();
    return liveNabes;
  }

  // Set the next board's cell value to 1 or 0
  // based on number of neighbors.
  function gol2_setNextGen(currentBoard,nextBoard,n,y,x){
    // Check if current cell is live
    if(currentBoard[y][x].state>=1){
      if((n>3)||(n<2)){
        nextBoard[y][x].state = 6; // Set next board to recently dead cell
      }
      if((n===3)||(n===2)){
        // Cell has not reached limit
        if(currentBoard[y][x].state < 5){
          nextBoard[y][x].state = ++currentBoard[y][x].state;
        }
        // Cell has reached limit
        else{
          nextBoard[y][x].state = 5;  
        }
      }
    }
    // Else cell is dead or recently dead
    if((currentBoard[y][x].state===0) || (currentBoard[y][x].state===6)){
      if(n===3){
        nextBoard[y][x].state = 1; // Set next board to live cell
      }
      if(n!==3){
        nextBoard[y][x].state = 0; // Set next board to dead cell
      }
    }
  }

  // Check current board agains rules for Conway's
  // game of life and change next board accordingly.
  //    Conway's Game of Life rules (Wikipedia):
  //      1. Any live cell with fewer than two live neighbors dies, as if caused by under-population.
  //      2. Any live cell with two or three live neighbors lives on to the next generation.
  //      3. Any live cell with more than three live neighbors dies, as if by overcrowding.
  //      4. Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
  function gol2_checkBoard(){
    // N holds number of live neighbors of current cell
    var n = 0;
    var xPos = 0, yPos = 0;
    // Check which board is current
    // Board 1 is current
    if(gol2_board1isCurrent){
      for(xPos=0;xPos<gol2_boardCellWidth;xPos++){
        for(yPos=0;yPos<gol2_boardCellHeight;yPos++){
          n = 0;
          n = gol2_getNeighborCount(gol2_lifeBoard1, yPos, xPos);
          gol2_setNextGen(gol2_lifeBoard1,gol2_lifeBoard2,n,yPos,xPos);
        }
      }
      gol2_clearLife(gol2_lifeBoard1);
    }
    // Else board 2 is current
    if(!gol2_board1isCurrent){
      for(xPos=0;xPos<gol2_boardCellWidth;xPos++){
        for(yPos=0;yPos<gol2_boardCellHeight;yPos++){
          n=0;
          n = gol2_getNeighborCount(gol2_lifeBoard2, yPos, xPos);
          gol2_setNextGen(gol2_lifeBoard2,gol2_lifeBoard1,n,yPos,xPos);
        }
      }
      gol2_clearLife(gol2_lifeBoard2);
    }
    // Reset current board
    gol2_board1isCurrent = !gol2_board1isCurrent;
  }

  // gol2 life loop
  function gol2_playLife(){
    // If gol2 is not already playing, start it up
    clearInterval(gol2_intervalId); // Clear any previously running gol2
    gol2_isPaused = false;
    gol2_intervalId = setInterval(function(){
      gol2_checkBoard();
      gol2_drawLife();
    }, gol2_lifeSpeed);  
  }

  // Pause gol2
  function gol2_pauseLife() {
    if(!gol2_isPaused){
      clearInterval(gol2_intervalId);
      gol2_isPaused = true;
    }
  }

  // Callback for mousedown on gol2 canvas
  function gol2_getPosition(event){
    var currentBoard = gol2_lifeBoard1;
    if(!gol2_board1isCurrent){
      currentBoard = gol2_lifeBoard2;
    }
    // Get mouse position
    var x = event.pageX;
    var y = event.pageY;
    // Get x and y relative to canvas
    x -= gol2_canvas.offsetLeft;
    y -= gol2_canvas.offsetTop;
    // Get coordinates to paint current cell
    var adjX = Math.floor(x/(gol2_cellSize+1)) * (gol2_cellSize+1) + 1;
    var adjY = Math.floor(y/(gol2_cellSize+1)) * (gol2_cellSize+1) + 1;
    // Get position of cell in board array
    var colX = Math.floor(x/(gol2_cellSize+1));
    if(x<(gol2_cellSize+2)){colX=0;}
    var rowY = Math.floor(y/(gol2_cellSize+1));
    if(y<(gol2_cellSize+2)){rowY=0;}
    // Change selected cell to live state 1 color
    if(currentBoard[rowY][colX].state === 0){
      gol2_ctx.fillStyle = gol2_stateColors[1];
      gol2_ctx.fillRect(adjX,adjY,gol2_cellSize,gol2_cellSize);
      currentBoard[rowY][colX].state = 1;
    }
    // Change selected cell to dead
    else {
      gol2_ctx.fillStyle = gol2_cellColor;
      gol2_ctx.fillRect(adjX,adjY,gol2_cellSize,gol2_cellSize);
      currentBoard[rowY][colX].state = 0;
    }
  }

  /////////////////////////////////////////////
  //  External functions to be called by user
  /////////////////////////////////////////////

  // Basic gol2 operations
  // Setup blank board
  gol2.setupLife = function(){
    gol2_drawEmptyBoard();
    gol2_clearLife(gol2_lifeBoard1);
    gol2_clearLife(gol2_lifeBoard2);
    // Let user select initial live cells
    gol2_canvas.addEventListener("mousedown", gol2_getPosition, false);
  };
  // Play current gol2 board
  gol2.playLife = function(){
    gol2_canvas.removeEventListener("mousedown", gol2_getPosition, false);
    gol2_playLife();
  };
  // Pause
  gol2.pauseLife = function(){
    gol2_pauseLife();
    gol2_canvas.addEventListener("mousedown", gol2_getPosition, false);
  };
  // Reset the board
  gol2.clearLife = function(){
    gol2_pauseLife();
    gol2_clearLife(gol2_lifeBoard1);
    gol2_clearLife(gol2_lifeBoard2);
    gol2_drawLife();
    gol2_canvas.addEventListener("mousedown", gol2_getPosition, false);
  };
  // Change interval in ms of lifecycles
  gol2.setLifeSpeed = function(newLifeSpeed){
    gol2_lifeSpeed = newLifeSpeed;
    // Keep gol2 running if currently running
    if(!gol2_isPaused){
      gol2_playLife();
    }
  };
  // Populate board with randomly populated game of life
  gol2.setSampleBoard = function(){
    gol2_pauseLife();
    gol2_clearLife(gol2_lifeBoard1);
    gol2_clearLife(gol2_lifeBoard2); 
    var xPos = 0, yPos = 0; 
    // Get a random value of 1 or 0
    function getRandomCell() {
      return Math.floor(Math.random() * 2);
    }
    if(gol2_board1isCurrent){
      for(yPos=10;yPos<20;yPos++){
        for(xPos=25;xPos<35;xPos++){
          gol2_lifeBoard1[yPos][xPos] = {state: getRandomCell()};
        }
      }
    }
    if(!gol2_board1isCurrent){
      for(yPos=10;yPos<20;yPos++){
        for(xPos=25;xPos<35;xPos++){
          gol2_lifeBoard2[yPos][xPos] = {state: getRandomCell()};
        }
      }  
    }
    gol2_drawLife();
  };

  // Register the gol2 object to the global namespace
  window.gol2 = gol2;
}(window));
