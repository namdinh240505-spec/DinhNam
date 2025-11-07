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
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique(); // đường dẫn ngắn, SEO
            $table->text('summary')->nullable();   // mô tả ngắn
            $table->longText('content')->nullable(); // nội dung đầy đủ
            $table->string('image', 255)->nullable(); // ảnh đại diện
            $table->string('category', 100)->default('general'); // loại tin: khuyến mãi, lịch chạy...
            $table->enum('status', ['draft', 'published'])->default('published');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('news');
    }
};
