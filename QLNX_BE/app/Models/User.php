<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    // Khai báo rõ ràng (an toàn nếu trước đây từng dùng 'user')
    protected $table = 'users';

    protected $fillable = [
        'name', 'email', 'username', 'phone', 'address',
        'avatar', 'roles', 'status', 'created_by', 'password',
    ];

    // Giá trị mặc định nếu cột có trong DB
    protected $attributes = [
        'roles'  => 'customer',
        'status' => 1,           // true
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'status'            => 'boolean',
        'password'          => 'hashed', // Laravel tự Hash khi set
    ];
}
