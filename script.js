// http://www.w3schools.com/tags/ref_canvas.asp
// http://www.sitepoint.com/html5-canvas-animation/
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

var GAME = GAME || {

    // Settings
    t: 0,
    frameInterval: 40, // Default 25
    canvas: null,
    context: null,
    staticCanvas: null,
    staticContext: null,
    frontCanvas: null,
    frontContext: null,
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
    imgPath: 'img/',
    darkness: false, // Should we use gradient foreground layer
    wallColor: 'darkgray',
    wallFile: 'wall.png',
    bgFile: 'floor.png',
    hudColor: '#500',
    hudHeight: 3, // Height bottom HUD area in cells

    heroMap: [{"x":14,"y":6}],
    enemiesMap: [{"x":16,"y":1},{"x":1,"y":14},{"x":9,"y":12},{"x":16,"y":12},{"x":22,"y":10},{"x":6,"y":0},{"x":1,"y":5}],
    coinsMap: [{"x":4,"y":1},{"x":9,"y":0},{"x":0,"y":11},{"x":4,"y":14},{"x":7,"y":10},{"x":11,"y":15},{"x":14,"y":14},{"x":12,"y":1},{"x":20,"y":14},{"x":22,"y":13},{"x":20,"y":12},{"x":23,"y":0}],
    wallsMap: [{"x":3,"y":0},{"x":3,"y":1},{"x":3,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":5,"y":3},{"x":8,"y":3},{"x":9,"y":3},{"x":10,"y":2},{"x":10,"y":1},{"x":10,"y":0},{"x":0,"y":9},{"x":1,"y":9},{"x":4,"y":9},{"x":5,"y":9},{"x":6,"y":15},{"x":6,"y":14},{"x":6,"y":10},{"x":6,"y":9},{"x":6,"y":11},{"x":7,"y":9},{"x":8,"y":9},{"x":10,"y":9},{"x":9,"y":9},{"x":11,"y":9},{"x":12,"y":9},{"x":12,"y":10},{"x":12,"y":12},{"x":12,"y":11},{"x":12,"y":13},{"x":12,"y":15},{"x":12,"y":14},{"x":10,"y":4},{"x":10,"y":3},{"x":10,"y":7},{"x":10,"y":8},{"x":11,"y":3},{"x":12,"y":3},{"x":15,"y":3},{"x":16,"y":3},{"x":17,"y":3},{"x":18,"y":3},{"x":18,"y":4},{"x":19,"y":3},{"x":22,"y":3},{"x":23,"y":3},{"x":18,"y":7},{"x":18,"y":8},{"x":13,"y":9},{"x":17,"y":9},{"x":18,"y":9},{"x":14,"y":9},{"x":18,"y":10},{"x":18,"y":11},{"x":18,"y":13},{"x":18,"y":12},{"x":18,"y":14},{"x":18,"y":15}],
    directions: ['left', 'right', 'up', 'down'],


    init: function (data) {
        if (typeof(data) === 'object') {
            for (var p in data) {  
                this[p] = data[p];
            }
        }
        
        window.onkeydown = function(e){
            return GAME.hero.keyDown(e.keyCode);
        };
        window.onkeyup = function(e){
            GAME.hero.keyUp(e.keyCode);
        };
        
        var field = document.getElementById("gameField");
        field.style.width = this.cellsX * this.cellSize + "px";
        field.style.height = (this.cellsY + this.hudHeight) * this.cellSize + "px";
                
        // Set background image
        field.style.background = 'url("'+this.imgPath+this.bgFile+'") repeat';
        
        this.staticCanvas = document.getElementById("background");
        this.staticCanvas.width = this.cellsX * this.cellSize;
        this.staticCanvas.height = this.cellsY * this.cellSize;
        this.staticContext = this.staticCanvas.getContext("2d");
        
        this.canvas = document.getElementById("items");
        this.canvas.width = this.cellsX * this.cellSize;
        this.canvas.height = this.cellsY * this.cellSize;
        this.context = this.canvas.getContext("2d");
        
        this.frontCanvas = document.getElementById("foreground");
        this.frontCanvas.width = this.cellsX * this.cellSize;
        this.frontCanvas.height = (this.cellsY + this.hudHeight)* this.cellSize;
        this.frontContext = this.frontCanvas.getContext("2d");

        this.initStageObjects();

        this.loop = setInterval(this.updateStage, this.frameInterval);
    },

    initStageObjects: function () {
        
        // Init walls
        if (this.wallFile) {
            var wallImg = new Image();
            wallImg.src = this.imgPath + this.wallFile;
            wallImg.onload = function () {
                for (var i=0; i < GAME.wallsMap.length; i++) {
                    var wall = new Wall(GAME.wallsMap[i]);
                    wall.img.source = wallImg;
                    GAME.staticObjects.push(wall);
                }
            };
        } else {
            for (var i=0; i < this.wallsMap.length; i++) {
                this.staticObjects.push(new Wall(this.wallsMap[i]));
            }
        }
        
        if (this.darkness)
            this.wallColor = 'black';

        // Init coins
        var coinsImg = new Image();
        coinsImg.src = this.imgPath + 'coins.png';
        coinsImg.onload = function () {
            var variants = Math.floor(coinsImg.width / GAME.cellSize);
            
            for (var i=0; i < GAME.coinsMap.length; i++) {
                var coin = new Coin(GAME.coinsMap[i], i);
                coin.img.source = coinsImg;
                coin.img.current = Math.floor(Math.random() * variants);
                GAME.staticObjects.push(coin);
            }
            
            GAME.renderStatic();
        };

        // Init hero
        this.hero = new Hero(this.heroMap[0], 0);
        this.objects.push(this.hero);
        var heroImg = new Image();
        heroImg.onload = function () {
            GAME.hero.img.source = heroImg;
        };
        heroImg.src = this.imgPath + 'hero.png';

        // Init enemies
        var enemyImg = new Image();
        enemyImg.src = this.imgPath + 'enemy.png';
        enemyImg.onload = function () {
            for (var i=0; i < GAME.enemiesMap.length; i++) {
                var enemy = new Enemy(GAME.enemiesMap[i], i);
                enemy.img.source = enemyImg;
                GAME.objects.push(enemy);
            }
        };
        
        this.renderStatic();
    },

    updateStage: function () {
        GAME.t += GAME.frameInterval;
        GAME.clearCanvas();
        GAME.updateTime();
        GAME.updateStageObjects();
        GAME.drawInfo();
    },

    drawInfo: function() {
        
        var hudY = this.frontCanvas.height - this.hudHeight*GAME.cellSize;
        
        this.frontContext.fillStyle=this.hudColor;
        this.frontContext.fillRect(0, hudY, this.frontCanvas.width, this.frontCanvas.height);
        
        this.frontContext.font="30px Impact";
        this.frontContext.fillStyle="lawngreen";
        this.frontContext.fillText(
                'Собрано: ' + this.score,
                this.canvas.width - 210,
                this.frontCanvas.height - 32,
                200); // Max width
        
        this.frontContext.fillStyle="orange";
        this.frontContext.fillText(
                this.timeLeft + ' сек.',
                50,
                this.frontCanvas.height - 32,
                200);
    },
    
    stop: function(text, color) {
        
        this.objects = [];
        this.staticObjects = [];
        this.darkness = false;
        this.frontContext.fillStyle=color;
        this.frontContext.fillRect(0, 0, GAME.cellSize*GAME.cellsX, GAME.cellSize*GAME.cellsY);
        this.frontContext.font = "40px Impact";
        this.frontContext.fillStyle = 'white';
        this.frontContext.fillText(text, this.canvas.width-440, this.canvas.height-250);
        
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
        this.frontContext.clearRect(0, 0, this.frontCanvas.width, this.frontCanvas.height);
    },
    
    findDistance: function(i1, i2) {
        return Math.sqrt( Math.pow(i2.x - i1.x, 2) + Math.pow(i2.y - i1.y, 2) );
    },
    
    checkScore: function() {
        if (this.score === this.coinsMap.length)
            this.stop("Все собрано!", "green");
    },
    
    updateTime: function() {
        if (this.t % 1000 === 0)
            this.timeLeft--;
        
        if (this.timeLeft === 0)
            this.stop("Кончилось время!", "orange");
    },
    
    renderImage: function(image, x, y, direction, item) {
        if (image.source === null)
            return;
        
        if (GAME.t % (GAME.frameInterval * 5) === 0 && (item.vx !== 0  || item.vy !== 0))
            image.current = (image.current === 0) ? 1 : 0;
                
        var sx = 0;
        var sy = image.current * GAME.cellSize;
        
        switch (direction) {
            case "down" :
                sx = 30;
                break;
                
            case "left" :
                sx = 60;
                break;
                
            case "right" :
                sx = 90;
                break;
        }
        
        GAME.context.drawImage(
            image.source,
            sx,
            sy,
            GAME.cellSize,
            GAME.cellSize,
            x,
            y,
            GAME.cellSize,
            GAME.cellSize
        );
    },
    
    renderRandomImage: function(image, x, y, context) {
        
        var sx = image.current * GAME.cellSize;
        
        context.drawImage(
            image.source,
            sx,
            0,
            GAME.cellSize,
            GAME.cellSize,
            x,
            y,
            GAME.cellSize,
            GAME.cellSize
        );
    },
    
    drawShadows: function() {
        var hx = GAME.hero.x + GAME.cellSize / 2;
        var hy = GAME.hero.y + GAME.cellSize / 2;
        
        for (var i=0; i < this.staticObjects.length; i++) {
            
            var wall = this.staticObjects[i];
            
            if (wall.type !== 'wall')
                continue;
            
            var ctx = GAME.frontContext;
            
            var x0=0;
            var y0=0;
            var x1=0;
            var y1=0;
            var x2=0;
            var y2=0;
            var x3=0;
            var y3=0;
            
            ctx.beginPath();
            
            // Тень пошла вниз
            if (hy < wall.y) {
                x0 = wall.x;
                x1 = wall.x + GAME.cellSize;
                y2 = y3 = GAME.cellsY * GAME.cellSize;
            } else {
                x0 = wall.x + GAME.cellSize;
                x1 = wall.x;
            }
            
            // Тень пошла направо
            if (hx < wall.x) {
                y0 = wall.y + GAME.cellSize;
                y1 = wall.y;
                x2 = x3 = GAME.cellsX * GAME.cellSize;
            } else {
                y0 = wall.y;
                y1 = wall.y + GAME.cellSize;
            }
            
            // Фиксим ситуацию с точками по позные стороны от героя
            if (wall.x < hx && hx < (wall.x+GAME.cellSize)) {
                x2 = 0;
                x3 = GAME.cellsX * GAME.cellSize;
            }
            
            if ((hy-GAME.cellSize / 2) >= (wall.y+GAME.cellSize)) {
                x2 = (y2 * (hx - x0) - hx*y0 + hy*x0) / (hy - y0);
                x3 = (y3 * (hx - x1) - hx*y1 + hy*x1) / (hy - y1);
            } else {
                y2 = (x2 * (hy - y0) - hy*x0 + hx*y0) / (hx - x0);
                y3 = (x3 * (hy - y1) - hy*x1 + hx*y1) / (hx - x1);
            }
            
//            function Factor(numb){
//		if (numb < 0){
//			return (" - "+Math.abs(numb));
//		}
//		return (" + "+numb);
//            }
//            
//            var A2 = hy - y0;
//            var B2 = x0 - hx;
//            var C2 = hx*y0 - x0*hy;
//            var s = A2+" x"+Factor(B2)+" y"+Factor(C2)+" = 0";
            
            
            ctx.moveTo(x2, y2);
            ctx.lineTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.lineWidth="1";
            ctx.strokeStyle="black"; // Fix thin lines beetwen areas
            ctx.stroke();
            ctx.fillStyle="black";
            
            ctx.fill();
        }
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
                            GAME.stop("Поймали!", "red");
                            return;
                            break

                        case "wall" :
                            this.canMove = false;
                            break
                    }
                } else if (this.type === "enemy") {
                    switch(GAME.allObjects[i].type) {                     
                        case "hero" :
                            GAME.stop("Поймали!", "red");
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
        this.img = {
            'source': null,
            'current': 0
        };
        this.moveQueue = [];
        this.planMovement(); // Generate first random movement
        this.move();
    },

    draw: function() {        
        this.move();
        this.animate();
        
        GAME.renderImage(this.img, this.x, this.y, this.direction, this);

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
            
            this.direction = movement.direction;
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
        this.img = {
            'source': null,
            'current': 0
        };
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
        
        GAME.renderImage(this.img, this.x, this.y, this.direction, this);
        
        if (GAME.darkness) {
            GAME.drawShadows();
            var grd = GAME
                    .frontContext
                    .createRadialGradient(this.x, this.y, GAME.cellSize*GAME.cellsX, this.x, this.y, 100);
            grd.addColorStop(0, 'black');
            grd.addColorStop(.8, 'black');
            grd.addColorStop(1, 'rgba(0,0,0,.01)');
            GAME.frontContext.fillStyle = grd;
            GAME.frontContext.fillRect(0,0,GAME.canvas.width,GAME.canvas.height);
        }
    }
});







function Wall(cell) {
    this.x = cell.x * GAME.cellSize;
    this.y = cell.y * GAME.cellSize;
    this.canMove = false;
    this.type = 'wall';
    this.img = {
            'source': null,
            'current': 0
        };

    this.draw = function() {
        if (GAME.wallFile) {
            GAME.renderRandomImage(this.img, this.x, this.y, GAME.staticContext);
        } else {    
            GAME.staticContext.fillStyle=GAME.wallColor;
            GAME.staticContext.fillRect(this.x, this.y, GAME.cellSize, GAME.cellSize);
        }
    };
}



function Coin(cell, id) {
    this.id = id;
    this.x = cell.x * GAME.cellSize;
    this.y = cell.y * GAME.cellSize;
    this.canMove = true;
    this.type = 'coin';
    this.deleted = false; // If true - instance will be deleted on next loop
    this.img = {
            'source': null,
            'current': 0
        };

    this.draw = function() {
        GAME.renderRandomImage(this.img, this.x, this.y, GAME.staticContext);
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