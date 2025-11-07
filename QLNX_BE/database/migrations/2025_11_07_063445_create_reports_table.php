// database/migrations/2025_11_07_000000_create_reports_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date')->unique();         // mỗi ngày 1 dòng
            $table->unsignedInteger('orders_count')->default(0);
            $table->unsignedInteger('tickets_sold')->default(0);
            $table->decimal('revenue', 15, 2)->default(0); // VND
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
