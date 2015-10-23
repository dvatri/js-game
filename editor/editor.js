// Levels editor. Generates items jsons
var EDITOR = EDITOR || {
    
    grid: null,

    type: "walls",

    seedHero: function() {
        for (var i=0; i < GAME.heroMap.length; i++) {
            this.add(grid, "hero", GAME.heroMap[i].x, GAME.heroMap[i].y);
            if (i === 1)
                break;
        }
    },

    seedWalls: function() {
        for (var i=0; i < GAME.wallsMap.length; i++) {
            this.add(grid, "walls", GAME.wallsMap[i].x, GAME.wallsMap[i].y);
        }
    },

    seedCoins: function() {
        for (var i=0; i < GAME.coinsMap.length; i++) {
            this.add(grid, "coins", GAME.coinsMap[i].x, GAME.coinsMap[i].y);
        }
    },
    
    seedEnemies: function() {
        for (var i=0; i < GAME.enemiesMap.length; i++) {
            this.add(grid, "enemies", GAME.enemiesMap[i].x, GAME.enemiesMap[i].y);
        }
    },

    add: function(to, type, x, y) {
        var cellClass = 'x-'+x+' y-'+y+' '+type;
        $(to).append('<div class="'+cellClass+'" data-x="'+x+'" data-y="'+y+'"></div>');
    },

    getMap: function(from) {
        var map = {};
        var types = ['hero', 'walls', 'enemies', 'coins'];
        $("#data").val("");
        
        types.forEach(function(type){
            map[type+"Map"] = [];
            
            from.find("."+type).each(function(){
                map[type+"Map"].push({x: $(this).data("x"), y: $(this).data("y")});
            });
        });
        
        $("#data").val(JSON.stringify(map));
    },
    
    init: function() {
        var boxSize = 25;
        EDITOR.grid = $("#grid");
        EDITOR.grid
            .width(GAME.cellsX * boxSize)
            .height(GAME.cellsY * boxSize);

        $("#types div").removeClass("active");
        $("#types div[data-type="+EDITOR.type+"]").addClass("active");

        EDITOR.seedHero();
        EDITOR.seedWalls();
        EDITOR.seedCoins();
        EDITOR.seedEnemies();

        EDITOR.grid.on("click", function(e){
            if (EDITOR.type == "hero") { // Should be only one hero
                EDITOR.grid.find(".hero").remove();
            }

            EDITOR.add(
                       EDITOR.grid,
                       EDITOR.type,
                       Math.floor(e.offsetX / boxSize),
                       Math.floor(e.offsetY / boxSize)
                    );
        });

        EDITOR.grid.on("click", "div", function(e){
            console.log($(this));
            e.stopPropagation(); // Stop bubbling
            $(this).remove();
        });

        $("#get-map").click(function(){
            EDITOR.getMap(EDITOR.grid);
        });

        $("#types").on("click", "div", function(){

            if ($(this).hasClass("clear")) {
                if (confirm('Удалить все объекты? После удаления придется рисовать снова.')) {
                    EDITOR.grid.find("div").remove();
                }
                return;
            }

            $(this).parent().find("div").removeClass("active");
            $(this).addClass("active");
            EDITOR.type = $(this).data("type");
        });
    }
};