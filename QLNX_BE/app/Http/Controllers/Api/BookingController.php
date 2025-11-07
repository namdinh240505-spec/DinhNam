<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    public function index(Request $req)
    {
        $q = Booking::query()->with(['trip.route'])->orderByDesc('id');

        if ($req->filled('trip_id')) $q->where('trip_id', $req->trip_id);
        if ($req->filled('phone'))   $q->where('phone', 'like', '%'.$req->phone.'%');

        if ($req->filled('status') && Schema::hasColumn('bookings', 'status')) {
            $q->where('status', $req->status);
        }

        return response()->json($q->get());
    }

    public function store(Request $req)
    {
        // Validate payload
        $data = $req->validate([
            'tripId'        => ['required','integer','exists:trips,id'],
            'customer'      => ['required','string','max:120'],
            'phone'         => ['required','string','max:20'],
            'seats'         => ['required','integer','min:1','max:50'],
            'seat_numbers'  => ['required'], // nhận array hoặc CSV/JSON string
            'paid'          => ['nullable','boolean'],
        ]);

        $trip = Trip::findOrFail((int)$data['tripId']);

        // Chuẩn hóa seat_numbers về mảng số
        $seatNumbers = $this->normalizeSeats($data['seat_numbers']);
        if (count($seatNumbers) === 0) {
            return response()->json(['message'=>'Danh sách ghế trống'], 422);
        }
        if (count($seatNumbers) !== (int)$data['seats']) {
            return response()->json(['message'=>'Số ghế không khớp danh sách ghế'], 422);
        }

        // Lấy ghế đã đặt (trừ cancelled nếu có cột status)
        $already = $this->getBookedSeats($trip->id);

        // Check trùng & vượt giới hạn
        $dup = array_values(array_intersect($already, $seatNumbers));
        if (!empty($dup)) {
            return response()->json([
                'message' => 'Một số ghế đã được đặt',
                'errors'  => ['seat_numbers' => ['Ghế trùng: '.implode(', ', $dup)]],
            ], 422);
        }
        if (max($seatNumbers) > (int)$trip->seats) {
            return response()->json(['message'=>'Ghế vượt quá số lượng trên xe'], 422);
        }

        // Lưu đặt chỗ
        $booking = new Booking();
        $booking->trip_id      = $trip->id;
        $booking->customer     = $data['customer'];
        $booking->phone        = $data['phone'];
        $booking->seats        = (int)$data['seats'];

        if (Schema::hasColumn('bookings','status')) {
            $booking->status = 'pending';
        }
        if (Schema::hasColumn('bookings','paid')) {
            $booking->paid = (bool)($data['paid'] ?? false);
        }
        if (Schema::hasColumn('bookings','code')) {
            $booking->code = $this->makeBookingCode($trip->id);
        }

        // 🔑 Lưu seat_numbers dạng ARRAY (Model sẽ tự JSON hoá nhờ $casts)
        if (Schema::hasColumn('bookings','seat_numbers')) {
            $booking->seat_numbers = $seatNumbers; // ✅ array
        } elseif (Schema::hasColumn('bookings','seat_number')) {
            if (count($seatNumbers) !== 1) {
                return response()->json(['message'=>'Schema hiện tại chỉ cho 1 ghế/booking (cột seat_number)'], 422);
            }
            $booking->seat_number = $seatNumbers[0];
        } elseif (Schema::hasColumn('bookings','seats_list')) {
            $booking->seats_list = implode(',', $seatNumbers);
        }

        $booking->save();

        // Cập nhật đếm ghế đã đặt (optional)
        $totalBooked = count($this->getBookedSeats($trip->id));
        $trip->booked = max($trip->booked ?? 0, $totalBooked);
        $trip->save();

        return response()->json([
            'message' => 'Đặt vé thành công',
            'data'    => $booking->load('trip.route'),
        ], 201);
    }

    public function update(Request $req, $id)
    {
        $booking = Booking::findOrFail((int)$id);

        $rules = [];
        if (Schema::hasColumn('bookings','status')) {
            $rules['status'] = ['nullable', Rule::in(['pending','confirmed','cancelled'])];
        }
        if (Schema::hasColumn('bookings','paid')) {
            $rules['paid'] = ['nullable','boolean'];
        }

        $data = $req->validate($rules);

        $booking->fill($data);
        $booking->save();

        // Nếu hủy → cập nhật lại booked của trip
        if ((($data['status'] ?? null) === 'cancelled') && $booking->trip_id) {
            $trip = Trip::find($booking->trip_id);
            if ($trip) {
                $trip->booked = count($this->getBookedSeats($trip->id));
                $trip->save();
            }
        }

        return response()->json(['message'=>'Cập nhật thành công','data'=>$booking->load('trip.route')]);
    }

    public function destroy($id)
    {
        $b = Booking::findOrFail((int)$id);
        $tripId = $b->trip_id;
        $b->delete();

        if ($tripId) {
            $trip = Trip::find($tripId);
            if ($trip) {
                $trip->booked = count($this->getBookedSeats($tripId));
                $trip->save();
            }
        }
        return response()->json(['message'=>'Đã xóa booking']);
    }

    // ================= helpers =================

    private function normalizeSeats($raw): array
    {
        if (is_array($raw)) $arr = $raw;
        elseif (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) $arr = $decoded;
            else $arr = array_map('trim', explode(',', $raw));
        } else $arr = [];

        return collect($arr)
            ->map(fn($x)=>(int)$x)
            ->filter(fn($x)=>$x>0)
            ->unique()
            ->values()
            ->all();
    }

    private function getBookedSeats(int $tripId): array
    {
        $all = [];
        $q = DB::table('bookings')->where('trip_id', $tripId);

        if (Schema::hasColumn('bookings','status')) {
            $q->whereNotIn('status', ['cancelled']);
        }

        if (Schema::hasColumn('bookings','seat_numbers')) {
            $rows = (clone $q)->pluck('seat_numbers');
            foreach ($rows as $val) {
                if (is_array($val)) { // hầu như không xảy ra với query builder
                    $all = array_merge($all, $val);
                } elseif (is_string($val) && $val!=='') {
                    $dec = json_decode($val, true);
                    if (json_last_error()===JSON_ERROR_NONE && is_array($dec)) $all = array_merge($all, $dec);
                    else $all = array_merge($all, array_map('trim', explode(',', $val)));
                }
            }
        } elseif (Schema::hasColumn('bookings','seat_number')) {
            $all = (clone $q)->pluck('seat_number')->all();
        } elseif (Schema::hasColumn('bookings','seats_list')) {
            $rows = (clone $q)->pluck('seats_list');
            foreach ($rows as $val) {
                if (is_string($val) && $val!=='') {
                    $all = array_merge($all, array_map('trim', explode(',', $val)));
                }
            }
        }

        return collect($all)
            ->map(fn($x)=>(int)$x)
            ->filter(fn($x)=>$x>0)
            ->unique()
            ->values()
            ->all();
    }

    private function makeBookingCode(int $tripId): string
    {
        do {
            $code = sprintf('BK%s-%d-%04d',
                now()->format('ymd'),
                $tripId,
                random_int(0, 9999)
            );
        } while (Booking::where('code', $code)->exists());

        return $code;
    }
}
