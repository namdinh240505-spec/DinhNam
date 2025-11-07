<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
       $this->call([
    UserSeeder::class,
    CoachRouteSeeder::class,
    TripSeeder::class,
    DriverSeeder::class,
    ReportSeeder::class,
    BusSeeder::class,
    NewsSeeder::class,
]);

    }
}
