// http://www.w3schools.com/tags/ref_canvas.asp
// http://www.sitepoint.com/html5-canvas-animation/
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

var GAME = GAME || {

    // Settings
    t: 0,
    frameInterval: 40, // Default 40
    canvas: null,
    context: null,
    staticCanvas: null,
    staticContext: null,
    frontCanvas: null,
    frontContext: null,
    fullCanvas: null,
    fullContext: null,
    cellSize: 30, // Cell size in pixels
    animationSpeed: 6, // 1..cellSize, default 6
    enemySpeed: 2, // default 3
    hero: null, // Movable item
    cellsX: 24, // Number of horizontal cells
    cellsY: 16, // Number of vertical cells
    objects: [],
    staticObjects: [],
    allObjects: [],
    score: 0,
    level: 1,
    randomMovementDistance: 6, // Max number of cells to move randomly
    randomMovementQueue: 2, // Movement queue size
    timeLeft: 45, // Time limit in seconds
    imgPath: 'img/',
    hudHeight: 3, // Height bottom HUD area in cells
    directions: ['left', 'right', 'up', 'down'],
    map: null,
    heroMap: [{"x":1,"y":1}],
    enemiesMap: [],
    coinsMap: [],
    wallsMap: [],
    totalCoins: 92,
    maxDiscount: 20,
    singleDamage: 20, // Percentage of single damage
    loadQuery: [],
    timeIsUp: {source: null, current: 0},
    levelDone: {source: null, current: 0},
    death: {source: null, current: 0},
    intro: {source: null, current: 0},
    outtro: {source: null, current: 0},
    
    setDefaults: function () {
        clearInterval(this.loop);
        this.t = 0;
        this.map = null;
        this.levelScore = 0;
        this.timeLeft = 45;
        this.darkness = false; // Should we use gradient foreground layer
        this.ice = false; // Should hero skate
        this.fog = false;
        this.shadowColor = '#333';
        this.wallColor = '#555';
        this.wallFile = 'wall.png';
        this.bgFile = 'floor.png';
        this.loadQuery = [];
        this.objects = [];
        this.staticObjects = [];
    },
    
    nextTask: function () {
        if (this.loadQuery.length > 0) {
            if (this.totalLoadQueryLenght === undefined) {
                this.totalLoadQueryLenght = this.loadQuery.length;
            }
            $("#loaded").show().text(Math.round((1 - (this.loadQuery.length / this.totalLoadQueryLenght)) * 100) + '%');
            
            this.loadQuery.shift().call(this);
        } else {
            $("#loaded").text(100 + '%').fadeOut();
            
            if (this.level === 1) {
                this.renderRandomImage(this.intro, 0, 0, this.fullContext, 730, 580);
                setTimeout(function(){GAME.loop = setInterval(GAME.updateStage, GAME.frameInterval);}, 8000);
            } else {   
                this.loop = setInterval(this.updateStage, this.frameInterval);
            }
        }
    },

    init: function (data) {
        this.setDefaults();
        
        if (typeof(data) === 'object') {
            for (var p in data) {
                this[p] = data[p];
            }
        }
        
        if (this.map === null || typeof this.map !== "object") {
            this.getMap(function(data){
                GAME.init({map: data});
            });
            return;
        }
        
        this.loadQuery.push(function(){
            for (var property in this.map) {
                if (this.map.hasOwnProperty(property) && this.hasOwnProperty(property)) {
                    this[property] = this.map[property];
                }
            }
            this.nextTask();
        });
        
        // Preload background image
        this.loadQuery.push(function(){
            var bgImg = new Image();
            bgImg.src = this.imgPath+this.bgFile;
            bgImg.onload = function () {
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function(){
            var field = document.getElementById("gameField");
            field.style.width = this.cellsX * this.cellSize + "px";
            field.style.height = (this.cellsY + this.hudHeight) * this.cellSize + "px";

            // Set background image
            field.style.background = 'url("'+this.imgPath+this.bgFile+'") repeat';
            
            // Click event listener
            field.onmousedown = function(e){
                GAME.hero.clicked(
                        e.clientX - Math.floor(GAME.canvas.getBoundingClientRect().left),
                        e.clientY - Math.floor(GAME.canvas.getBoundingClientRect().top)
                );
            };
            field.onmouseup = function(){
                GAME.hero.unclicked();
            };
            
            // Touch event listener
            field.ontouchstart = function(e){
                GAME.hero.clicked(
                        e.touches[0].pageX - Math.floor(GAME.canvas.getBoundingClientRect().left),
                        e.touches[0].pageY - Math.floor(GAME.canvas.getBoundingClientRect().top)
                );
            };
            field.ontouchend = function(){GAME.hero.unclicked;};
            
            // Keyboard event listener
            window.onkeydown = function(e){
                return GAME.hero.keyDown(e.keyCode);
            };
            window.onkeyup = function(e){
                GAME.hero.keyUp(e.keyCode);
            };
            
            this.nextTask();
        });
        
        // Init sounds
        SOUND.init();
        
        this.loadQuery.push(function(){
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
            this.frontCanvas.height = this.cellsY * this.cellSize;
            this.frontContext = this.frontCanvas.getContext("2d");
            
            this.fullCanvas = document.getElementById("full-canvas");
            this.fullCanvas.width = this.cellsX * this.cellSize;
            this.fullCanvas.height = this.cellsY * this.cellSize + this.hudHeight * this.cellSize;
            this.fullContext = this.fullCanvas.getContext("2d");

            this.hudCanvas = document.getElementById("info");
            this.hudCanvas.width = this.cellsX * this.cellSize;
            this.hudCanvas.height = this.hudHeight * this.cellSize + 10; // Ten pixels overlay
            this.hudContext = this.hudCanvas.getContext("2d");
            
            this.nextTask();
        });
        
        this.initStageObjects();
        
        this.nextTask();
    },

    initStageObjects: function () {
        
        this.loadQuery.push(function() {
            if (this.darkness) {
                this.wallColor = this.shadowColor;
                this.wallFile = null;
            }
            this.nextTask();
        });
        
        this.loadQuery.push(function() {
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
                    GAME.renderStatic();
                    GAME.nextTask();
                };
            } else {
                for (var i=0; i < this.wallsMap.length; i++) {
                    this.staticObjects.push(new Wall(this.wallsMap[i]));
                }
                this.nextTask();
            }
        });

        this.loadQuery.push(function() {
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
                GAME.nextTask();
            };
        });

        this.loadQuery.push(function() {
            // Init hero
            this.hero = new Hero(this.heroMap[0], 0);
            this.objects.push(this.hero);
            var heroImg = new Image();
            heroImg.onload = function () {
                GAME.hero.img.source = heroImg;
                GAME.nextTask();
            };
            heroImg.src = this.imgPath + 'hero.png';
            this.hero.shine(1000);
            this.hero.health = 100;
            
            if (this.ice) {
                this.hero.stepEndEvents.push(function(){
                    GAME.hero.slide();
                });
            }
        });

        this.loadQuery.push(function() {
            // Init enemies
            var enemyImg = new Image();
            enemyImg.src = this.imgPath + 'enemy.png';
            enemyImg.onload = function () {
                for (var i=0; i < GAME.enemiesMap.length; i++) {
                    var enemy = new Enemy(GAME.enemiesMap[i], i);
                    enemy.img.source = enemyImg;
                    GAME.objects.push(enemy);
                }
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function(){
            var img = new Image();
            img.src = this.imgPath + 'time-is-up.png';
            img.onload = function () {
                GAME.timeIsUp.source = img;
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function(){
            var img = new Image();
            img.src = this.imgPath + 'level-done.png';
            img.onload = function () {
                GAME.levelDone.source = img;
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function(){
            var img = new Image();
            img.src = this.imgPath + 'death.png';
            img.onload = function () {
                GAME.death.source = img;
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function(){
            var img = new Image();
            img.src = this.imgPath + 'intro.png';
            img.onload = function () {
                GAME.intro.source = img;
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function(){
            var img = new Image();
            img.src = this.imgPath + 'outtro.png';
            img.onload = function () {
                GAME.outtro.source = img;
                GAME.nextTask();
            };
        });
        
        this.loadQuery.push(function() {
            this.renderStatic();
            this.drawInfo();
            this.nextTask();
        });
    },

    updateStage: function () {
        GAME.t += GAME.frameInterval;
        GAME.clearCanvas();
        GAME.updateTime();
        GAME.updateStageObjects();
    },

    drawInfo: function() {
        
        this.hudContext.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
        
        this.hudContext.textBaseline = "middle";
        this.hudContext.textAlign = "center";
        
        this.hudContext.font="30px Impact";
        this.hudContext.fillStyle="rgba(100,255,50,.5)";
        this.hudContext.fillText(
                "\u266C  " + this.score,
                this.hudCanvas.width - 170,
                this.hudCanvas.height - 42,
                200); // Max width
                
        this.hudContext.fillStyle="rgba(255,0,0,.4)";
        this.hudContext.fillText(
                "\u2764  " + this.hero.health,
                400,
                this.hudCanvas.height - 42,
                100); // Max width
        
        this.hudContext.fillStyle="rgba(255,200,0,.5)";
        this.hudContext.fillText(
                "\u25F7  " + this.timeLeft,
                275,
                this.hudCanvas.height - 42,
                125);
                
        this.hudContext.fillStyle="rgba(255,255,255,.3)";
        this.hudContext.fillText(
                'Уровень ' + this.level,
                100,
                this.hudCanvas.height - 42,
                175);
    },
    
    stop: function(text, color, file) {
        
        GAME.renderRandomImage(file, 0, 0, GAME.fullContext, 730, 580);
        
        this.objects = [];
        this.staticObjects = [];
        this.darkness = false;
        this.fog = false;
        this.fullContext.textAlign = "center";
        //this.frontContext.fillStyle=color;
        //this.frontContext.fillRect(0, 0, GAME.cellSize*GAME.cellsX, GAME.cellSize*GAME.cellsY);
        this.fullContext.font = "32px Impact";
        this.fullContext.fillStyle = "white";
        this.fullContext.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 200);
        
        clearInterval(this.loop);
        GAME.nextLevelTimeout = setTimeout(this.nextLevel, 5000);
    },
    
    nextLevel: function() {
        
        if (!GAME.map) {
            return;
        }
        
        if (GAME.map.last === true) {
            GAME.onWin();
            return;
        }
        
        clearTimeout(GAME.nextLevelTimeout);
            
        GAME.level++;
        GAME.init();
    },
    
    onDeath: function() {
        GAME.stop("", "red", GAME.death);
        SOUND.musicPlayer.pause();
        SOUND.onEvent("death");
    },
    
    onWin: function() {
        var discount = Math.floor(GAME.score / GAME.totalCoins * GAME.maxDiscount);
        
        if (discount > 20)
            discount = 20;
        
        GAME.stop("ДА! Все зомби взорвались, а ваша скидка "+ discount  +"%.", "#0c3", GAME.outtro);
        SOUND.musicPlayer.pause();
        SOUND.onEvent("win");
        clearTimeout(GAME.nextLevelTimeout);
        GAME.level = 0;
        this.getMap(function(data){
        });
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
        this.fullContext.clearRect(0, 0, this.fullCanvas.width, this.fullCanvas.height);
    },
    
    findDistance: function(i1, i2) {
        return Math.sqrt( Math.pow(i2.x - i1.x, 2) + Math.pow(i2.y - i1.y, 2) );
    },
    
    checkScore: function() {
        if (this.levelScore === this.coinsMap.length) {
            this.stop("", "green", this.levelDone);
            SOUND.musicPlayer.pause();
            SOUND.onEvent("done");
        }
    },
    
    updateTime: function() {
        if (this.t % 1000 === 0) {
            this.timeLeft--;
            this.drawInfo();
        }
        
        if (this.timeLeft === 0) {
            this.stop("", "orange", this.timeIsUp);
            SOUND.musicPlayer.pause();
            SOUND.onEvent("timeIsUp");
        }
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
    
    renderRandomImage: function(image, x, y, context, width, height) {
        
        var sx = image.current * GAME.cellSize;
        
        context.drawImage(
            image.source,
            sx,
            0,
            (width ? width : GAME.cellSize),
            (height ? height : GAME.cellSize),
            x,
            y,
            (width ? width : GAME.cellSize),
            (height ? height : GAME.cellSize)
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
            
            var x0=0,
                y0=0,
                x1=0,
                y1=0,
                x2=0,
                y2=0,
                x3=0,
                y3=0;
            
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
            
            // Фиксим ситуацию с точками тени по разные стороны от героя
            if (wall.x < hx && hx < (wall.x+GAME.cellSize)) {
                x2 = (y2 * (hx - x0) - hx*y0 + hy*x0) / (hy - y0);
                x3 = (y3 * (hx - x1) - hx*y1 + hy*x1) / (hy - y1);
            }
            
            if ((hy-GAME.cellSize / 2) >= (wall.y+GAME.cellSize)) {
                x2 = (y2 * (hx - x0) - hx*y0 + hy*x0) / (hy - y0);
                x3 = (y3 * (hx - x1) - hx*y1 + hy*x1) / (hy - y1);
            } else {
                y2 = (x2 * (hy - y0) - hy*x0 + hx*y0) / (hx - x0);
                y3 = (x3 * (hy - y1) - hy*x1 + hx*y1) / (hx - x1);
            }
            
            ctx.moveTo(x2, y2);
            ctx.lineTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.lineWidth="1";
            ctx.strokeStyle=GAME.shadowColor; // Fix thin lines beetwen areas
            ctx.stroke();
            ctx.fillStyle=GAME.shadowColor;
            
            ctx.fill();
        }
    },
    
    drawFog: function(x, y, diameter, threshold, startColor, endColor, context) {
        var grd = context
            .createRadialGradient(
                x,
                y,
                GAME.cellSize*GAME.cellsX,
                x,
                y,
                diameter
            );
        grd.addColorStop(0, endColor);
        grd.addColorStop(threshold, endColor);
        grd.addColorStop(1, startColor);
        context.fillStyle = grd;
        context.fillRect(0,0,GAME.canvas.width,GAME.canvas.height);
    },
    
    getMap: function(handleData) {
        $.ajax({
            type: "POST",
            url: "api.php",
            data: {level: GAME.level, score: GAME.score},
            success: function(data){
                handleData(JSON.parse(data));
            },
            dataType: "text"
        });
    },
    
    nextMusic: function(musicNbr) {
        GAME.musicNbr++;
        
        
    }

};

var SOUND = SOUND || {
    muted: false,
    soundsFolder: 'sounds/',
    musicNbr: 0,
    musicPlayer: null,
    fxPlayer: null,
    mute: null,
    musicFiles: ['music-1.mp3', 'music-2.mp3', 'music-3.mp3'],
    deathSounds: ['fail-1.mp3', 'fail-2.mp3', 'fail-3.mp3', 'fail-4.mp3'],
    coinSounds: ['coin-1.mp3', 'coin-2.mp3', 'coin-3.mp3'],
    doneSounds: ['win.mp3'],
    timeIsUpSounds: ['jingle-1.mp3'],
    winSounds: ['total-win.mp3'],
    damageSounds: ['damage-1.mp3', 'damage-2.mp3', 'damage-3.mp3'],
    
    init: function() {
        
        // Create background music player audio element
        if (this.musicPlayer===null) {
            this.musicPlayer = document.createElement('audio');

            document.body.appendChild(this.musicPlayer);
            
            // Change track on end
            this.musicPlayer.onended = function() {
                SOUND.nextMusic();
            };
        }
        
        SOUND.nextMusic();
        
        // Create FX player audio element
        if (this.fxPlayer === null) {
            this.fxPlayer = document.createElement('audio');
            document.body.appendChild(this.fxPlayer);
        }
        
        if (this.mute===null) {
            // Create mute element
            this.mute = document.createElement('a');
            this.mute.setAttribute('href', '#');
            this.mute.setAttribute('id', 'mute-sound');
            this.mute.className = 'not-muted';
            
            this.mute.addEventListener("click", function(event){
                SOUND.muted = !SOUND.muted;
                SOUND.fxPlayer.muted = SOUND.muted;
                SOUND.musicPlayer.muted = SOUND.muted;

                SOUND.mute.className = (SOUND.muted ? 'muted' : 'not-muted');

                event.stopPropagation();
            });
            document.getElementById("gameField").appendChild(this.mute);
        }
    },
    
    getRandom: function(namesArray) {
        return namesArray[Math.floor(Math.random() * namesArray.length)];
    },
    
    nextMusic: function() {
        var sound = this.getRandom(SOUND.musicFiles);
        
        SOUND.musicPlayer.setAttribute('src', SOUND.soundsFolder + sound);
        SOUND.musicPlayer.play();
    },
    
    onEvent: function(event) {
        var name = event+'Sounds';
        if (this.hasOwnProperty(name) && Array.isArray(this[name])) {
            var sound = this.getRandom(this[name]);
            
            this.fxPlayer.setAttribute('src', this.soundsFolder + sound);
            this.fxPlayer.play();
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
                            this.onDamage();
                            break

                        case "wall" :
                            // Can't move only if getting closer to wall, but not when going out
                            if (
                                GAME.findDistance(GAME.allObjects[i], {x: x, y: y}) <
                                GAME.findDistance(GAME.allObjects[i], this)
                            ) {
                                this.canMove = false;
                            }
                            break
                    }
                } else if (this.type === "enemy") {
                    switch(GAME.allObjects[i].type) {                     
                        case "hero" :
                            GAME.allObjects[i].onDamage();
                            break

                        case "wall" :
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
        
        var lastMove = true, // Is it last animation in move
            inGrid = false,
            absVX = this.vx,
            absVY = this.vy,
            signX = 1,
            signY = 1,
            x = this.x,
            y = this.y,
            vx = this.vx,
            vy = this.vy;
           
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

    construct: function(cell, id) {
        Item.call(this, cell, id); // Parent constructor call
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
        this.shineTime = 0;
        this.shineDuration = 0;
        this.shineColor = 'rgba(255,255,0,.5)';
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
    
    clicked: function(x, y) {
        
        this.pressedKeys = {38: false, 40: false, 37: false, 39: false};
        
        if (Math.abs(this.x + GAME.cellSize / 2 - x) > (GAME.cellSize / 2)) {
            if (x > this.x) {
                this.pressedKeys[39] = true;
            } else {
                this.pressedKeys[37] = true;
            }
        }
        
        if (Math.abs(this.y + GAME.cellSize / 2 - y) > (GAME.cellSize / 2)) {
            if (y > this.y) {
                this.pressedKeys[40] = true;
            } else {
                this.pressedKeys[38] = true;
            }
        }
    },
    
    unclicked: function() {
        this.pressedKeys = {38: false, 40: false, 37: false, 39: false};
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
        
        if (this.shineDuration) {
            this.drawShine();
        }
        
        GAME.renderImage(this.img, this.x, this.y, this.direction, this);
            
        if (GAME.darkness) {
            GAME.drawShadows();
            GAME.drawFog(this.x, this.y, 100, .8, 'rgba(0,0,0,.01)', 'black', GAME.frontContext);
        } else if (GAME.fog) {
            GAME.drawFog(this.x+GAME.cellSize/2, this.y+GAME.cellSize/2, 150, .6, 'rgba(200,200,200,.01)', 'rgba(200,200,200,.8)', GAME.frontContext);
        }
    },
    
    shine: function(duration, color) {
        this.shineTime = 0;
        this.shineDuration = duration;
        
        if (color)
            this.shineColor = color;
    },
    
    drawShine: function() {
        if (this.shineTime > this.shineDuration) {
            this.shineTime = 0;
            this.shineDuration = 0;
        }
        
        var radius = Math.round(
                        Math.abs(
                            this.shineDuration/2 - Math.abs(
                                                        this.shineTime-this.shineDuration/2
                                                   )
                        )/(this.shineDuration/70)
                    );
        
        GAME.context.beginPath();
        GAME.context.arc(this.x+GAME.cellSize/2, this.y+GAME.cellSize/2, radius, 0, 2*Math.PI);
        GAME.context.strokeStyle = this.shineColor;
        GAME.context.lineWidth = 30;
        GAME.context.stroke();

        this.shineTime += GAME.frameInterval;
    },
    
    onDamage: function() {
        
        if (this.damageTimeout)
            return;
        
        SOUND.onEvent('damage');
        this.shine(200, "rgba(255,0,0,.5)");
        
        var self = this;
        this.damageTimeout = setTimeout(
                function() {
                    clearTimeout(self.damageTimeout);
                    self.damageTimeout = null;
                },
                3000
        );
        this.health -= GAME.singleDamage;
        
        GAME.drawInfo();
        
        if (this.health <= 0)
            GAME.onDeath();
    },
    
    slide: function() {
        switch (this.direction) {
            case "left" :
                this.vx = -GAME.cellSize;
                break;
            case "right" :
                this.vx = GAME.cellSize;
                break;
            case "up" :
                this.vy = -GAME.cellSize;
                break;
            case "down" :
                this.vy = GAME.cellSize;
                break;
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
        
        SOUND.onEvent('coin');
        
        GAME.renderStatic();
        GAME.score++;
        GAME.levelScore++;
        GAME.drawInfo();
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