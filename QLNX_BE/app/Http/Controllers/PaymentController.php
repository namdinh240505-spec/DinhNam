<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Booking;

class PaymentController extends Controller
{
    // app/Http/Controllers/PaymentController.php

public function momoInit(Request $req)
{
    $code   = (string) $req->input('code');
    $amount = (int) ($req->input('amount') ?? 0);

    if (!$code || $amount <= 0) {
        return response()->json(['ok' => false, 'message' => 'Thiếu mã hoặc số tiền'], 422);
    }

    $b = \App\Models\Booking::where('code', $code)->first();
    if (!$b) return response()->json(['ok' => false, 'message' => 'Không tìm thấy vé'], 404);
    if ($b->paid || ($b->payment_status ?? '') === 'paid') {
        return response()->json(['ok' => false, 'message' => 'Vé đã thanh toán'], 409);
    }

    $endpoint    = env('MOMO_ENDPOINT');
    $partnerCode = env('MOMO_PARTNER_CODE');
    $accessKey   = env('MOMO_ACCESS_KEY');
    $secretKey   = env('MOMO_SECRET_KEY');
    $redirectUrl = rtrim(env('MOMO_REDIRECT_URL'), '/');
    $ipnUrl      = env('MOMO_IPN_URL');

    $callMomo = function(string $orderId) use ($partnerCode,$accessKey,$secretKey,$endpoint,$redirectUrl,$ipnUrl,$amount,$code) {
        $requestId = (string) \Illuminate\Support\Str::uuid();
        $orderInfo = "Thanh toan ve xe #{$code}";
        $extraData = "";

        $raw = "accessKey={$accessKey}"
            ."&amount={$amount}"
            ."&extraData={$extraData}"
            ."&ipnUrl={$ipnUrl}"
            ."&orderId={$orderId}"
            ."&orderInfo={$orderInfo}"
            ."&partnerCode={$partnerCode}"
            ."&redirectUrl={$redirectUrl}?code={$code}"
            ."&requestId={$requestId}"
            ."&requestType=captureWallet";

        $sig = hash_hmac('sha256', $raw, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'partnerName' => 'MoMoTest',
            'storeId'     => 'TestStore',
            'requestId'   => $requestId,
            'amount'      => $amount,
            'orderId'     => $orderId,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl . "?code={$code}",
            'ipnUrl'      => $ipnUrl,
            'lang'        => 'vi',
            'extraData'   => $extraData,
            'requestType' => 'captureWallet',
            'signature'   => $sig,
        ];

        $res = \Illuminate\Support\Facades\Http::withHeaders(['Content-Type'=>'application/json'])
               ->post($endpoint, $payload);

        return [$res->status(), $res->json()];
    };

    $attempts = 0;
    $lastData = null;

    do {
        $attempts++;
        // orderId luôn mới để tránh 41
        $orderId = sprintf('%s-%s-%04d', $code, now()->format('ymdHis'), random_int(0,9999));

        [$httpStatus, $data] = $callMomo($orderId);
        $lastData = $data;

        if ($httpStatus !== 200) {
            return response()->json([
                'ok' => false,
                'error' => 'momo_http_error',
                'status' => $httpStatus,
                'response' => $data,
            ], 502);
        }

        if (($data['resultCode'] ?? -1) === 0) {
            // lưu tracking
            $b->last_order_id     = $orderId;
            $b->payment_attempts  = (int)($b->payment_attempts ?? 0) + 1;
            $b->payment_status    = 'pending';
            $b->payment_method    = 'momo';
            $b->save();

            return response()->json([
                'ok'         => true,
                'orderId'    => $orderId,
                'payUrl'     => $data['payUrl']    ?? '',
                'deeplink'   => $data['deeplink']  ?? null,
                'qrCodeUrl'  => $data['qrCodeUrl'] ?? null, // MoMo có thể trả hoặc không
                'resultCode' => 0,
            ]);
        }

        if (($data['resultCode'] ?? null) == 41) {
            // trùng orderId -> lặp với orderId mới
            continue;
        }

        // lỗi khác: trả cho FE hiển thị
        return response()->json([
            'ok'          => false,
            'error'       => 'create_failed',
            'momo'        => $data,
            'common_hint' => 'Kiểm tra partnerCode/accessKey/secretKey, chữ ký và redirectUrl/ipnUrl.',
        ], 200);

    } while ($attempts < 3);

    return response()->json([
        'ok'    => false,
        'error' => 'create_failed',
        'momo'  => $lastData,
        'hint'  => 'MoMo báo trùng orderId nhiều lần. Thử lại sau vài giây.',
    ], 200);
}
}