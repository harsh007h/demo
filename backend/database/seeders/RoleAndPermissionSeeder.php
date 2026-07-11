<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        $permissions = [
            'view orders',
            'create orders',
            'update orders',
            'delete orders',
            'assign orders',
            
            'view stocks',
            'create stocks',
            'update stocks',
            'delete stocks',
            
            'view users',
            'create users',
            'update users',
            'delete users',
            
            'view parties',
            'create parties',
            'update parties',
            'delete parties',

            'view transports',
            'create transports',
            'update transports',
            'delete transports',
            
            'view dashboard',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // create roles and assign existing permissions
        $staffRole = Role::firstOrCreate(['name' => 'Staff']);
        $staffRole->syncPermissions([
            'view orders',
            'create orders',
            'view stocks',
            'view parties',
            'view transports',
        ]);

        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $adminRole->syncPermissions(Permission::all());

        // Assign roles to existing users based on their 'role' column
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role === 'Admin') {
                $user->assignRole('Admin');
            } else {
                $user->assignRole('Staff');
            }
        }
    }
}
