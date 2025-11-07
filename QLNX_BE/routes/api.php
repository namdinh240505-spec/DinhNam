<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\Api\RouteController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\MomoController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\RagController;
use App\Http\Controllers\PaymentController; 


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
});
Route::middleware('auth:sanctum')->group(function () {
    // Hồ sơ hiện tại
    Route::get('/me', [AuthController::class, 'me'])->name('me');

    Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('change-password', [AuthController::class, 'changePassword']);
});

});
Route::post('/rag/chat',        [RagController::class, 'chat']);
Route::get('/rag/cities',       [RagController::class, 'getCities']);
Route::post('/rag/search-trips',[RagController::class, 'searchTrips']);


// routes/api.php
Route::get('/rag/ping', [\App\Http\Controllers\Api\RagController::class, 'pingOpenRouter']);

// routes/api.php
Route::get('/rag/test-chat', [\App\Http\Controllers\Api\RagController::class, 'testChat']);



Route::post('/rag/ingest', [RagController::class, 'ingest']);
Route::post('/rag/query',  [RagController::class, 'query']);

// Chat (FAQ/AI)
Route::post('/chat', [ChatController::class, 'handle']);

// Lịch sử hội thoại (khuyến nghị bảo vệ bằng auth nếu có)
    Route::get('/conversations', [ChatController::class, 'listConversations']);
    Route::get('/conversations/{id}/messages', [ChatController::class, 'history']);
// =====================
// ⚙️ MOCK MOMO (chạy dev cục bộ không cần key thật)
// =====================
Route::post('/pay/momo', function (Request $req) {
    $code   = $req->input('code');
    $amount = $req->input('amount');

    if (empty($code)) {
        return response()->json(['message' => 'Thiếu mã đặt vé'], 422);
    }

    $booking = \App\Models\Booking::where('code', $code)->first();
    if (!$booking) {
        return response()->json(['message' => "Không tìm thấy mã đặt vé: {$code}"], 404);
    }

    // trả về link giả để FE test MoMo
    return response()->json([
        'payUrl'     => url("/mock-momo-gateway?order={$booking->code}&amount={$amount}"),
        'deeplink'   => null,
        'resultCode' => 0,
    ]);
});

Route::get('/pay/momo/return', function (Request $req) {
    // TODO: verify signature nếu cần, sau đó điều hướng UI theo trạng thái
    $resultCode = (int)$req->query('resultCode', -1);
    $orderId    = $req->query('orderId') ?? $req->query('code');
    if ($resultCode === 0) {
        return redirect("/orders/{$orderId}?paid=1");
    }
    return redirect("/orders/{$orderId}?paid=0");
});
Route::post('/pay/momo/init',   [PaymentController::class, 'momoInit']);
Route::post('/pay/momo/ipn',    [PaymentController::class, 'momoNotify']);
Route::get ('/pay/momo/return', [PaymentController::class, 'momoReturn']);
// MoMo gọi
// IPN (server to server)
Route::post('/pay/momo/ipn', function (Request $req) {
    // TODO: verify signature HMAC SHA256
    // Nếu hợp lệ và resultCode==0 -> cập nhật trạng thái đơn (paid)
    return response()->noContent();
});
// Nếu bạn đã sẵn sàng dùng thật, chỉ cần comment 2 route mock trên và bật lại dòng dưới
// Route::post('/pay/momo', [MomoController::class, 'create']);

// =====================
// PUBLIC (không cần login)
// =====================

// Auth
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/login1',   [AuthController::class, 'login1']);
Route::post('/register', [AuthController::class, 'register']);

// Trip & route
Route::get('/routes',    [RouteController::class, 'index']);
Route::get('/trips',     [TripController::class, 'index']);
Route::get('/trips/{id}',[TripController::class, 'show']);

// Booking: tra cứu & đặt vé (PUBLIC)
Route::get('/bookings',  [BookingController::class, 'index']);
Route::post('/bookings', [BookingController::class, 'store']);

// Thanh toán MoMo (PUBLIC)
Route::get ('/pay/momo/return', [MomoController::class, 'return']);
Route::post('/pay/momo/ipn',    [MomoController::class, 'ipn']);

// =====================
// ADMIN / AUTH PROTECTED
// =====================
Route::middleware('auth:sanctum')->group(function () {
    // Thông tin user
    Route::get('/user', [AuthController::class, 'user']);

    // Quản lý tuyến
    Route::post('/routes',        [RouteController::class, 'store']);
    Route::put('/routes/{id}',    [RouteController::class, 'update']);
    Route::delete('/routes/{id}', [RouteController::class, 'destroy']);

    // Quản lý chuyến
    Route::post('/trips',         [TripController::class, 'store']);
    Route::put('/trips/{id}',     [TripController::class, 'update']);
    Route::delete('/trips/{id}',  [TripController::class, 'destroy']);

    // Quản lý xe
    Route::get('/buses',        [BusController::class, 'index']);
Route::get('/buses/{id}',   [BusController::class, 'show']);
Route::post('/buses',       [BusController::class, 'store']);
Route::put('/buses/{id}',   [BusController::class, 'update']);
Route::delete('/buses/{id}',[BusController::class, 'destroy']);

    // Quản lý tài xế
    Route::get('/drivers',        [DriverController::class, 'index']);
    Route::post('/drivers',       [DriverController::class, 'store']);
    Route::get('/drivers/{id}',   [DriverController::class, 'show']);
    Route::put('/drivers/{id}',   [DriverController::class, 'update']);
    Route::delete('/drivers/{id}',[DriverController::class, 'destroy']);

    // Booking: chỉ các thao tác thay đổi cần auth
    Route::put('/bookings/{id}',     [BookingController::class, 'update']);
    Route::delete('/bookings/{id}',  [BookingController::class, 'destroy']);

    // Quản lý khách hàng
    Route::get('/user', [UserController::class, 'index']);
    Route::get('/user/{id}', [UserController::class, 'show']);
    Route::put('/user/{id}', [UserController::class, 'update']);
    Route::delete('/user/{id}', [UserController::class, 'destroy']);
    //quan ly tin tuc
    Route::apiResource('news', NewsController::class);
    //quan ly report
Route::prefix('reports')->group(function () {
    // Tính & lưu hôm nay
    Route::get('/revenue-today', [ReportController::class, 'revenueToday']);

    // Đọc báo cáo đã lưu
    Route::get('/', [ReportController::class, 'index']);          // ?start=&end=
    Route::get('/{date}', [ReportController::class, 'show']);     // YYYY-MM-DD

    // Tính & lưu thủ công
    Route::post('/generate', [ReportController::class, 'generateOne']);         // {date}
    Route::post('/generate-range', [ReportController::class, 'generateRange']); // {start,end}
});
});
