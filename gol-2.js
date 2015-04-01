// gol2.js
// (TODO: gol2.js website here)
// (c) 2014 Max Hubenthal
// gol2 may be freely distributed under the MIT license.

// Wrap the library in an IIFE
(function(window){ 
  // Define gol2 constructor
  // Canvas Id is required for new gol2 object, board width and height are optional,
  // and default to 60 cells wide by 30 cells tall
  var Gol2 = function(targetCanvasId, newBoardCellWidth, newBoardCellHeight){      
    // Current version
    this.version = {VERSION: "2.0"};
    // Get Canvas object by Id
    this.gol2_canvas = document.getElementById(targetCanvasId);
    // Get Canvas element context to draw to
    this.gol2_ctx = gol2_canvas.getContext('2d'); 
    // Set cell width, height
    this.gol2_boardCellWidth = newBoardCellWidth || 60;
    this.gol2_boardCellHeight = newBoardCellHeight || 30;
    // Assign color to cell states
    this.state0 = "rgb(255,255,255)"; // Dead cell
    this.state1 = "rgb(255,204,204)"; // Cell alive one cycle
    this.state2 = "rgb(255,102,102)"; // Cell alive two cycles
    this.state3 = "rgb(255,0,0)"; // Cell alive three cycles
    this.state4 = "rgb(153,0,0)"; // Cell alive four cycles
    this.state5 = "rgb(51,0,0)"; // Cell alive five or more cycles
    this.state6 = "rgb(153,255,255)"; // Cell recently dead
    // Array of colors, assigned depending on cell's state: [dead, alive 1, alive 2, alive 3, alive 4, alive 5, recently dead]
    this.gol2_stateColors = [this.state0,this.state1,this.state2,this.state3,this.state4,this.state5,this.state6];
    // Use two boards, one for current gol2, one to hold next gol2
    this.gol2_lifeBoard1 = [];
    this.gol2_lifeBoard2 = [];
    // Set flag to start gol2 at board one
    this.gol2_board1isCurrent = true;
    // Default gol2 board and cell sizes and colors, and interval for speed of life
    // (Grid lines are drawn at 1px wide)
    this.gol2_cellColor = this.state0;
    this.gol2_backgroundColor = this.state5;
    this.gol2_cellSize = 10;
    this.gol2_lifeSpeed = 250;
    this.gol2_intervalId = 0;
    // Set offset values for gol2 origin
    this.gol2_originX = 0;
    this.gol2_originY = 0;
    // Set canvas size
    this.gol2_backgroundWidth = ((this.gol2_boardCellWidth*this.gol2_cellSize)+this.gol2_boardCellWidth+1);
    this.gol2_backgroundHeight = ((this.gol2_boardCellHeight*this.gol2_cellSize)+this.gol2_boardCellHeight+1);
    this.gol2_canvas.width = this.gol2_backgroundWidth;
    this.gol2_canvas.height = this.gol2_backgroundHeight;
    // Set default values for state of board
    this.gol2_isPaused = true;

    /////////////////////////////////////////////
    //  Internal gol2 functions
    /////////////////////////////////////////////

    // Draw black rectangle container, size of life board
    this.gol2_drawBackground = function(){
      this.gol2_ctx.fillStyle = this.gol2_backgroundColor;
      this.gol2_ctx.fillRect(this.gol2_originX,this.gol2_originY,this.gol2_backgroundWidth,this.gol2_backgroundHeight);
    };

    // Draw complete board of dead(white) cells
    this.gol2_drawEmptyLife = function(){
      this.gol2_ctx.fillStyle = this.gol2_cellColor;
      for(var xPos=1;xPos<this.gol2_backgroundWidth;xPos+=(this.gol2_cellSize+1)){
        for(var yPos=1;yPos<this.gol2_backgroundHeight;yPos+=(this.gol2_cellSize+1)){
          this.gol2_ctx.fillRect(xPos,yPos,this.gol2_cellSize,this.gol2_cellSize);
        }
      }
    };

    // Draw current board of life
    this.gol2_drawLife = function(){
      var x=0, y=0;
      var xPos = 1, yPos = 1;
      // Use board1 if current
      if(this.gol2_board1isCurrent){
        for(xPos=1;xPos<this.gol2_backgroundWidth;xPos+=(this.gol2_cellSize+1)){
          y=0;
          for(yPos=1;yPos<this.gol2_backgroundHeight;yPos+=(this.gol2_cellSize+1)){
            // Fill cell based on state of cell
            this.gol2_ctx.fillStyle = this.gol2_stateColors[this.gol2_lifeBoard1[y][x].state];
            this.gol2_ctx.fillRect(xPos,yPos,this.gol2_cellSize,this.gol2_cellSize);
            y++;
          }
          x++;
        }
      } 
      // Else, board2 is current 
      if(!this.gol2_board1isCurrent){
        for(xPos=1;xPos<this.gol2_backgroundWidth;xPos+=(this.gol2_cellSize+1)){
          y=0;
          for(yPos=1;yPos<this.gol2_backgroundHeight;yPos+=(this.gol2_cellSize+1)){
            // Fill cell based on state of cell
            this.gol2_ctx.fillStyle = this.gol2_stateColors[this.gol2_lifeBoard2[y][x].state];
            this.gol2_ctx.fillRect(xPos,yPos,this.gol2_cellSize,this.gol2_cellSize);
            y++;
          }
          x++;
        }
      }
    }; 

    // Draw complete empty board
    this.gol2_drawEmptyBoard = function(){
      this.gol2_drawBackground();
      this.gol2_drawEmptyLife();
    };

    // Set both life boards to all dead ("0" values)
    this.gol2_clearLife = function(boardToClear){
      for(var yPos=0;yPos<this.gol2_boardCellHeight;yPos++){
        boardToClear[yPos] = [];
        for(var xPos=0;xPos<this.gol2_boardCellWidth;xPos++){
          boardToClear[yPos][xPos] = {state: 0};
        }
      }
    };

    // Get number of live neighbors, looking at the grid as a toroidal sphere
    this.gol2_getNeighborCount = function(array,y,x){
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
    };

    // Set the next board's cell value to 1 or 0
    // based on number of neighbors.
    this.gol2_setNextGen = function(currentBoard,nextBoard,n,y,x){
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
    };

    // Check current board agains rules for Conway's
    // game of life and change next board accordingly.
    //    Conway's Game of Life rules (Wikipedia):
    //      1. Any live cell with fewer than two live neighbors dies, as if caused by under-population.
    //      2. Any live cell with two or three live neighbors lives on to the next generation.
    //      3. Any live cell with more than three live neighbors dies, as if by overcrowding.
    //      4. Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
    this.gol2_checkBoard = function(){
      // N holds number of live neighbors of current cell
      var n = 0;
      var xPos = 0, yPos = 0;
      // Check which board is current
      // Board 1 is current
      if(this.gol2_board1isCurrent){
        for(xPos=0;xPos<this.gol2_boardCellWidth;xPos++){
          for(yPos=0;yPos<this.gol2_boardCellHeight;yPos++){
            n = 0;
            n = this.gol2_getNeighborCount(this.gol2_lifeBoard1, yPos, xPos);
            this.gol2_setNextGen(this.gol2_lifeBoard1,this.gol2_lifeBoard2,n,yPos,xPos);
          }
        }
        this.gol2_clearLife(this.gol2_lifeBoard1);
      }
      // Else board 2 is current
      if(!this.gol2_board1isCurrent){
        for(xPos=0;xPos<this.gol2_boardCellWidth;xPos++){
          for(yPos=0;yPos<this.gol2_boardCellHeight;yPos++){
            n=0;
            n = this.gol2_getNeighborCount(this.gol2_lifeBoard2, yPos, xPos);
            this.gol2_setNextGen(this.gol2_lifeBoard2,this.gol2_lifeBoard1,n,yPos,xPos);
          }
        }
        this.gol2_clearLife(this.gol2_lifeBoard2);
      }
      // Reset current board
      this.gol2_board1isCurrent = !this.gol2_board1isCurrent;
    };

    // gol2 life loop
    this.gol2_playLife = function(){
      // If gol2 is not already playing, start it up
      clearInterval(this.gol2_intervalId); // Clear any previously running gol2
      // Get reference to proper 'this' context
      var self = this;
      self.gol2_isPaused = false;
      self.gol2_intervalId = setInterval(function(){
        self.gol2_checkBoard();
        self.gol2_drawLife();
      }, self.gol2_lifeSpeed);  
    };

    // Pause gol2
    this.gol2_pauseLife = function() {
      if(!this.gol2_isPaused){
        clearInterval(this.gol2_intervalId);
        this.gol2_isPaused = true;
      }
    };

    // Callback for mousedown on gol2 canvas
    this.gol2_getPosition = function(event){
      // Get reference to proper 'this' context
      var self = this;
      var currentBoard = self.gol2_lifeBoard1;
      if(!self.gol2_board1isCurrent){
        currentBoard = self.gol2_lifeBoard2;
      }
      // Get mouse position
      var x = event.pageX;
      var y = event.pageY;
      // Get x and y relative to canvas
      x -= self.gol2_canvas.offsetLeft;
      y -= self.gol2_canvas.offsetTop;
      // Get coordinates to paint current cell
      var adjX = Math.floor(x/(self.gol2_cellSize+1)) * (self.gol2_cellSize+1) + 1;
      var adjY = Math.floor(y/(self.gol2_cellSize+1)) * (self.gol2_cellSize+1) + 1;
      // Get position of cell in board array
      var colX = Math.floor(x/(self.gol2_cellSize+1));
      if(x<(self.gol2_cellSize+2)){colX=0;}
      var rowY = Math.floor(y/(self.gol2_cellSize+1));
      if(y<(self.gol2_cellSize+2)){rowY=0;}
      // Change selected cell to live state 1 color
      if(currentBoard[rowY][colX].state === 0){
        self.gol2_ctx.fillStyle = self.gol2_stateColors[1];
        self.gol2_ctx.fillRect(adjX,adjY,self.gol2_cellSize,self.gol2_cellSize);
        currentBoard[rowY][colX].state = 1;
      }
      // Change selected cell to dead
      else {
        self.gol2_ctx.fillStyle = self.gol2_cellColor;
        self.gol2_ctx.fillRect(adjX,adjY,self.gol2_cellSize,self.gol2_cellSize);
        currentBoard[rowY][colX].state = 0;
      }
    };
  };

  /////////////////////////////////////////////
  //  External functions to be called by user
  /////////////////////////////////////////////

  // Basic gol2 operations
  // Setup blank board
  Gol2.prototype.setupLife = function(){
    this.gol2_drawEmptyBoard();
    this.gol2_clearLife(this.gol2_lifeBoard1);
    this.gol2_clearLife(this.gol2_lifeBoard2);
    // Let user select initial live cells
    this.gol2_canvas.addEventListener("mousedown", this.gol2_getPosition.bind(this), false);
  };
  // Play current gol2 board
  Gol2.prototype.playLife = function(){
    this.gol2_canvas.removeEventListener("mousedown", this.gol2_getPosition.bind(this), false);
    this.gol2_playLife();
  };
  // Pause
  Gol2.prototype.pauseLife = function(){
    this.gol2_pauseLife();
    this.gol2_canvas.addEventListener("mousedown", this.gol2_getPosition.bind(this), false);
  };
  // Reset the board
  Gol2.prototype.clearLife = function(){
    this.gol2_pauseLife();
    this.gol2_clearLife(this.gol2_lifeBoard1);
    this.gol2_clearLife(this.gol2_lifeBoard2);
    this.gol2_drawLife();
    gol2_canvas.addEventListener("mousedown", this.gol2_getPosition.bind(this), false);
  };
  // Change interval in ms of lifecycles
  Gol2.prototype.setLifeSpeed = function(newLifeSpeed){
    this.gol2_lifeSpeed = newLifeSpeed;
    // Keep gol2 running if currently running
    if(!this.gol2_isPaused){
      this.gol2_playLife();
    }
  };
  // Fill board with randomly populated game of life
  // Random group of cells will be centered and 
  // occupy 1/3 of the board's width and height by default
  Gol2.prototype.setSampleBoard = function(){
    this.gol2_pauseLife();
    this.gol2_clearLife(this.gol2_lifeBoard1);
    this.gol2_clearLife(this.gol2_lifeBoard2); 
    var xPos = 0, yPos = 0; 
    // Get whole number value for 1/5 of board width, height
    var quarterBoardWidth = Math.floor(this.gol2_boardCellWidth * .33);
    var quarterBoardHeight = Math.floor(this.gol2_boardCellHeight * .33);
    // Get a random value of 1 or 0
    function getRandomCell() {
      return Math.floor(Math.random() * 2);
    }
    if(this.gol2_board1isCurrent){
      for(yPos=quarterBoardHeight;yPos<=(2*quarterBoardHeight);yPos++){
        for(xPos=quarterBoardWidth;xPos<=(2*quarterBoardWidth);xPos++){
          this.gol2_lifeBoard1[yPos][xPos] = {state: getRandomCell()};
        }
      }
    }
    if(!this.gol2_board1isCurrent){
      for(yPos=quarterBoardHeight;yPos<=(2*quarterBoardHeight);yPos++){
        for(xPos=quarterBoardWidth;xPos<=(2*quarterBoardWidth);xPos++){
          this.gol2_lifeBoard2[yPos][xPos] = {state: getRandomCell()};
        }
      }  
    }
    this.gol2_drawLife();
  };

  // Register the gol2 object to the global namespace
  window.Gol2 = Gol2;
}(window));
