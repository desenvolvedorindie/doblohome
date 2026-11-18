<?php

$debug = filter_var(getenv('YII_DEBUG') ?: '0', FILTER_VALIDATE_BOOLEAN);
define('YII_DEBUG', $debug);
define('YII_ENV', getenv('YII_ENV') ?: ($debug ? 'dev' : 'prod'));

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../vendor/yiisoft/yii2/Yii.php';

$config = require __DIR__ . '/../config/web.php';

(new yii\web\Application($config))->run();
