<!DOCTYPE html>
<html>
    <head>
        <script src="jquery.min.js" type="text/javascript"></script>
        <script src="script.js" type="text/javascript"></script>
        <link rel="stylesheet" href="style.css">
    </head>
    <body onload="GAME.init()">
        <div id="gameField">
            <canvas id="items"></canvas>
            <canvas id="background"></canvas>
        </div>

        <?php if (!empty($_GET['editor'])) : ?>

        <div id="types">
            <div data-type="wall">Стена</div>
            <div data-type="coin">Скидка</div>
            <div data-type="enemy">Противник</div>
            <div data-type="hero">Главный герой</div>
        </div>
        
        <script type="text/javascript">
            // Editor
            var boxSize = 10;

            $("body").append('<div id="items"></div>');
            $("body").append('<div id="grid"></div><div id="get-map" class="button">Получить массив</div>');

            var grid = $("#grid");

            grid
                .width(GAME.cellsX * boxSize)
                .height(GAME.cellsY * boxSize)
                .css("background", "#eee")
                .css("margin", "10px auto")
                .css("position", "relative");

            $("#types div").removeClass("active");
            $("#types div[data-type="+EDITOR.type+"]").addClass("active");

            EDITOR.seedHero();
            EDITOR.seedWalls();
            EDITOR.seedCoins();
            EDITOR.seedEnemies();

            grid.on("click", function(e){
                if (EDITOR.type == "hero") { // Should be only one hero
                    grid.find(".hero").remove();
                }

                EDITOR.add(
                           grid,
                           EDITOR.type,
                           Math.floor(e.offsetX / boxSize),
                           Math.floor(e.offsetY / boxSize)
                        );
            });

            grid.on("click", "div", function(e){
                e.stopPropagation(); // Stop bubbling
                $(this).remove();
            });

            $("#get-map").click(function(){
                EDITOR.getMap(grid);
            });

            $("#types").on("click", "div", function(){
                $(this).parent().find("div").removeClass("active");
                $(this).addClass("active");
                EDITOR.type = $(this).data("type");
            });

        </script>

        <?php endif; ?>
    </body>
</html>