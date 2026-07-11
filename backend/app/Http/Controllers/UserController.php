<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');

        $version = \Illuminate\Support\Facades\Cache::get('user_cache_version', 1);
        $cacheKey = "users_v{$version}_page_{$page}_per_{$perPage}_search_" . md5($search);

        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($search, $perPage) {
            $query = User::query();

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('mobile', 'LIKE', "%{$search}%");
                });
            }

            return $query->orderBy('id', 'desc')->paginate($perPage);
        });

        return response()->json($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'mobile' => 'nullable|string|digits:10',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:Admin,Staff',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $validated['password'] = Hash::make($request->password);

        $user = User::create($validated);

        \Illuminate\Support\Facades\Cache::put('user_cache_version', microtime(true));

        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'mobile' => 'sometimes|nullable|string|digits:10',
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|required|string|in:Admin,Staff',
            'status' => 'sometimes|required|string|in:Active,Inactive',
        ]);

        // Self-protection: demotion
        if ($user->id === $request->user()->id && isset($validated['role']) && $validated['role'] !== 'Admin') {
            return response()->json([
                'message' => 'You cannot demote yourself from Admin.'
            ], 400);
        }

        // Self-protection: deactivation
        if ($user->id === $request->user()->id && isset($validated['status']) && $validated['status'] === 'Inactive') {
            return response()->json([
                'message' => 'You cannot deactivate your own account.'
            ], 400);
        }

        if (isset($validated['password']) && !empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        \Illuminate\Support\Facades\Cache::put('user_cache_version', microtime(true));

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Self-protection: deletion
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.'
            ], 400);
        }

        $user->delete();

        \Illuminate\Support\Facades\Cache::put('user_cache_version', microtime(true));

        return response()->json(null, 204);
    }
}
