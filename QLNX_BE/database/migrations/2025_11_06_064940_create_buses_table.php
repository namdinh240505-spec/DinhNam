<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buses', function (Blueprint $table) {
            $table->id();
            $table->string('license_number')->unique(); // Biển số xe
            $table->string('type');                     // Loại xe (ghế / giường / limousine)
            $table->integer('seats')->default(40);      // Số ghế
            $table->string('manufacturer')->nullable(); // Hãng xe (VD: Thaco, Ford,…)
            $table->string('model')->nullable();        // Dòng xe (VD: Universe,…)
            $table->year('year')->nullable();           // Năm sản xuất
            $table->text('note')->nullable();           // Ghi chú thêm
            $table->boolean('active')->default(true);   // Trạng thái hoạt động
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buses');
    }
};
