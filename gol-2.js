// gol.js
// (TODO: gol.js website here)
// (c) 2014 Max Hubenthal
// Gol may be freely distributed under the MIT license.

// Wrap the library in an IIFE
(function(window){ 
  // Declare gol object for use in global namespace
  var gol = {
      
    // Current version.
    VERSION: "2.0"
  };

  /////////////////////////////////////////////
  //  gol constants & gol setup
  /////////////////////////////////////////////

  // References to <canvas> element
  // Note: for gol to work, set the id of the <canvas>
  //   element to "gol_canvas".
  var gol_canvas = document.getElementById("gol_canvas");
  var gol_ctx = gol_canvas.getContext('2d');   

  // Use two boards, one for current gol, one to hold next gol
  var gol_lifeBoard1 = [], gol_lifeBoard2 = [];
    
  // Set flag to start gol at board one
  var gol_board1isCurrent = true;
  // Set default gol board and cell sizes and colors, and interval for speed of life
  // (Grid lines are drawn at 1px wide)
  var gol_backgroundColor = "black", gol_backgroundWidth, gol_backgroundHeight, gol_boardCellHeight = 30, gol_boardCellWidth = 60, gol_cellSize = 10, gol_cellColor = "white", gol_lifeSpeed = 250, gol_intervalId;
  // Set offset values for gol origin
  var gol_originX = 0, gol_originY = 0;
  // Set default canvas size
  gol_backgroundWidth = ((gol_boardCellWidth*gol_cellSize)+gol_boardCellWidth+1);
  gol_backgroundHeight = ((gol_boardCellHeight*gol_cellSize)+gol_boardCellHeight+1);
  gol_canvas.width = gol_backgroundWidth;
  gol_canvas.height = gol_backgroundHeight;

  // Set default values for state of board
  var gol_isPaused = true;

  /////////////////////////////////////////////
  //  Internal gol functions
  /////////////////////////////////////////////

  // Draw black rectangle container, size of life board
  function gol_drawBackground(){
    gol_ctx.fillStyle = gol_backgroundColor;
    gol_ctx.fillRect(gol_originX,gol_originY,gol_backgroundWidth,gol_backgroundHeight);
  }

  // Draw complete board of dead(white) cells
  function gol_drawEmptyLife(){
    gol_ctx.fillStyle = gol_cellColor;
    for(var xPos=1;xPos<gol_backgroundWidth;xPos+=(gol_cellSize+1)){
      for(var yPos=1;yPos<gol_backgroundHeight;yPos+=(gol_cellSize+1)){
        gol_ctx.fillRect(xPos,yPos,gol_cellSize,gol_cellSize);
      }
    }
  }

  // Draw current board of life
  function gol_drawLife(){
    var x=0, y=0;
    // Use board1 if current
    if(gol_board1isCurrent){
      for(var xPos=1;xPos<gol_backgroundWidth;xPos+=(gol_cellSize+1)){
        y=0;
        for(var yPos=1;yPos<gol_backgroundHeight;yPos+=(gol_cellSize+1)){
          // Dead cell
          if(gol_lifeBoard1[y][x] === 0){
            gol_ctx.fillStyle = gol_cellColor;
            gol_ctx.fillRect(xPos,yPos,gol_cellSize,gol_cellSize);
          } 
          // Else live cell
          if(gol_lifeBoard1[y][x] === 1){
            gol_ctx.fillStyle = gol_backgroundColor;
            gol_ctx.fillRect(xPos,yPos,gol_cellSize,gol_cellSize);
          }
          y++;
        }
        x++;
      }
    } 
    // Else, board2 is current 
    if(!gol_board1isCurrent){
      for(xPos=1;xPos<gol_backgroundWidth;xPos+=(gol_cellSize+1)){
        y=0;
        for(yPos=1;yPos<gol_backgroundHeight;yPos+=(gol_cellSize+1)){
          // Dead cell
          if(gol_lifeBoard2[y][x] === 0){
            gol_ctx.fillStyle = gol_cellColor;
            gol_ctx.fillRect(xPos,yPos,gol_cellSize,gol_cellSize);
          } 
          // Else live cell
          if(gol_lifeBoard2[y][x] === 1){
            gol_ctx.fillStyle = gol_backgroundColor;
            gol_ctx.fillRect(xPos,yPos,gol_cellSize,gol_cellSize);
          }
          y++;
        }
        x++;
      }
    }
  } 

  // Draw complete empty board
  function gol_drawEmptyBoard(){
    gol_drawBackground();
    gol_drawEmptyLife();
  }

  // Set both life boards to all dead ("0" values)
  function gol_clearLife(boardToClear){
    for(var yPos=0;yPos<gol_boardCellHeight;yPos++){
      boardToClear[yPos] = [];
      for(var xPos=0;xPos<gol_boardCellWidth;xPos++){
        boardToClear[yPos][xPos] = 0;
      }
    }
  }

  // Get number of live neighbors, looking at the grid as a toroidal sphere
  function gol_getNeighborCount(array,y,x){
    var liveNabes = 0;
    // Check north
    function checkNorth(){
      if(y===0){
        liveNabes += array.slice(y-1)[0][x];
      }
      if(y!==0){
        liveNabes += array.slice(y-1,y)[0][x];
      } 
    }
    // Check south
    function checkSouth(){
      if(y===array.length-1){
        liveNabes += array.slice(0,1)[0][x];
      }
      if(y!==array.length-1){
        liveNabes += array.slice(y+1,y+2)[0][x];
      }
    } 
    // Check west
    function checkWest(){
      if(x===0){
        liveNabes += array[y][array[0].length-1];
      }
      if(x!==0){
        liveNabes += array[y][x-1];
      } 
    } 
    // Check east
    function checkEast(){
      if(x===array[0].length-1){
        liveNabes += array[y][0];
      }
      if(x!==array[0].length-1){
        liveNabes += array[y][x+1];
      }  
    }
    // Check northwest
    function checkNorthwest(){
      if(y===0 && x!==0){
        liveNabes += array.slice(y-1)[0][x-1];
      }
      if(y!==0 && x!==0){
        liveNabes += array[y-1][x-1];
      } 
      if(y===0 && x===0){
        liveNabes += array[array.length-1][array[0].length-1];
      }
      if(y!==0 && x===0){
        liveNabes += array[y-1][array[0].length-1];
      } 
    }
    // Check northeast
    function checkNortheast(){
      if(y===0 && x!==array[0].length-1){
        liveNabes += array[array.length-1][x+1];
      }
      if(y!==0 && x!==array[0].length-1){
        liveNabes += array[y-1][x+1];
      } 
      if(y===0 && x===array[0].length-1){
        liveNabes += array[array.length-1][0];
      }
      if(y!==0 && x===array[0].length-1){
        liveNabes += array[y-1][0];
      } 
    }
    // Check southwest
    function checkSouthwest(){
      if(y!==array.length-1 && x!==0){
        liveNabes += array[y+1][x-1];
      }
      if(y!==array.length-1 && x===0){
        liveNabes += array[y+1][array[0].length-1];
      } 
      if(y===array.length-1 && x===array[0].length-1){
        liveNabes += array[0][array[0].length-1];
      }
      if(y===array.length-1 && x!==0){
        liveNabes += array[0][x-1];
      }
    }
    // Check southeast
    function checkSoutheast(){
      if(y!==array.length-1 && x!==array[0].length-1){
        liveNabes += array[y+1][x+1];
      }
      if(y!==array.length-1 && x===array[0].length-1){
        liveNabes += array[y+1][0];
      }
      if(y===array.length-1 && x===array[0].length-1){
        liveNabes += array[0][0];
      }
      if(y===array.length-1 && x!==array[0].length-1){
        liveNabes += array[0][x+1];
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
  function gol_setNextGen(currentBoard,nextBoard,n,y,x){
    // Check if current cell is live
    if(currentBoard[y][x]===1){
      if((n>3)||(n<2)){
        nextBoard[y][x] = 0; // Set next board to dead cell
      }
      if((n===3)||(n===2)){
        nextBoard[y][x] = 1; // Set next board to live cell
      }
    }
    // Else cell is dead
    if(currentBoard[y][x]===0){
      if(n===3){
        nextBoard[y][x] = 1; // Set next board to live cell
      }
      if(n!==3){
        nextBoard[y][x] = 0; // Set next board to dead cell
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
  function gol_checkBoard(){
    // N holds number of live neighbors of current cell
    var n = 0;
    // Check which board is current
    // Board 1 is current
    if(gol_board1isCurrent){
      for(var xPos=0;xPos<gol_boardCellWidth;xPos++){
        for(var yPos=0;yPos<gol_boardCellHeight;yPos++){
          n = 0;
          n = gol_getNeighborCount(gol_lifeBoard1, yPos, xPos);
          gol_setNextGen(gol_lifeBoard1,gol_lifeBoard2,n,yPos,xPos);
        }
      }
      gol_clearLife(gol_lifeBoard1);
    }
    // Else board 2 is current
    if(!gol_board1isCurrent){
      for(xPos=0;xPos<gol_boardCellWidth;xPos++){
        for(yPos=0;yPos<gol_boardCellHeight;yPos++){
          n=0;
          n = gol_getNeighborCount(gol_lifeBoard2, yPos, xPos);
          gol_setNextGen(gol_lifeBoard2,gol_lifeBoard1,n,yPos,xPos);
        }
      }
      gol_clearLife(gol_lifeBoard2);
    }
    // Reset current board
    gol_board1isCurrent = !gol_board1isCurrent;
  }

  // Gol life loop
  function gol_playLife(){
    // If gol is not already playing, start it up
    clearInterval(gol_intervalId); // Clear any previously running gol
    gol_isPaused = false;
    gol_intervalId = setInterval(function(){
      gol_checkBoard();
      gol_drawLife();
    }, gol_lifeSpeed);  
  }

  // Pause gol
  function gol_pauseLife() {
    if(!gol_isPaused){
      clearInterval(gol_intervalId);
      gol_isPaused = true;
    }
  }

  // Callback for mousedown on gol canvas
  function gol_getPosition(event){
    var currentBoard = gol_lifeBoard1;
    if(!gol_board1isCurrent){
      currentBoard = gol_lifeBoard2;
    }
    // Get mouse position
    var x = event.pageX;
    var y = event.pageY;
    // Get x and y relative to canvas
    x -= gol_canvas.offsetLeft;
    y -= gol_canvas.offsetTop;
    // Get coordinates to paint current cell
    var adjX = Math.floor(x/(gol_cellSize+1)) * (gol_cellSize+1) + 1;
    var adjY = Math.floor(y/(gol_cellSize+1)) * (gol_cellSize+1) + 1;
    // Get position of cell in board array
    var colX = Math.floor(x/(gol_cellSize+1));
    if(x<(gol_cellSize+2)){colX=0;}
    var rowY = Math.floor(y/(gol_cellSize+1));
    if(y<(gol_cellSize+2)){rowY=0;}
    // Change selected cell to live
    if(currentBoard[rowY][colX] === 0){
      gol_ctx.fillStyle = gol_backgroundColor;
      gol_ctx.fillRect(adjX,adjY,gol_cellSize,gol_cellSize);
      currentBoard[rowY][colX] = 1;
    }
    // Change selected cell to dead
    else {
      gol_ctx.fillStyle = gol_cellColor;
      gol_ctx.fillRect(adjX,adjY,gol_cellSize,gol_cellSize);
      currentBoard[rowY][colX] = 0;
    }
  }

  /////////////////////////////////////////////
  //  External functions to be called by user
  /////////////////////////////////////////////

  // Basic gol operations
  // Setup blank board
  gol.setupLife = function(){
    gol_drawEmptyBoard();
    gol_clearLife(gol_lifeBoard1);
    gol_clearLife(gol_lifeBoard2);
    // Let user select initial live cells
    gol_canvas.addEventListener("mousedown", gol_getPosition, false);
  };
  // Play current gol board
  gol.playLife = function(){
    gol_canvas.removeEventListener("mousedown", gol_getPosition, false);
    gol_playLife();
  };
  // Pause
  gol.pauseLife = function(){
    gol_pauseLife();
    gol_canvas.addEventListener("mousedown", gol_getPosition, false);
  };
  // Reset the board
  gol.clearLife = function(){
    gol_pauseLife();
    gol_clearLife(gol_lifeBoard1);
    gol_clearLife(gol_lifeBoard2);
    gol_drawLife();
    gol_canvas.addEventListener("mousedown", gol_getPosition, false);
  };

  // Customize gol
  // Note: setSize method still needs to be implemented
  // Set board width, height
  /*
  gol.setSize = function(newCellWidth, newCellHeight){
    //gol_pauseLife();
    gol_boardCellWidth = newCellWidth;
    gol_boardCellHeight = newCellHeight;
    gol_backgroundWidth = ((gol_boardCellWidth*gol_cellSize)+gol_boardCellWidth+1);
    gol_backgroundHeight = ((gol_boardCellHeight*gol_cellSize)+gol_boardCellHeight+1);
    gol_clearLife(gol_lifeBoard1);
    gol_clearLife(gol_lifeBoard2);
    gol_drawLife(); 
  }
  */
  // Change grid color, takes a valid CSS color string, pauses game
  gol.setGridColor = function(newGridColor){
    gol_backgroundColor = newGridColor;
    if(gol_isPaused){
      gol_drawBackground();
      gol_drawLife();
    }
  };
  // Change cell color, takes a valid CSS color string, pauses game
  gol.setCellColor = function (newCellColor) {
    gol_cellColor = newCellColor;
    if(gol_isPaused){
      gol_drawLife();
    }
  };
  // Change interval in ms of lifecycles
  gol.setLifeSpeed = function(newLifeSpeed){
    gol_lifeSpeed = newLifeSpeed;
    // Keep gol running if currently running
    if(!gol_isPaused){
      gol_playLife();
    }
  };
  // Populate board with randomly populated game of life
  gol.setSampleBoard = function(){
    gol_pauseLife();
    gol_clearLife(gol_lifeBoard1);
    gol_clearLife(gol_lifeBoard2);  
    // Get a random value of 1 or 0
    function getRandomCell() {
      return Math.floor(Math.random() * 2);
    }
    if(gol_board1isCurrent){
      for(var yPos=10;yPos<20;yPos++){
        gol_lifeBoard1[yPos] = [];
        for(var xPos=25;xPos<35;xPos++){
          gol_lifeBoard1[yPos][xPos] = getRandomCell();
        }
      }
    }
    if(!gol_board1isCurrent){
      for(var yPos=10;yPos<20;yPos++){
        gol_lifeBoard2[yPos] = [];
        for(var xPos=25;xPos<35;xPos++){
          gol_lifeBoard2[yPos][xPos] = getRandomCell();
        }
      }  
    }
    gol_drawLife();
  }

  // Register the gol object to the global namespace
  window.gol = gol;
}(window));
