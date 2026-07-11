<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'mobile',
        'role',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Accessor for role.
     */
    public function getRoleAttribute($value)
    {
        if (empty($value)) {
            return 'Staff';
        }
        $role = ucfirst(strtolower($value));
        if ($role === 'User') {
            return 'Staff';
        }
        return $role;
    }

    /**
     * Mutator for role.
     */
    public function setRoleAttribute($value)
    {
        $this->attributes['role'] = $value ? ucfirst(strtolower($value)) : 'Staff';
    }

    /**
     * Accessor for status.
     */
    public function getStatusAttribute($value)
    {
        if (empty($value)) {
            return 'Active';
        }
        return ucfirst(strtolower($value));
    }

    /**
     * Mutator for status.
     */
    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $value ? ucfirst(strtolower($value)) : 'Active';
    }

    /**
     * Get the orders for the user.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
