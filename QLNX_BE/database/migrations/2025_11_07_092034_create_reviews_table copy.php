<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_id')->constrained('trips')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1..5
            $table->text('comment')->nullable();
            $table->timestamps();

            // 1 người chỉ review 1 lần cho 1 chuyến
            $table->unique(['user_id', 'trip_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('reviews');
    }
};
