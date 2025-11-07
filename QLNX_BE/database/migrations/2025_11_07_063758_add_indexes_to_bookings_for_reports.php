<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Tạo index để truy vấn nhanh hơn
            $table->index('paid_at');
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Xoá index nếu rollback
            $table->dropIndex(['paid_at']);
            $table->dropIndex(['payment_status']);
        });
    }
};
