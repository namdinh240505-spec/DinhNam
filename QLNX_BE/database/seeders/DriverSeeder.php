<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DriverSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('drivers')->insert([
            [
                'name' => 'Nguyễn Văn A',
                'phone' => '0905123456',
                'license_number' => 'BKS-12345',
                'address' => '123 Lý Thường Kiệt, Đà Nẵng',
                'avatar' => 'driver_a.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Trần Văn B',
                'phone' => '0905234567',
                'license_number' => 'BKS-23456',
                'address' => '45 Nguyễn Huệ, Huế',
                'avatar' => 'driver_b.jpg',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Phạm Văn C',
                'phone' => '0905345678',
                'license_number' => 'BKS-34567',
                'address' => '78 Hai Bà Trưng, Hà Nội',
                'avatar' => 'driver_c.jpg',
                'status' => 'inactive',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
