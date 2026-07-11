<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Party;

class PartyController extends Controller
{
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');

        $version = \Illuminate\Support\Facades\Cache::get('party_cache_version', 1);
        $cacheKey = "parties_v{$version}_page_{$page}_per_{$perPage}_search_" . md5($search);

        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($search, $perPage) {
            $query = Party::query();
            
            if (!empty($search)) {
                $query->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('mobile', 'LIKE', "%{$search}%");
            }
            
            return $query->orderBy('id', 'desc')->paginate($perPage);
        });

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20|unique:parties,mobile',
            'state' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'pincode' => 'required|string|max:10',
            'address' => 'required|string',
        ]);

        $party = Party::create($validated);
        \Illuminate\Support\Facades\Cache::put('party_cache_version', microtime(true));
        return response()->json($party, 201);
    }

    public function show(string $id)
    {
        $party = Party::findOrFail($id);
        return response()->json($party);
    }

    public function update(Request $request, string $id)
    {
        $party = Party::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'mobile' => 'sometimes|required|string|max:20|unique:parties,mobile,' . $id,
            'state' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:255',
            'pincode' => 'sometimes|required|string|max:10',
            'address' => 'sometimes|required|string',
        ]);

        $party->update($validated);
        \Illuminate\Support\Facades\Cache::put('party_cache_version', microtime(true));
        return response()->json($party);
    }

    public function destroy(string $id)
    {
        $party = Party::findOrFail($id);
        $party->delete();
        \Illuminate\Support\Facades\Cache::put('party_cache_version', microtime(true));
        return response()->json(null, 204);
    }
}
