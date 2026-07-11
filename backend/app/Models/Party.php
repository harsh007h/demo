<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Party extends Model
{
    use HasFactory, Auditable, SoftDeletes;

    protected $fillable = [
        'name',
        'mobile',
        'state',
        'city',
        'pincode',
        'address'
    ];
}
