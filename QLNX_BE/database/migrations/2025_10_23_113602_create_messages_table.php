<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('messages', function (Blueprint $t) {
        $t->id();
        $t->foreignId('conversation_id')->constrained()->cascadeOnDelete();
        $t->enum('role', ['user','bot']);
        $t->longText('content');
        $t->json('meta')->nullable(); // lưu citations / model / tokens...
        $t->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
