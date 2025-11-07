<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    protected $fillable = [
        'route_id','date','time','arrive_time',
        'bus','seats','booked','price','status',
        'depart_station','arrive_station','duration_min',
    ];

    protected $casts = [
        'date'         => 'date:Y-m-d',
        'seats'        => 'integer',
        'booked'       => 'integer',
        'price'        => 'integer',
        'duration_min' => 'integer',
        // 'arrive_time' => 'string', // không bắt buộc, mặc định là string
    ];

    // ===== Relationships =====
    public function route()
    {
        return $this->belongsTo(CoachRoute::class, 'route_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'trip_id');
    }

    // ===== (Optional) Accessors cho FE =====
    protected $appends = ['duration_label', 'plus_one'];

    public function getDurationLabelAttribute(): string
    {
        $m = (int) ($this->duration_min ?? 0);
        if ($m <= 0) return '';
        $h = intdiv($m, 60);
        $r = $m % 60;
        if ($h && $r) return "{$h}h{$r}m";
        if ($h) return "{$h}h";
        return "{$r}m";
    }

    public function getPlusOneAttribute(): bool
    {
        // qua ngày nếu time + duration_min >= 24h
        if (!$this->time || !$this->duration_min) return false;
        if (!preg_match('/^\d{2}:\d{2}$/', $this->time)) return false;
        [$hh,$mm] = array_map('intval', explode(':', $this->time));
        $start = $hh * 60 + $mm;
        return ($start + (int)$this->duration_min) >= 1440;
    }
}
