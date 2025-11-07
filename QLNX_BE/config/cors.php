<?php
return [
    /*
    |--------------------------------------------------------------------------
    | Laravel CORS Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'pay/*', 'sanctum/csrf-cookie'],  // 👈 thêm pay/*
    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'allowed_headers' => ['*', 'X-Chat-Api-Key'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    
    'supports_credentials' => false,  // 👈 để false, vì FE không gửi cookie
    'max_age' => 86400,
];
