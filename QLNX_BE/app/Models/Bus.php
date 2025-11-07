<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bus extends Model
{
    protected $table = 'buses';
    protected $fillable = [
        'license_number',
        'type',
        'seats',
        'manufacturer',
        'model',
        'year',
        'note',
        'active'
    ];
}
