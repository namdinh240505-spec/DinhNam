<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('reports')->insert([
            [
                'trip_id' => 1,
                'driver_id' => 1,
                'report_date' => now()->subDays(1),
                'tickets_sold' => 32,
                'revenue' => 3200000,
                'expenses' => 1500000,
                'profit' => 1700000,
                'status' => 'completed',
                'note' => 'Chuyến Hà Nội - Hải Phòng, xe đầy đủ vé.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'trip_id' => 2,
                'driver_id' => 2,
                'report_date' => now(),
                'tickets_sold' => 25,
                'revenue' => 2500000,
                'expenses' => 1200000,
                'profit' => 1300000,
                'status' => 'completed',
                'note' => 'Chuyến Đà Nẵng - Huế, doanh thu ổn định.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
