<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailOtp extends Model
{
    protected $table = 'email_otps';

    protected $fillable = [
        'email',
        'otp',
        'attempts',
        'expires_at',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Scope a query to only include valid (non-expired, unverified, and under limit attempts) OTPs.
     */
    public function scopeIsValid($query, $email)
    {
        return $query->where('email', $email)
                     ->whereNull('verified_at')
                     ->where('attempts', '<', 5)
                     ->where('expires_at', '>', now());
    }
}
