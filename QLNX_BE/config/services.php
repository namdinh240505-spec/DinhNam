<?php

// config/services.php
return [
    // ... các service khác

    'momo' => [
        'partner_code'   => env('MOMO_PARTNER_CODE'),
        'access_key'     => env('MOMO_ACCESS_KEY'),
        'secret_key'     => env('MOMO_SECRET_KEY'),

        // bạn đang dùng MOMO_ENDPOINT_CREATE trong .env
        'endpoint'       => env('MOMO_ENDPOINT_CREATE', 'https://test-payment.momo.vn/v2/gateway/api/create'),

        // bạn đang dùng MOMO_REDIRECT_URL trong .env
        'redirect'       => env('MOMO_REDIRECT_URL', env('FRONTEND_URL').'/payment/momo/result'),

        // bạn đang dùng MOMO_IPN_URL trong .env
        'ipn'            => env('MOMO_IPN_URL', env('APP_URL').'/api/pay/momo/ipn'),
    ],
];
