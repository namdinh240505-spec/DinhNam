<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bus;

class BusSeeder extends Seeder
{
    public function run(): void
    {
        $buses = [
            [
                'license_number' => '51B-12345',
                'type' => 'Giường nằm',
                'seats' => 40,
                'manufacturer' => 'Thaco',
                'model' => 'Mobihome',
                'year' => 2020,
                'note' => 'Chạy tuyến Sài Gòn - Đà Lạt',
                'active' => true,
            ],
            [
                'license_number' => '30F-67890',
                'type' => 'Limousine',
                'seats' => 16,
                'manufacturer' => 'Ford',
                'model' => 'Transit',
                'year' => 2022,
                'note' => 'Chạy tuyến Hà Nội - Ninh Bình',
                'active' => true,
            ],
        ];

        foreach ($buses as $bus) {
            Bus::create($bus);
        }
    }
}
