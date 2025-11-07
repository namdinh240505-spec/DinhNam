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
        Schema::create('user', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('email', 255)->unique();
            $table->string('phone', 255)->unique(); // <-- KHÔNG nullable, KHÔNG default

            $table->string('username', 255)->unique()->nullable(); // Nếu không bắt buộc đăng nhập bằng username
            $table->string('password', 255);
            $table->string('address', 1000)->nullable(); // ✅ Cho phép null
            $table->string('avatar', 255)->nullable(); // Có thể mặc định ảnh đại diện
            $table->enum('roles', ['customer', 'admin'])->default('customer');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
        
            $table->boolean('status')->default(1); // Bật mặc định
        
            $table->softDeletes(); // Chỉ cần $table->softDeletes()
            $table->timestamps();  // Tạo created_at và updated_at
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
