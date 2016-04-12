<?php
    $scriptTail = md5(filemtime(__DIR__ . DIRECTORY_SEPARATOR . 'script.js'));
    $styleTail = md5(filemtime(__DIR__ . DIRECTORY_SEPARATOR . 'style.css'));
?>
<!DOCTYPE html>
<html>
    <head>
        <script src="jquery.min.js" type="text/javascript"></script>
        <script src="script.js?<?= $scriptTail ?>" type="text/javascript"></script>
        <link rel="stylesheet" href="style.css?<?= $styleTail ?>">
    </head>
    <body onload="GAME.init()">
        <div id="gameField">
            <div id="loaded"></div>
            <canvas id="full-canvas"></canvas>
            <canvas id="info"></canvas>
            <canvas id="foreground"></canvas>
            <canvas id="items"></canvas>
            <canvas id="background"></canvas>
        </div>
        <div id="links">
        </div>

        <?php if (!empty($_GET['level'])) : ?>
            <script>
                $(document).ready(function(){
                    GAME.level = <?= (int) $_GET['level'] ?>;
                });
            </script>
        <?php endif; ?>

    </body>
</html>
