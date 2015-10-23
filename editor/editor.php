<!DOCTYPE html>
<html>
    <head>
        <script src="../jquery.min.js" type="text/javascript"></script>
        <script src="../script.js" type="text/javascript"></script>
        <script src="editor.js" type="text/javascript"></script>
        <link rel="stylesheet" href="editor.css">
        <link rel="stylesheet" href="../style.css">
    </head>
    <body>

        <?php if (!empty($_POST['data'])) : ?>
            <div id="gameField">
                <canvas id="items"></canvas>
                <canvas id="background"></canvas>
            </div>
            <script type="text/javascript">
                $(document).ready(function(){
                    $("#data").val('<?php echo $_POST['data'] ?>');
                    GAME.imgPath = '../img/';
                    GAME.init(JSON.parse('<?php echo $_POST['data'] ?>'));
                });
            </script>
        <?php endif; ?>

        <script type="text/javascript">
            $(document).ready(function(){
                EDITOR.init();
            });
        </script>

        <div id="types">
            <div data-type="walls">Стена</div>
            <div data-type="coins">Скидка</div>
            <div data-type="enemies">Противник</div>
            <div data-type="hero">Главный герой</div>
            <div class="clear">Очистить</div>
        </div>

        <div id="grid"></div>

        <div id="get-map" class="button">
            Получить массив
        </div>

        <form method="post">
            <textarea name="data" id="data" cols="120" rows="10"></textarea>
            <input type="submit" value="Тестировать" />
        </form>
    </body>
</html>