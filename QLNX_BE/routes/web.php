<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

Route::get('/', function () {
    return response()->json(['app' => 'QLNX API', 'status' => 'ok']);
}); // 👈 đóng ); đầy đủ

Route::get('/mock-momo-gateway', function (Request $req) {
    $order  = (string) $req->query('order', '');
    $amount = (int)    $req->query('amount', 0);
    abort_if($order === '' || $amount <= 0, 400, 'Thiếu order/amount');

    // ✅ orderId hợp lệ (A–Z, a–z, 0–9, gạch ngang, underscore), tối đa 50 ký tự
    if (!preg_match('/^[A-Za-z0-9\-_]{1,50}$/', $order)) {
        return response()->json([
            'error' => 'invalid_orderId',
            'hint'  => 'orderId chỉ nên gồm chữ/số/(-|_) và <= 50 ký tự'
        ], 400);
    }

    // ====== Cấu hình từ ENV ======
    $partnerCode = trim(env('MOMO_PARTNER_CODE', ''));
    $accessKey   = trim(env('MOMO_ACCESS_KEY', ''));
    $secretKey   = trim(env('MOMO_SECRET_KEY', ''));
    $endpoint    = trim(env('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create')); // prod: https://payment.momo.vn/v2/gateway/api/create

    if (!$partnerCode || !$accessKey || !$secretKey) {
        return response()->json([
            'error' => 'missing_credentials',
            'hint'  => 'Kiểm tra MOMO_PARTNER_CODE / MOMO_ACCESS_KEY / MOMO_SECRET_KEY trong .env',
        ], 500);
    }

    $requestId   = (string) Str::uuid();  // nên unique/idempotent
    $requestType = 'captureWallet';
    $redirectUrl = url('/api/pay/momo/return'); // ⚠️ production nên là HTTPS và đúng domain đã đăng ký trên MoMo
    $ipnUrl      = url('/api/pay/momo/ipn');    // ⚠️ production nên là HTTPS
    $orderInfo   = "Thanh toán đơn #$order";
    $extraData   = ''; // có thể base64 metadata nếu cần
    $lang        = 'vi';

    // ====== Raw Signature (KHÔNG urlencode, đúng thứ tự key) ======
    $rawSignature = "accessKey={$accessKey}"
        . "&amount={$amount}"
        . "&extraData={$extraData}"
        . "&ipnUrl={$ipnUrl}"
        . "&orderId={$order}"
        . "&orderInfo={$orderInfo}"
        . "&partnerCode={$partnerCode}"
        . "&redirectUrl={$redirectUrl}"
        . "&requestId={$requestId}"
        . "&requestType={$requestType}";

    $signature = hash_hmac('sha256', $rawSignature, $secretKey);

    // ✅ amount dạng STRING theo khuyến nghị MoMo
    $payload = [
        'partnerCode' => $partnerCode,
        'requestId'   => $requestId,
        'orderId'     => $order,
        'amount'      => (string) $amount,
        'orderInfo'   => $orderInfo,
        'redirectUrl' => $redirectUrl,
        'ipnUrl'      => $ipnUrl,
        'lang'        => $lang,
        'extraData'   => $extraData,
        'requestType' => $requestType,
        'signature'   => $signature,
    ];

    // (Tuỳ chọn) Log debug — xoá đi khi lên production
    Log::info('MoMo create payload', ['endpoint' => $endpoint, 'raw' => $rawSignature, 'payload' => $payload]);

    try {
        $res = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($endpoint, $payload);

        $json = $res->json();
        Log::info('MoMo create response', ['status' => $res->status(), 'json' => $json]);

        $resultCode = (int)($json['resultCode'] ?? -1);
        $payUrl     = $json['payUrl']    ?? null; // web/app url
        $qrCodeUrl  = $json['qrCodeUrl'] ?? null; // có thể có tuỳ merchant/env
        $deeplink   = $json['deeplink']  ?? null; // có thể có

        if (!$res->ok() || $resultCode !== 0 || !$payUrl) {
            // Gợi ý nhanh cho lỗi phổ biến
            $hints = [
                13  => 'Xác thực doanh nghiệp thất bại: sai môi trường (sandbox/prod), sai ACCESS_KEY/SECRET_KEY, sai chữ ký, hoặc domain redirect/ipn chưa được whitelisted.',
                10  => 'Lỗi chữ ký: kiểm tra rawSignature và SECRET_KEY.',
                7   => 'Tham số không hợp lệ: kiểm tra amount/orderId/redirectUrl/ipnUrl.',
                9   => 'Đơn hàng trùng hoặc không hợp lệ: đảm bảo orderId/requestId unique.',
            ];
            return response()->json([
                'error'       => 'create_failed',
                'status'      => $res->status(),
                'momo'        => $json,
                'common_hint' => 'Kiểm tra endpoint (sandbox/prod), credentials, chữ ký, và domain redirect/ipn phải khớp cấu hình MoMo.',
                'hint'        => $hints[$resultCode] ?? null,
            ], 502);
        }

        // ====== Render HTML hiển thị QR + nút mở MoMo ======
        $qrBlock = $qrCodeUrl
            ? "<img src=\"{$qrCodeUrl}\" alt=\"QR MoMo\" style=\"width:280px;height:280px;object-fit:contain;border:1px solid #eee;border-radius:8px;\"/>"
            : "<p class='muted'>Không có QR trực tiếp, vui lòng bấm nút bên dưới để mở trang MoMo.</p>";

        $openLink = htmlspecialchars($payUrl, ENT_QUOTES, 'UTF-8');
        $deepBtn  = $deeplink
            ? "<a class=\"btn deep\" href=\"{$deeplink}\">📱 Mở MoMo App</a>"
            : "";

        $html = <<<HTML
<!doctype html>
<html lang="vi">
<meta charset="utf-8">
<title>Thanh toán MoMo</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f7f7fb;margin:0}
  .wrap{max-width:520px;margin:60px auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;
        box-shadow:0 10px 25px rgba(0,0,0,.06);padding:24px;text-align:center}
  h1{margin:0 0 8px;font-size:20px}
  .muted{color:#6b7280}
  .btn{display:inline-block;margin:10px 6px;padding:10px 14px;border-radius:10px;
       font-weight:700;text-decoration:none;border:1px solid transparent}
  .open{background:#a50064;color:#fff}
  .deep{background:#7c3aed;color:#fff}
  .note{margin-top:12px;font-size:12px;color:#6b7280}
  img{display:block;margin:14px auto}
</style>
<div class="wrap">
  <h1>🧾 Thanh toán MoMo</h1>
  <div class="muted">Mã đơn: <b>{$order}</b></div>
  <div class="muted">Số tiền: <b>{$amount} VND</b></div>

  {$qrBlock}

  <div>
    <a class="btn open" href="{$openLink}" target="_self">💜 Mở trang MoMo để thanh toán</a>
    {$deepBtn}
  </div>

  <div class="note">
    Sau khi thanh toán, MoMo sẽ chuyển bạn về trang kết quả (return URL).<br/>
    Đồng thời hệ thống sẽ nhận IPN để xác thực giao dịch.
  </div>
</div>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    } catch (\Throwable $e) {
        Log::error('MoMo error', ['ex' => $e]);
        return response("MoMo error: ".$e->getMessage(), 500);
    }
});
