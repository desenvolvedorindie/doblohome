<?php

return [
    'senderEmail' => getenv('MAIL_FROM') ?: 'no-reply@doblo.local',
    'senderName' => 'DobloHome Studio',
    'frontendUrl' => rtrim(getenv('APP_FRONTEND_URL') ?: 'http://localhost:5173', '/'),
    'corsOrigins' => array_values(array_filter(array_map('trim', explode(',', getenv('CORS_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173')))),
    'accessTokenTtl' => 3600,
    'refreshTokenTtl' => 60 * 86400,
    'verifyTokenTtl' => 2 * 86400,
    'resetTokenTtl' => 3600,
    'minPasswordLength' => 8,
];
