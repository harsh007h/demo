<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'previous_owner_id',
        'new_owner_id',
        'performed_by',
        'action',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function previousOwner()
    {
        return $this->belongsTo(User::class, 'previous_owner_id');
    }

    public function newOwner()
    {
        return $this->belongsTo(User::class, 'new_owner_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
