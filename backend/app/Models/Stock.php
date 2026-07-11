<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Stock extends Model
{
    use HasFactory, Auditable, SoftDeletes;

    protected $fillable = [
        'product_name',
        'product_size',
        'quantity'
    ];

    /**
     * Get visual status/alert for this stock item.
     * Threshold is below 10.
     */
    protected $appends = ['is_low_stock'];

    public function getIsLowStockAttribute(): bool
    {
        return $this->quantity < 10;
    }
}
