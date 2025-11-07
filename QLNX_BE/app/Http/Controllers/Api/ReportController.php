<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    /** Helper: filter “đã thanh toán” */
    private function scopePaid($q)
    {
        $q->where(function ($qq) {
            $qq->where('payment_status', 'paid')
               ->orWhere('paid', true);
        });
    }

    /** Helper: đếm vé từ seat_numbers (cast array/string) */
    private function seatsCount($booking): int
    {
        $sn = $booking->seat_numbers ?? null;
        if (is_array($sn)) return count($sn);
        if (is_string($sn) && trim($sn) !== '') {
            try { $arr = json_decode($sn, true); return is_array($arr) ? count($arr) : 0; }
            catch (\Throwable $e) { return 0; }
        }
        return 0;
    }

    /**
     * Tính & lưu báo cáo cho 1 ngày (VN timezone), nguồn từ bookings.
     * - Nếu timestamps DB lưu UTC (mặc định), dùng whereBetween với mốc UTC.
     */
private function buildOneDay(\Carbon\Carbon $day, string $tz = 'Asia/Ho_Chi_Minh'): array
{
    // "Hôm nay" theo múi giờ VN
    $dateStr = $day->copy()->timezone($tz)->toDateString(); // YYYY-MM-DD

    // Chấp nhận nhiều trạng thái đã thanh toán
    $paidStatuses = ['paid', 'success', 'succeeded', 'completed', 'đã thanh toán', 'pending'];

    $base = \App\Models\Booking::query()
        ->whereNotNull('paid_at')
        ->whereDate('paid_at', $dateStr)
        ->where(function ($q) use ($paidStatuses) {
            $q->whereIn(\DB::raw('LOWER(payment_status)'), array_map('strtolower', $paidStatuses))
              ->orWhere('paid', true);
        });

    $total   = (float) $base->clone()->sum(\DB::raw('COALESCE(amount_paid,0)'));
    $orders  = (int)   $base->clone()->count();
    $tickets =          $base->clone()->get(['seat_numbers'])->reduce(function ($acc, $b) {
                    $sn = $b->seat_numbers;
                    if (is_array($sn)) return $acc + count($sn);
                    if (is_string($sn) && trim($sn) !== '') {
                        $arr = json_decode($sn, true);
                        return $acc + (is_array($arr) ? count($arr) : 0);
                    }
                    return $acc;
                }, 0);

    \App\Models\Report::updateOrCreate(
        ['report_date' => $dateStr],
        ['orders_count' => $orders, 'tickets_sold' => $tickets, 'revenue' => $total]
    );

    return [
        'date' => $dateStr,
        'orders_count' => $orders,
        'tickets_sold' => $tickets,
        'revenue' => $total,
        'revenue_formatted' => number_format($total, 0, ',', '.') . ' ₫',
        'range_local' => [$dateStr.' 00:00:00', $dateStr.' 23:59:59'],
    ];
}

    /** GET /api/reports/revenue-today  → tính & lưu hôm nay, trả về chi tiết */
    public function revenueToday(Request $request)
    {
        $tz = config('app.timezone', 'Asia/Ho_Chi_Minh');
        $today = Carbon::now($tz)->startOfDay();
        $data = $this->buildOneDay($today, $tz);
        return response()->json($data);
    }

    /** POST /api/reports/generate  body: { date: 'YYYY-MM-DD' }  → tính & lưu 1 ngày bất kỳ */
    public function generateOne(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
        ]);
        $tz = config('app.timezone', 'Asia/Ho_Chi_Minh');
        $day = Carbon::parse($data['date'], $tz)->startOfDay();
        $res = $this->buildOneDay($day, $tz);
        return response()->json(['ok' => true, 'data' => $res]);
    }

    /** POST /api/reports/generate-range  body: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } */
    public function generateRange(Request $request)
    {
        $payload = $request->validate([
            'start' => ['required', 'date'],
            'end'   => ['required', 'date', 'after_or_equal:start'],
        ]);
        $tz = config('app.timezone', 'Asia/Ho_Chi_Minh');

        $start = Carbon::parse($payload['start'], $tz)->startOfDay();
        $end   = Carbon::parse($payload['end'], $tz)->startOfDay();

        $out = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $out[] = $this->buildOneDay($d, $tz);
        }
        return response()->json(['ok' => true, 'days' => count($out), 'data' => $out]);
    }

    /** GET /api/reports?start=YYYY-MM-DD&end=YYYY-MM-DD  → đọc report đã lưu (không tính lại) */
    public function index(Request $request)
    {
        $request->validate([
            'start' => ['nullable', 'date'],
            'end'   => ['nullable', 'date', Rule::requiredIf(fn () => $request->filled('start'))],
        ]);

        $q = Report::query()->orderBy('report_date', 'desc');

        if ($request->filled('start') && $request->filled('end')) {
            $q->whereBetween('report_date', [$request->start, $request->end]);
        }

        $items = $q->get();
        $totalRevenue = (float) $items->sum('revenue');
        $totalOrders = (int) $items->sum('orders_count');
        $totalTickets = (int) $items->sum('tickets_sold');

        return response()->json([
            'summary' => [
                'days' => $items->count(),
                'revenue' => $totalRevenue,
                'revenue_formatted' => number_format($totalRevenue, 0, ',', '.') . ' ₫',
                'orders' => $totalOrders,
                'tickets' => $totalTickets,
            ],
            'data' => $items,
        ]);
    }

    /** GET /api/reports/{date} → xem 1 ngày đã lưu (không tính lại) */
    public function show(string $date)
    {
        $r = Report::where('report_date', $date)->first();
        if (!$r) {
            return response()->json(['ok' => false, 'message' => 'Chưa có báo cáo ngày này'], 404);
        }
        return response()->json($r);
    }
}
