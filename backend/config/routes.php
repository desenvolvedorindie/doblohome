<?php

$presetTypes = implode('|', array_keys(require __DIR__ . '/preset_types.php'));

return [
    'GET health' => 'api/health/index',

    'POST auth/register' => 'api/auth/register',
    'POST auth/verify-email' => 'api/auth/verify-email',
    'POST auth/resend-verification' => 'api/auth/resend-verification',
    'POST auth/login' => 'api/auth/login',
    'POST auth/refresh' => 'api/auth/refresh',
    'POST auth/logout' => 'api/auth/logout',
    'POST auth/forgot-password' => 'api/auth/forgot-password',
    'POST auth/reset-password' => 'api/auth/reset-password',
    'GET auth/me' => 'api/auth/me',

    'GET projects' => 'api/project/index',
    'POST projects/import' => 'api/project/import',
    'GET projects/<id:[A-Za-z0-9_\-]+>' => 'api/project/view',
    'PUT projects/<id:[A-Za-z0-9_\-]+>' => 'api/project/save',
    'DELETE projects/<id:[A-Za-z0-9_\-]+>' => 'api/project/delete',

    'GET presets' => 'api/preset/all',
    "GET presets/<type:($presetTypes)>" => 'api/preset/view',
    "PUT presets/<type:($presetTypes)>" => 'api/preset/save',

    'OPTIONS <path:.*>' => 'api/health/options',
];
