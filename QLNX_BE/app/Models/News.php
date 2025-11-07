<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasFactory;

    protected $table = 'news';

    protected $fillable = [
        'title', 'slug', 'summary', 'content',
        'image', 'category', 'status', 'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Người tạo (nếu có users table)
    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
