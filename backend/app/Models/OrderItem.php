<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'serial_no',
        'size',
        'pieces'
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
