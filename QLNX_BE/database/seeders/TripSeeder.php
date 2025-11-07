<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Trip;
use App\Models\CoachRoute;
use Carbon\Carbon;

class TripSeeder extends Seeder
{
    public function run(): void
    {
        $routes = CoachRoute::all();

        if ($routes->isEmpty()) {
            $this->command->warn('⚠️ Chưa có CoachRoute nào. Hãy seed/tạo tuyến trước.');
            return;
        }

        $defaultStations = [
            'Hà Nội'        => 'BX Mỹ Đình',
            'Hải Phòng'     => 'BX Niệm Nghĩa',
            'Quảng Ninh'    => 'BX Bãi Cháy',
            'Ninh Bình'     => 'BX Ninh Bình',
            'Thanh Hóa'     => 'BX Phía Bắc Thanh Hóa',
            'Vinh'          => 'BX Vinh',
            'Huế'           => 'BX Phía Nam Huế',
            'Đà Nẵng'       => 'BX Trung Tâm Đà Nẵng',
            'Quảng Ngãi'    => 'BX Quảng Ngãi',
            'Nha Trang'     => 'BX Phía Nam Nha Trang',
            'Đà Lạt'        => 'BX Liên Tỉnh Đà Lạt',
            'TP. HCM'       => 'BX Miền Đông Mới',
            'Cần Thơ'       => 'BX Cần Thơ',
            'Vũng Tàu'      => 'BX Vũng Tàu',
            'Cà Mau'        => 'BX Cà Mau',
            'Bạc Liêu'      => 'BX Bạc Liêu',
            'An Giang'      => 'BX Long Xuyên',
            'Buôn Ma Thuột' => 'BX Buôn Ma Thuột',
        ];

        $durTable = [
            'Hà Nội-Hải Phòng'      => 150,
            'Hà Nội-Quảng Ninh'     => 210,
            'Hà Nội-Ninh Bình'      => 120,
            'Hà Nội-Đà Nẵng'        => 900,
            'Hà Nội-Thanh Hóa'      => 210,
            'Hà Nội-Vinh'           => 330,
            'Ninh Bình-Đà Nẵng'     => 600,
            'Hải Phòng-Đà Nẵng'     => 840,

            'Huế-Đà Nẵng'           => 120,
            'Đà Nẵng-Quảng Ngãi'    => 210,
            'Đà Nẵng-Nha Trang'     => 600,
            'Đà Nẵng-Đà Lạt'        => 720,
            'Huế-Quảng Ngãi'        => 330,
            'Vinh-Huế'              => 480,
            'Thanh Hóa-Đà Nẵng'     => 720,

            'TP. HCM-Nha Trang'     => 600,
            'TP. HCM-Cần Thơ'       => 210,
            'TP. HCM-Đà Lạt'        => 360,
            'TP. HCM-Bạc Liêu'      => 420,
            'Cần Thơ-Vũng Tàu'      => 360,
            'TP. HCM-Cà Mau'        => 660,
            'TP. HCM-Vũng Tàu'      => 150,
            'Đà Lạt-Nha Trang'      => 240,
            'Buôn Ma Thuột-TP. HCM' => 420,
            'Bạc Liêu-Cà Mau'       => 90,
            'TP. HCM-An Giang'      => 360,
            'Cần Thơ-Bạc Liêu'      => 150,
        ];

        $stationFor = function (string $city) use ($defaultStations): string {
            return $defaultStations[$city] ?? ('Trung tâm ' . $city);
        };

        $estimateDuration = function (string $from, string $to) use ($durTable): int {
            $key = $from . '-' . $to;
            if (isset($durTable[$key])) return $durTable[$key];

            $north   = ['Hà Nội','Hải Phòng','Quảng Ninh','Ninh Bình','Thanh Hóa','Vinh'];
            $central = ['Huế','Đà Nẵng','Quảng Ngãi','Đà Lạt','Nha Trang','Buôn Ma Thuột'];
            $south   = ['TP. HCM','Cần Thơ','Vũng Tàu','Cà Mau','Bạc Liêu','An Giang'];

            $bucket = function($c) use($north,$central,$south){
                if (in_array($c,$north,true)) return 'N';
                if (in_array($c,$central,true)) return 'C';
                if (in_array($c,$south,true)) return 'S';
                return '?';
            };

            $a = $bucket($from); $b = $bucket($to);
            if ($a === $b && $a !== '?') return 240; // ~4h
            return 540;                               // ~9h
        };

        $timePool = ['05:30','06:45','07:15','08:30','09:45','11:15','13:00','14:15','15:45','16:45','18:30','20:00','20:30','21:45','23:00'];

        $targetTrips   = 1000;
        $maxDaysAhead  = 45;
        $slotsPerDay   = 4;

        $created = 0;

        for ($d = 0; $d < $maxDaysAhead && $created < $targetTrips; $d++) {
            $dateStr = Carbon::now()->startOfDay()->addDays($d)->toDateString();

            foreach ($routes->shuffle() as $route) {
                if ($created >= $targetTrips) break;

                $from = $route->from ?? ($route->start ?? 'Điểm A');
                $to   = $route->to   ?? ($route->end   ?? 'Điểm B');

                $departStation = $stationFor($from);
                $arriveStation = $stationFor($to);

                $durationMin = $estimateDuration($from, $to);

                $times = collect($timePool)->shuffle()->take($slotsPerDay)->values();

                foreach ($times as $timeSlot) {
                    if ($created >= $targetTrips) break;

                    $exists = Trip::where('route_id', $route->id)
                        ->where('date', $dateStr)
                        ->where('time', $timeSlot)
                        ->exists();
                    if ($exists) continue;

                    $busPlate = $this->randBusPlate();
                    $seats    = random_int(28, 40);

                    // 25k–35k/giờ, làm tròn 5,000
                    $price = $this->roundToVnd(
                        max(50000, (int) (($durationMin / 60) * random_int(25000, 35000)))
                    );

                    // === TÍNH GIỜ ĐẾN ===
                    $departAt   = Carbon::parse("{$dateStr} {$timeSlot}");         // ngày/giờ xuất phát
                    $arriveAt   = (clone $departAt)->addMinutes($durationMin);     // thời điểm đến
                    $arriveTime = $arriveAt->format('H:i');                        // HH:mm
                    $arriveDate = $arriveAt->toDateString();                       // YYYY-mm-dd
                    $dayOffset  = $arriveAt->isSameDay($departAt) ? 0 : 1;         // 0: cùng ngày, 1: qua ngày

                    Trip::create([
                        'route_id'          => $route->id,
                        'date'              => $dateStr,
                        'time'              => $timeSlot,
                        'bus'               => $busPlate,
                        'seats'             => $seats,
                        'booked'            => 0,
                        'price'             => $price,
                        'status'            => 'Open',
                        'depart_station'    => $departStation,
                        'arrive_station'    => $arriveStation,
                        'duration_min'      => $durationMin,

                        // ↓↓↓ các trường giờ đến ↓↓↓
                        'arrive_time'       => $arriveTime,
                        // 2 trường dưới là tuỳ chọn – chỉ set nếu bảng có cột:
                        'arrive_date'       => $arriveDate,     // cần cột DATE
                        'arrive_day_offset' => $dayOffset,      // tinyint/bool
                    ]);

                    $created++;
                }
            }
        }

        $this->command->info("✅ Đã tạo tối thiểu {$created} chuyến xe (rải {$maxDaysAhead} ngày, nhiều khung giờ/ngày).");
    }

    private function randBusPlate(): string
    {
        $prov = collect([11,12,14,15,17,18,19,29,30,31,33,34,36,37,38,40,43,47,49,50,51,59,60,65,69,75])->random();
        $mid  = chr(random_int(65, 66)); // A..B
        $a = random_int(100, 999);
        $b = random_int(10, 99);
        return sprintf("%02d%s-%03d.%02d", $prov, $mid, $a, $b);
    }

    private function roundToVnd(int $v): int
    {
        $step = 5000;
        return (int) (round($v / $step) * $step);
    }
}
