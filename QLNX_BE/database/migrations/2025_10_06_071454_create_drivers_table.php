<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('drivers', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('phone')->unique();
        $table->string('license_number')->unique();
        $table->string('address')->nullable();
        $table->string('avatar')->nullable();
        $table->string('status')->default('active'); // active / inactive
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
