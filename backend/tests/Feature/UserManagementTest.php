<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test admin can access user management endpoints.
     */
    public function test_admin_can_access_users_endpoint()
    {
        // Create Admin
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Active',
            'api_token' => 'admin-token',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer admin-token',
            'Accept' => 'application/json',
        ])->getJson('/api/users');

        $response->assertStatus(200);
    }

    /**
     * Test staff cannot access user management endpoints.
     */
    public function test_staff_cannot_access_users_endpoint()
    {
        // Create Staff
        $staff = User::factory()->create([
            'role' => 'Staff',
            'status' => 'Active',
            'api_token' => 'staff-token',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer staff-token',
            'Accept' => 'application/json',
        ])->getJson('/api/users');

        $response->assertStatus(403);
    }

    /**
     * Test user creation with password hashing and uniqueness check.
     */
    public function test_admin_can_create_user()
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Active',
            'api_token' => 'admin-token',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer admin-token',
            'Accept' => 'application/json',
        ])->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'mobile' => '1234567890',
            'password' => 'secret123',
            'role' => 'Staff',
            'status' => 'Active',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'role' => 'Staff',
        ]);
        
        // Assert password is encrypted/hashed
        $user = User::where('email', 'newuser@example.com')->first();
        $this->assertTrue(Hash::check('secret123', $user->password));
    }

    /**
     * Test self-protection: Admin cannot delete themselves.
     */
    public function test_admin_cannot_delete_self()
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Active',
            'api_token' => 'admin-token',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer admin-token',
            'Accept' => 'application/json',
        ])->deleteJson("/api/users/{$admin->id}");

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'You cannot delete your own account.'
        ]);
    }

    /**
     * Test self-protection: Admin cannot deactivate themselves.
     */
    public function test_admin_cannot_deactivate_self()
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Active',
            'api_token' => 'admin-token',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer admin-token',
            'Accept' => 'application/json',
        ])->putJson("/api/users/{$admin->id}", [
            'status' => 'Inactive',
        ]);

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'You cannot deactivate your own account.'
        ]);
    }

    /**
     * Test status checks: Deactivated users cannot log in.
     */
    public function test_deactivated_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => Hash::make('password'),
            'status' => 'Inactive',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'inactive@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Your account has been deactivated.'
        ]);
    }
}
