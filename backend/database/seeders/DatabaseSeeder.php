<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Admin User
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'mobile' => '9876543210',
            'role' => 'Admin',
            'status' => 'Active',
        ]);

        // Seed Staff User
        User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'mobile' => '9876543211',
            'role' => 'Staff',
            'status' => 'Active',
        ]);

        // Seed Legacy/Test User as Admin for compatibility
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'mobile' => '9876543212',
            'role' => 'Admin',
            'status' => 'Active',
        ]);
    }
}
