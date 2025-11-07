<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'code','trip_id','customer','phone','seats',
        'seat_numbers', 'status',
        'paid','payment_status','payment_method','payment_txn_id','amount_paid','paid_at',
        'payment_attempts',
    ];

    protected $casts = [
        'seat_numbers' => 'array',   // ✅ Laravel tự json_encode/decode
        'paid'         => 'boolean',
        'paid_at'      => 'datetime',
    ];

    protected $appends = ['is_paid'];

    // Quan hệ tới trip
    public function trip()
    {
        return $this->belongsTo(Trip::class, 'trip_id');
    }

    // Cờ tính toán cho FE
    public function getIsPaidAttribute(): bool
    {
        return ($this->payment_status === 'paid') || $this->paid === true || !is_null($this->paid_at);
    }
}
