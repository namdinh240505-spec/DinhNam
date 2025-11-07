<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    // Nếu bảng có tên khác 'drivers' thì chỉnh lại, mặc định không cần.
    protected $table = 'drivers';

    // Các cột được phép gán dữ liệu hàng loạt
    protected $fillable = [
        'name',
        'phone',
        'license_number',
        'address',
        'avatar',
        'status',
    ];
}
