<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();

            $table->foreignId('route_id')
                  ->constrained('coach_routes')
                  ->cascadeOnDelete();

            $table->date('date');                    // Ngày khởi hành
            $table->string('time', 5);               // Giờ đi HH:MM

            // Thời lượng & giờ/ ngày đến
            $table->integer('duration_min')->nullable();   // Tổng phút di chuyển
            $table->string('arrive_time', 5)->nullable();  // Giờ đến HH:MM
            $table->date('arrive_date')->nullable();       // Ngày đến
            $table->tinyInteger('arrive_day_offset')->default(0); // 0 cùng ngày, 1 qua ngày

            // Thông tin xe/ bến
            $table->string('bus');                   // Biển số/ tên xe
            $table->unsignedInteger('seats');
            $table->unsignedInteger('booked')->default(0);
            $table->unsignedInteger('price');        // VNĐ
            $table->string('depart_station')->nullable();
            $table->string('arrive_station')->nullable();

            $table->string('status')->default('Open'); // Open/Full/Closed

            $table->timestamps();

            // (tuỳ chọn) tránh trùng lịch cùng tuyến/ngày/giờ
            // $table->unique(['route_id','date','time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
