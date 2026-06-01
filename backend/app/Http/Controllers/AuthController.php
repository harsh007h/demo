<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle the login request and return an API token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'Your account has been deactivated.'
            ], 403);
        }

        $token = Str::random(60);
        $user->forceFill([
            'api_token' => $token,
        ])->save();

        return response()->json([
            'token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'message' => 'Login successful'
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Logout and clear the token.
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->forceFill([
                'api_token' => null,
            ])->save();
        }

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }
}
