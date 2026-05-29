<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_date',
        'party_id',
        'transport_name',
        'transport_number',
        'payment_method',
        'status',
        'notes'
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }
}
