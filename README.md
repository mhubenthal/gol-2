###  Conway's Game of Life implemented in JavaScript using the ```<canvas>``` tag.

Include ```<canvas id="yourUniqueId"></canvas>``` on your page. 
Include the gol-2.js script, call ```var yourGol2 = new Gol2('yourUniqueId', {boardWidth: 60, boardHeight: 30, cellSize: 10, lifeSpeed: 250});``` to instantiate your object. The 'options' object is optional, and any number of the options may be specified. (The default values are those listed in the previous code snippet.)

(Note: Extremely large boards have not been tested for performance.)

Call ```yourGol2.setupLife()``` first to load the blank board.

Call ```yourGol2.playLife();``` to get things going. ```yourGol2.pauseLife();``` and ```yourGol2.clearLife();
``` are also included for convenience.

```Gol2``` lets the user select cells to make alive or dead with the cursor.

The board can also be customized on the fly with ```yourGol2.setLifeSpeed();```.