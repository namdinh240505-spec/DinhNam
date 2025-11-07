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
    Schema::create('conversations', function (Blueprint $t) {
        $t->id();
        $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
        $t->string('title')->nullable();
        $t->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
