<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachRoute extends Model
{
    protected $table = 'coach_routes';
    protected $fillable = ['from','to','distance'];
}
