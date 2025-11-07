<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('news')->insert([
            [
                'title' => 'Tăng chuyến dịp Tết Nguyên Đán 2026',
                'slug' => Str::slug('Tăng chuyến dịp Tết Nguyên Đán 2026'),
                'summary' => 'HuyNamBusLines tăng thêm 20% số chuyến TP.HCM ↔ Vũng Tàu dịp Tết.',
                'content' => '<p>Nhằm phục vụ nhu cầu đi lại tăng cao...</p>',
                'image' => 'news/tet2026.jpg',
                'category' => 'lich-chay',
                'status' => 'published',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Ưu đãi 50% giá vé cho sinh viên tháng 12',
                'slug' => Str::slug('Ưu đãi 50% giá vé cho sinh viên tháng 12'),
                'summary' => 'Sinh viên được giảm 50% khi đặt vé trực tuyến qua MoMo.',
                'content' => '<p>Chương trình áp dụng cho các tuyến từ TP.HCM...</p>',
                'image' => 'news/uudai-sv.jpg',
                'category' => 'khuyen-mai',
                'status' => 'published',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
