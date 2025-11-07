<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('bookings', function (Blueprint $table) {
            // Lưu orderId cuối cùng khi gọi MoMo
            if (!Schema::hasColumn('bookings', 'last_order_id')) {
                $table->string('last_order_id')->nullable()->after('code');
            }

            // Số lần thử thanh toán
            if (!Schema::hasColumn('bookings', 'payment_attempts')) {
                $table->unsignedInteger('payment_attempts')->default(0)->after('last_order_id');
            }

            // Các trường thanh toán bổ sung (nếu chưa có)
            if (!Schema::hasColumn('bookings', 'payment_status')) {
                $table->string('payment_status')->default('unpaid')->after('paid');
            }
            if (!Schema::hasColumn('bookings', 'payment_method')) {
                $table->string('payment_method')->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('bookings', 'payment_txn_id')) {
                $table->string('payment_txn_id')->nullable()->after('payment_method');
            }
            if (!Schema::hasColumn('bookings', 'amount_paid')) {
                $table->unsignedBigInteger('amount_paid')->default(0)->after('payment_txn_id');
            }
            if (!Schema::hasColumn('bookings', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('amount_paid');
            }
        });
    }

    public function down(): void {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'last_order_id',
                'payment_attempts',
                'payment_status',
                'payment_method',
                'payment_txn_id',
                'amount_paid',
                'paid_at',
            ]);
        });
    }
};
