<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = ['report_date', 'orders_count', 'tickets_sold', 'revenue'];

    protected $casts = [
        'report_date' => 'date',
        'orders_count' => 'integer',
        'tickets_sold' => 'integer',
        'revenue' => 'decimal:2',
    ];
}
