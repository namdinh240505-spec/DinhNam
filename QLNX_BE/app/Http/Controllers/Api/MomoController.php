<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MomoController extends Controller
{
    /**
     * Tạo chữ ký SHA256 cho yêu cầu MoMo
     */
    private function sign(array $raw, string $secret): string
    {
        $parts = [
            'accessKey=' . $raw['accessKey'],
            'amount=' . $raw['amount'],
            'extraData=' . $raw['extraData'],
            'ipnUrl=' . $raw['ipnUrl'],
            'orderId=' . $raw['orderId'],
            'orderInfo=' . $raw['orderInfo'],
            'partnerCode=' . $raw['partnerCode'],
            'redirectUrl=' . $raw['redirectUrl'],
            'requestId=' . $raw['requestId'],
            'requestType=' . $raw['requestType'],
        ];
        return hash_hmac('sha256', implode('&', $parts), $secret);
    }

    /**
     * Tạo liên kết thanh toán MoMo (FE gọi)
     */
    public function create(Request $req)
    {
        $data = $req->validate([
            'code'   => 'required|string',
            'amount' => 'nullable|numeric|min:0',
        ]);

        // 🔹 Tìm booking theo code (nếu không có -> báo lỗi rõ ràng)
        $booking = Booking::where('code', $data['code'])->with('trip')->first();
        if (!$booking) {
            return response()->json([
                'message' => 'Không tìm thấy mã đặt vé: ' . $data['code'],
            ], 404);
        }

        // 🔹 Nếu đã thanh toán
        if ($booking->paid) {
            return response()->json([
                'message' => 'Vé này đã được thanh toán trước đó.',
            ], 422);
        }

        // 🔹 Tính lại tiền trên server để đảm bảo an toàn
        $serverAmount = (int)(($booking->trip->price ?? 0) * (int)$booking->seats);
        if ($serverAmount <= 0) {
            return response()->json([
                'message' => 'Số tiền không hợp lệ hoặc chuyến xe không tồn tại.',
            ], 422);
        }

        // 🔹 Lấy cấu hình MoMo từ .env
        $partnerCode = env('MOMO_PARTNER_CODE');
        $accessKey   = env('MOMO_ACCESS_KEY');
        $secretKey   = env('MOMO_SECRET_KEY');
        $endpoint    = env('MOMO_ENDPOINT_CREATE', 'https://test-payment.momo.vn/v2/gateway/api/create');

        $redirectUrl = env('MOMO_REDIRECT_URL', url('/api/pay/momo/return'));
        $ipnUrl      = env('MOMO_IPN_URL', url('/api/pay/momo/ipn'));

        $orderId     = $booking->code . '-' . time();
        $requestId   = $orderId;
        $orderInfo   = 'Thanh toán vé xe ' . $booking->code;
        $requestType = 'captureWallet'; // hoặc 'payWithATM'
        $amount      = (string)$serverAmount;

        // 🔹 Chuẩn bị payload
        $payload = [
            'partnerCode' => $partnerCode,
            'accessKey'   => $accessKey,
            'requestId'   => $requestId,
            'amount'      => $amount,
            'orderId'     => $orderId,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl . '?code=' . $booking->code,
            'ipnUrl'      => $ipnUrl,
            'lang'        => 'vi',
            'extraData'   => '',
            'requestType' => $requestType,
        ];
        $payload['signature'] = $this->sign($payload, $secretKey);

        // 🔹 Gửi request đến MoMo
        $res = Http::asJson()->post($endpoint, $payload);

        // 🔹 Xử lý lỗi từ MoMo
        if (!$res->ok()) {
            return response()->json([
                'message' => 'Không thể kết nối tới cổng thanh toán MoMo',
                'error'   => $res->body(),
            ], 500);
        }
        if (empty($res['payUrl'])) {
            return response()->json([
                'message' => $res['message'] ?? 'Tạo thanh toán thất bại',
                'momo'    => $res->json(),
            ], 500);
        }

        // 🔹 (tuỳ chọn) lưu orderId để đối soát sau
        $booking->momo_order_id = $orderId;
        $booking->save();

        return response()->json([
            'payUrl'     => $res['payUrl'],
            'deeplink'   => $res['deeplink'] ?? null,
            'resultCode' => $res['resultCode'] ?? null,
            'booking'    => $booking->code,
            'amount'     => $amount,
        ]);
    }

    /**
     * Khi MoMo redirect về (sau thanh toán)
     */
// app/Http/Controllers/Api/MomoController.php

public function return(Request $req)
{
    // mock gateway sẽ gọi ?resultCode=0&code=BKxxxx
    $resultCode = (string) $req->input('resultCode', '');
    $code       = (string) $req->input('code', '');

    // Nếu thành công → set paid=true
    if ($resultCode === '0' && $code !== '') {
        $b = \App\Models\Booking::where('code', $code)->first();
        if ($b) {
            $b->paid   = true;
            $b->status = 'confirmed';
            $b->save();
        }
        // (tuỳ chọn) redirect về FE trang kết quả
        $fe = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        return redirect()->away($fe . "/payment/momo/result?ok=1&code={$code}");
    }

    // Thanh toán thất bại/huỷ
    $fe = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
    return redirect()->away($fe . "/payment/momo/result?ok=0&code={$code}");
}


    /**
     * IPN: MoMo gọi server-to-server để xác nhận
     */
    public function ipn(Request $req)
    {
        $resultCode = (int)$req->input('resultCode');
        $orderId    = $req->input('orderId');
        $amount     = (int)$req->input('amount');

        if ($resultCode === 0 && $orderId) {
            $booking = Booking::where('momo_order_id', $orderId)->first();
            if ($booking) {
                $booking->paid = true;
                $booking->status = 'confirmed';
                $booking->save();
            }
        }

        return response()->json([
            'resultCode' => 0,
            'message'    => 'OK',
        ]);
    }
}
