// http://www.w3schools.com/tags/ref_canvas.asp
// http://www.sitepoint.com/html5-canvas-animation/

var GAME = GAME || {

    // Settings
    t: 0,
    frameInterval: 40, // Default 25
    canvas: null,
    context: null,
    staticCanvas: null,
    staticContext: null,
    cellSize: 30, // Cell size in pixels
    animationSpeed: 6, // 1..cellSize, default 3
    enemySpeed: 3,
    hero: null, // Movable item
    cellsX: 24, // Number of horizontal cells
    cellsY: 16, // Number of vertical cells
    objects: [],
    staticObjects: [],
    allObjects: [],
    score: 0,
    randomMovementDistance: 6, // Max number of cells to move randomly
    randomMovementQueue: 2, // Movement queue size
    timeLeft: 30, // Time limit in seconds

    heroMap: [{"x":14,"y":6}],
    enemiesMap: [{"x":16,"y":1},{"x":1,"y":14},{"x":9,"y":12},{"x":16,"y":12},{"x":22,"y":10},{"x":6,"y":0},{"x":1,"y":5}],
    coinsMap: [{"x":4,"y":1},{"x":9,"y":0},{"x":0,"y":11},{"x":4,"y":14},{"x":7,"y":10},{"x":11,"y":15},{"x":14,"y":14},{"x":12,"y":1},{"x":20,"y":14},{"x":22,"y":13},{"x":20,"y":12},{"x":23,"y":0}],
    wallsMap: [{"x":3,"y":0},{"x":3,"y":1},{"x":3,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":5,"y":3},{"x":8,"y":3},{"x":9,"y":3},{"x":10,"y":2},{"x":10,"y":1},{"x":10,"y":0},{"x":0,"y":9},{"x":1,"y":9},{"x":4,"y":9},{"x":5,"y":9},{"x":6,"y":15},{"x":6,"y":14},{"x":6,"y":10},{"x":6,"y":9},{"x":6,"y":11},{"x":7,"y":9},{"x":8,"y":9},{"x":10,"y":9},{"x":9,"y":9},{"x":11,"y":9},{"x":12,"y":9},{"x":12,"y":10},{"x":12,"y":12},{"x":12,"y":11},{"x":12,"y":13},{"x":12,"y":15},{"x":12,"y":14},{"x":10,"y":4},{"x":10,"y":3},{"x":10,"y":7},{"x":10,"y":8},{"x":11,"y":3},{"x":12,"y":3},{"x":15,"y":3},{"x":16,"y":3},{"x":17,"y":3},{"x":18,"y":3},{"x":18,"y":4},{"x":19,"y":3},{"x":22,"y":3},{"x":23,"y":3},{"x":18,"y":7},{"x":18,"y":8},{"x":13,"y":9},{"x":17,"y":9},{"x":18,"y":9},{"x":14,"y":9},{"x":18,"y":10},{"x":18,"y":11},{"x":18,"y":13},{"x":18,"y":12},{"x":18,"y":14},{"x":18,"y":15}],
    
    directions: ['left', 'right', 'up', 'down'],


    init: function () {
        window.onkeydown = function(e){
            return GAME.hero.keyDown(e.keyCode);
        };
        window.onkeyup = function(e){
            GAME.hero.keyUp(e.keyCode);
        };
        
        var field = document.getElementById("gameField");
        field.style.width = this.cellsX * this.cellSize + "px";
        field.style.height = this.cellsY * this.cellSize + "px";
        
        this.staticCanvas = document.getElementById("background");
        this.staticCanvas.width = this.cellsX * this.cellSize;
        this.staticCanvas.height = this.cellsY * this.cellSize;
        this.staticContext = this.staticCanvas.getContext("2d");
        
        this.canvas = document.getElementById("items");
        this.canvas.width = this.cellsX * this.cellSize;
        this.canvas.height = this.cellsY * this.cellSize;
        this.context = this.canvas.getContext("2d");

        this.initStageObjects();

        this.loop = setInterval(this.updateStage, this.frameInterval);
    },

    initStageObjects: function () {

        // Init walls
        for (var i=0; i < this.wallsMap.length; i++) {
            this.staticObjects.push(new Wall(this.wallsMap[i]));
        }

        // Init coins
        for (var i=0; i < this.coinsMap.length; i++) {
            this.staticObjects.push(new Coin(this.coinsMap[i], i));
        }

        // Init hero
        this.hero = new Hero(this.heroMap[0], 0);
        this.objects.push(this.hero);

        // Init enemies
        for (var i=0; i < this.enemiesMap.length; i++) {
            this.objects.push(new Enemy(this.enemiesMap[i], i));
        }
        
        this.renderStatic();
    },

    updateStage: function () {
        GAME.t += GAME.frameInterval;
        GAME.updateTime();
        GAME.clearCanvas();
        GAME.updateStageObjects();
        GAME.drawInfo();
    },

    drawInfo: function() {
        this.context.font="40px Impact";
        this.context.fillStyle="green";
        this.context.fillText(this.score, this.canvas.width-50, this.canvas.height-20, 50);
        
        this.context.fillStyle="orange";
        this.context.fillText(this.timeLeft, this.canvas.width-120, this.canvas.height-20, 50);
    },
    
    stop: function(text, color) {
        this.objects = [];
        this.staticObjects = [];
        this.staticContext.font = "40px Impact";
        this.staticContext.fillStyle = color;
        this.staticContext.fillText(text, this.canvas.width-420, this.canvas.height-250);
        
        clearInterval(this.loop);
    },

    updateStageObjects: function () {
        this.allObjects = this.objects.concat(this.staticObjects);
        
        var x = GAME.hero.x;
        var y = GAME.hero.y;
        GAME.hero.canMove = true;

        for (var i=0; i < this.objects.length; i++) {            
            this.objects[i].draw();
        }
    },
    
    renderStatic: function() {
        this.staticContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (var i=0; i < this.staticObjects.length; i++) {
            this.staticObjects[i].draw();
        }
    },

    clearCanvas: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    findDistance: function(i1, i2) {
        return Math.sqrt( Math.pow(i2.x - i1.x, 2) + Math.pow(i2.y - i1.y, 2) );
    },
    
    checkScore: function() {
        if (this.score === this.coinsMap.length)
            this.stop("Won!", "green");
    },
    
    updateTime: function() {
        if (this.t % 1000 === 0)
            this.timeLeft--;
        
        if (this.timeLeft === 0)
            this.stop("Time is up!", "orange");
    }

};






var Item = createClass({
    construct: function(cell, id) {
        this.direction = 'down'; // Starting direction
        this.x = cell.x * GAME.cellSize; // Pixels from left
        this.y = cell.y * GAME.cellSize; // Pixels from top
        this.vx = 0; // Horisontal velosity
        this.vy = 0; // Vertical velosity
        this.step = GAME.animationSpeed; // Each frame movement in pixels
        this.cellX = cell.x;
        this.cellY = cell.y;
        this.canMove = true;
        this.stepEndEvents = [];
        this.type = null;
        this.id = id;
    },
    
    checkPos: function(x, y) {
        this.canMove = true;
        var distance = GAME.cellSize;
        
        if (this.type === "hero") {
            distance = GAME.findDistance({x: 0, y: 0}, {x: this.vx, y: this.vy});
        }
        
        for (var i=0; i < GAME.allObjects.length; i++) {
            // Check distance to hero
            if (GAME.findDistance(GAME.allObjects[i], {x: x, y: y}) < distance) {
                
                if (this.type === "hero") {
                    switch(GAME.allObjects[i].type) {                     
                        case "coin" :
                            GAME.allObjects[i].collect();
                            break;

                        case "enemy" :
                            GAME.stop("Busted!", "red");
                            return;
                            break

                        case "wall" :
                            this.canMove = false;
                            break
                    }
                } else if (this.type === "enemy") {
                    switch(GAME.allObjects[i].type) {                     
                        case "hero" :
                            GAME.stop("Busted!", "red");
                            return;
                            break

                        case "wall" :
                            this.canMove = false;
                            break
                            
                        case "enemy" :
                            if (this.id !== GAME.allObjects[i].id)
                                this.canMove = false;
                            break
                    }
                }
            }
        }
    },
    

    checkPosition: function(x, y, oldX, oldY) {
        
        this.checkPos(x, y);
        
        // If marked as non-movable
        if (!this.canMove)
            return false;
        
        // Check canvas limits
        if (x < 0 || x > GAME.canvas.width - GAME.cellSize) {
            this.vx = 0;
            return false;
        }
        if (y < 0 || y > GAME.canvas.height - GAME.cellSize) {
            this.vy = 0;
            return false;
        }
        
        return true;
    },
    
    animate: function() {
        // No move planned
        if (this.vx === 0 && this.vy === 0)     
            return;
        
        var lastMove = true; // Is it last animation in move
        var inGrid = false;
        var absVX = this.vx;
        var absVY = this.vy;
        var signX = 1;
        var signY = 1;
        var x = this.x;
        var y = this.y;
        var vx = this.vx;
        var vy = this.vy;
                
        if (this.vx < 0) {
            absVX *= -1;
            signX *= -1;
        }
        
        if (this.vy < 0) {
            absVY *= -1;
            signY *= -1;
        }
        
        if (absVX > 0) {
            // In grid now
            if (this.x % GAME.cellSize === 0)
                inGrid = true;
                
            // Last animation in step
            if (absVX <= this.step) {
                x += absVX * signX;
                vx = 0;
            // Non-last animation
            } else {
                vx -= this.step * signX;
                x += this.step * signX;
                lastMove = false;
            }
        }

        if (absVY > 0) {
            // In grid now
            if (this.y % GAME.cellSize === 0)
                inGrid = true;
            
            // Last animation in step
            if (absVY <= this.step) {
                y += absVY * signY;
                vy = 0;
            // Non-last animation
            } else {
                vy -= this.step * signY;
                y += this.step * signY;
                lastMove = false;
            }
        }
        
        if (inGrid && !this.checkPosition(x, y, this.x, this.y)) {
            this.onStepEnd();
            this.vx = 0;
            this.vy = 0;
            return;
        }
        
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;

        if (lastMove) {
            this.onStepEnd();
        }
    },
    
    fixPosition: function() {
        this.cellX = Math.round(this.x / GAME.cellSize);
        this.cellY = Math.round(this.y / GAME.cellSize);
        this.x = this.cellX * GAME.cellSize;
        this.y = this.cellY * GAME.cellSize;
    },

    // Raise event
    onStepEnd: function() {
        this.stepEndEvents.forEach(function(callback){
            callback.call();
        });
        this.fixPosition();
    }
});


var Enemy = createClass({
    extend: Item,

    construct: function(cell) {
        Item.call(this, cell); // Parent constructor call
        this.type = 'enemy';
        this.step = GAME.enemySpeed;
        this.moveQueue = [];
        this.planMovement(); // Generate first random movement
        this.move();
    },

    draw: function() {        
        this.move();
        this.animate();
        
        GAME.context.fillStyle = 'red';
        GAME.context.fillRect(this.x, this.y, GAME.cellSize, GAME.cellSize);

    },

    planMovement: function() {
        while (this.moveQueue.length < GAME.randomMovementQueue) {
            var movement = {};
            movement.direction = GAME.directions[Math.floor(Math.random() * GAME.directions.length)]; // Random array element
            movement.distance = Math.floor(Math.random() * (GAME.randomMovementDistance - 1) + 1) * GAME.cellSize; // Random number from range

            this.moveQueue.push(movement);
        }
    },

    move: function() {
        if (this.vx !== 0 || this.vy !== 0)            
            return;
        
        if (this.moveQueue.length > 0) {
            var movement = this.moveQueue.shift();
            
            switch (movement.direction) {
                case 'up' :
                    this.vy = -movement.distance;
                    break;
                
                case 'down' :
                    this.vy = movement.distance;
                    break;
                    
                case 'left' :
                    this.vx = -movement.distance;
                    break;
                    
                case 'right' :
                    this.vx = movement.distance;
                    break;
            }
        }

        this.planMovement();
    }
});







var Hero = createClass({
    extend: Item,

    construct: function(cell) {
        Item.call(this, cell); // Parent constructor call
        //this.stepEndEvents.push(function(){GAME.hero.fixPosition();});
        this.type = 'hero';
        this.pressedKeys = {38: false, 40: false, 37: false, 39: false};
    },
    
    keyDown: function(key) {
        if (key in this.pressedKeys) {
            this.pressedKeys[key] = true;
            return false;
        }
    },
    
    keyUp: function(key) {
        if (key in this.pressedKeys) {
            this.pressedKeys[key] = false;
        }
    },

    manipulate: function() {
        if (this.pressedKeys[38]) {
            this.direction = 'up';
            this.setVY(-GAME.cellSize);
        }
        if (this.pressedKeys[40]) {
            this.direction = 'down';
            this.setVY(GAME.cellSize);
        }
        if (this.pressedKeys[37]) {
            this.direction = 'left';
            this.setVX(-GAME.cellSize);
        }
        if (this.pressedKeys[39]) {
            this.direction = 'right';
            this.setVX(GAME.cellSize);
        }
    },
    
    setVX: function(px) {
        this.vx = (this.vx === 0) ? px : this.vx;
    },
    
    setVY: function(px) {
        this.vy = (this.vy === 0) ? px : this.vy;
    },

    draw: function() {
        this.manipulate();
        this.animate();
    
        ////// Useless gradient generation
            var x0 = this.x;
            var y0 = this.y + GAME.cellSize;
            var x1 = this.x;
            var y1 = this.y;

            switch (this.direction) {
                case 'down' :
                    y0 -= GAME.cellSize;
                    y1 += GAME.cellSize;
                    break;

                case 'left' :
                    x0 += GAME.cellSize;
                    y0 -= GAME.cellSize;
                    break;

                case 'right' :
                    y0 -= GAME.cellSize;
                    x1 += GAME.cellSize;
                    break;
            }

            var gradient = GAME.context.createLinearGradient(x0, y0, x1, y1);
            gradient.addColorStop(0,"green");
            gradient.addColorStop(1,"white");

            GAME.context.fillStyle=gradient;
            GAME.context.fillRect(this.x, this.y, GAME.cellSize, GAME.cellSize);
        //////
    }
});







function Wall(cell) {
    this.x = cell.x * GAME.cellSize;
    this.y = cell.y * GAME.cellSize;
    this.canMove = false;
    this.type = 'wall';

    this.draw = function() {
        GAME.staticContext.fillStyle='black';
        GAME.staticContext.fillRect(this.x, this.y, GAME.cellSize, GAME.cellSize);
    };
}



function Coin(cell, id) {
    this.id = id;
    this.x = cell.x * GAME.cellSize;
    this.y = cell.y * GAME.cellSize;
    this.canMove = true;
    this.type = 'coin';
    this.deleted = false; // If true - instance will be deleted on next loop

    this.draw = function() {
        GAME.staticContext.fillStyle='yellow';
        GAME.staticContext.fillRect(this.x, this.y, GAME.cellSize, GAME.cellSize);
    };

    this.collect = function() {
        for (var i=0; i < GAME.staticObjects.length; i++) {
            if (GAME.staticObjects[i].id === this.id)
                GAME.staticObjects.splice(i, 1); // Delete element
                continue;
        }
        
        GAME.renderStatic();
        GAME.score++;
        GAME.checkScore();
    };
}





















// Levels editor. Generates items jsons
var EDITOR = EDITOR || {

    type: "wall",

    seedHero: function() {
        this.add(grid, "hero", GAME.heroMap[0].x, GAME.heroMap[0].y);
    },

    seedWalls: function() {
        for (var i=0; i < GAME.wallsMap.length; i++) {
            this.add(grid, "wall", GAME.wallsMap[i].x, GAME.wallsMap[i].y);
        }
    },

    seedCoins: function() {
        for (var i=0; i < GAME.coinsMap.length; i++) {
            this.add(grid, "coin", GAME.coinsMap[i].x, GAME.coinsMap[i].y);
        }
    },
    
    seedEnemies: function() {
        for (var i=0; i < GAME.enemiesMap.length; i++) {
            this.add(grid, "enemy", GAME.enemiesMap[i].x, GAME.enemiesMap[i].y);
        }
    },

    add: function(to, type, x, y) {
        var cellClass = 'x-'+x+' y-'+y+' '+type;

        to.append('<div class="'+cellClass+'" data-x="'+x+'" data-y="'+y+'"></div>');
    },

    getMap: function(from) {
        var map = [];
        from.find("."+this.type).each(function(){
            map.push({x: $(this).data("x"), y: $(this).data("y")});
        });

        console.log(JSON.stringify(map));
    }
}



















// http://habrahabr.ru/post/132698/
function createClass(data)
{
	var abstracts = data.abstracts || [],
	statics = data.statics || {},
	extend = data.extend || [];

	if(!(extend instanceof Array))
		extend  = [extend];

	// define constructor
	var constructor;
	if(data.construct) {
		constructor = data.construct;
	} else if(extend.length) {
		constructor = function() {
			for(var i=0; i<extend.length; i++) {
				extend[i].apply(this, arguments);
			}
		}
	} else {
		constructor = function() {};
	}

	// prototype for our class.
	var proto = {};

	delete data.construct;
	delete data.extend;


	// borrow methods from parent classes
	for(var i=0; i<extend.length; i++) {
		var parent = extend[i];

		// static constructor
		if( typeof parent.construct == "function")
			parent.construct.call(constructor);

		// copy static methods
		for(var p in parent) {
			if (typeof parent[p] != "function" || p == "construct") // copy only functions
				continue;
			constructor[p] = parent[p];
		}

		// Copy prototype methods
		for(var p in parent.prototype) {
			if (typeof parent.prototype[p] != "function" || p == "constructor")
				continue;
			proto[p] = parent.prototype[p];
		}
	}

	// internal methods
	proto.instanceOf = function(_class) {
		if(arguments.length > 1) {
			var res = true;
			for(var i=0; i<arguments.length; i++)
				res = res && this.instanceOf(arguments[i]);
			return res;
		}

		if(constructor === _class)
			return true;

		for(var i=0; i<extend.length; i++) {
			if( extend[i].prototype.instanceOf.call(this, _class) )
				return true;
		}

		return _class === Object;
	};

	// rest of data are prototype methods
	for(var p in data) {
		if (typeof data[p] != "function") // copy only functions
			continue;
		proto[p] = data[p];
	}

//	proto.constructor = constructor;
	constructor.prototype = proto;
	constructor.fn = proto; // short case

	// Finally, return the constructor function
	return constructor;
}