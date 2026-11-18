<?php

return [
    'class' => \yii\db\Connection::class,
    'dsn' => getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;port=3307;dbname=doblo',
    'username' => getenv('DB_USER') ?: 'doblo',
    'password' => getenv('DB_PASS') ?: 'doblo',
    'charset' => 'utf8mb4',
];
