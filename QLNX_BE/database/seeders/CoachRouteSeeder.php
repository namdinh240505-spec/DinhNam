<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CoachRoute;

class CoachRouteSeeder extends Seeder
{
    public function run(): void
    {
        //  Các thành phố lớn - đóng vai trò là Hub (Điểm đi chính & Điểm đến quan trọng)
        $LARGE_CITIES = [
            'Hà Nội',
            'TP. HCM',
            'Đà Nẵng',
            'Hải Phòng',
            'Cần Thơ',
        ];

        // 🎯 Các tỉnh/thành phố khác (Điểm đến phụ)
        $NORTH_PROVINCES = [
            'Quảng Ninh',
            'Thái Nguyên',
            'Lào Cai', // Sapa
            'Lạng Sơn',
            'Thanh Hóa',
            'Nghệ An',
        ];

        $CENTRAL_PROVINCES = [
            'Huế',
            'Quảng Bình',
            'Quảng Nam', // Hội An
            'Khánh Hòa', // Nha Trang
            'Bình Định', // Quy Nhơn
            'Đà Lạt', // Lâm Đồng
        ];

        $SOUTH_PROVINCES = [
            'Vũng Tàu',
            'Đồng Nai',
            'Bình Dương',
            'Cà Mau',
            'Kiên Giang', // Phú Quốc
            'An Giang',
            'Cà Mau',
        ];

        // Gộp tất cả các điểm đến tiềm năng
        $DESTINATIONS = array_merge(
            $LARGE_CITIES,
            $NORTH_PROVINCES,
            $CENTRAL_PROVINCES,
            $SOUTH_PROVINCES
        );

        $FROMS = $LARGE_CITIES; // Chỉ lấy các thành phố lớn làm điểm xuất phát chính

        $count = 0;

        // Bắt đầu tạo dữ liệu
        foreach ($FROMS as $from) {
            foreach ($DESTINATIONS as $to) {
                // Tuyến đường phải khác điểm đi và điểm đến
                if ($from === $to) continue; 
                
                // Nếu là TP. HCM, tránh tuyến TP. HCM - Vũng Tàu và ngược lại (quá ngắn cho tuyến liên tỉnh chính)
                if (($from === 'TP. HCM' && $to === 'Vũng Tàu') || ($from === 'Vũng Tàu' && $to === 'TP. HCM')) {
                     // Bỏ qua hoặc chỉ tạo một chiều (tùy nhu cầu), ở đây tôi bỏ qua để tập trung tuyến dài
                     continue;
                }
                
                CoachRoute::firstOrCreate([
                    'from' => $from,
                    'to'   => $to,
                ]);
                $count++;
                
                // Thêm chiều ngược lại để tăng số lượng tuyến
                CoachRoute::firstOrCreate([
                    'from' => $to,
                    'to'   => $from,
                ]);
                $count++;
            }
        }
        
        // Loại bỏ trùng lặp (vì tôi đã tạo cả hai chiều)
        $totalRoutes = CoachRoute::count();

        $this->command->info("✅ Đã tạo/kiểm tra $totalRoutes tuyến đường đa dạng (tổng $count lần tạo)!");
    }
}
