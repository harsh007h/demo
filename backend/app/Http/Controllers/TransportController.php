<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transport;

class TransportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');

        $version = \Illuminate\Support\Facades\Cache::get('transport_cache_version', 1);
        $cacheKey = "transports_v{$version}_page_{$page}_per_{$perPage}_search_" . md5($search);

        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($search, $perPage) {
            $query = Transport::query();
            
            if (!empty($search)) {
                $query->where('transport_name', 'LIKE', "%{$search}%");
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
            'transport_name' => 'required|string|max:255|unique:transports,transport_name',
        ]);

        $transport = Transport::create($validated);
        \Illuminate\Support\Facades\Cache::put('transport_cache_version', microtime(true));
        return response()->json($transport, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $transport = Transport::findOrFail($id);
        return response()->json($transport);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $transport = Transport::findOrFail($id);

        $validated = $request->validate([
            'transport_name' => 'required|string|max:255|unique:transports,transport_name,' . $id,
        ]);

        $transport->update($validated);
        \Illuminate\Support\Facades\Cache::put('transport_cache_version', microtime(true));
        return response()->json($transport);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $transport = Transport::findOrFail($id);
        $transport->delete();
        \Illuminate\Support\Facades\Cache::put('transport_cache_version', microtime(true));
        return response()->json(null, 204);
    }
}
