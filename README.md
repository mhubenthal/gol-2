###  Conway's Game of Life implemented in Javascript using the ```<canvas>``` tag.

Include ```<canvas id="gol_canvas"></canvas>``` on your page. 
Include the gol-2.js script, the ```gol``` object will be attached to
the global context.
Call ```gol.setupLife()``` first to load the blank board.

Call ```gol.playLife();``` to get things going. ```gol.pauseLife();``` and ```gol.clearLife();
``` are also included for convenience.

The ```gol``` canvas allows the user to select cells to make alive or dead with the cursor.

The board can also be customized on the fly with ```gol.setSize();```, ```gol.setGridColor();```, ```gol.setCellColor();``` and ```gol.setLifeSpeed();```.

(Note: Extremely large gol boards have not been tested for performance. The default size is 60 cells wide by 30 cells tall.) 
