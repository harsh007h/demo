<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Stock;

class StockController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');

        $version = \Illuminate\Support\Facades\Cache::get('stock_cache_version', 1);
        $cacheKey = "stocks_v{$version}_page_{$page}_per_{$perPage}_search_" . md5($search);

        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($search, $perPage) {
            $query = Stock::query();

            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('product_name', 'LIKE', "%{$search}%")
                      ->orWhere('product_size', 'LIKE', "%{$search}%");
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
            'product_name' => 'required|string|max:100',
            'product_size' => 'required|string|max:50',
            'quantity' => 'required|integer|min:0',
        ]);

        // Unique composite check
        $exists = Stock::where('product_name', $validated['product_name'])
                       ->where('product_size', $validated['product_size'])
                       ->exists();
        if ($exists) {
            return response()->json(['message' => 'This product name and size combination already exists.'], 422);
        }

        $stock = Stock::create($validated);
        \Illuminate\Support\Facades\Cache::put('stock_cache_version', microtime(true));
        return response()->json($stock, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $stock = Stock::findOrFail($id);
        return response()->json($stock);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $stock = Stock::findOrFail($id);

        $validated = $request->validate([
            'product_name' => 'sometimes|required|string|max:100',
            'product_size' => 'sometimes|required|string|max:50',
            'quantity' => 'sometimes|required|integer|min:0',
        ]);

        $newName = $validated['product_name'] ?? $stock->product_name;
        $newSize = $validated['product_size'] ?? $stock->product_size;

        $exists = Stock::where('product_name', $newName)
                       ->where('product_size', $newSize)
                       ->where('id', '!=', $id)
                       ->exists();
        if ($exists) {
            return response()->json(['message' => 'This product name and size combination already exists.'], 422);
        }

        $stock->update($validated);
        \Illuminate\Support\Facades\Cache::put('stock_cache_version', microtime(true));
        return response()->json($stock);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $stock = Stock::findOrFail($id);
        $stock->delete();
        \Illuminate\Support\Facades\Cache::put('stock_cache_version', microtime(true));
        return response()->json(null, 204);
    }

    /**
     * Get stock stats (total items, low stock count).
     */
    public function stats()
    {
        $version = \Illuminate\Support\Facades\Cache::get('stock_cache_version', 1);
        $cacheKey = "stocks_stats_v{$version}";

        $stats = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () {
            return [
                'total_items' => Stock::count(),
                'low_stock_count' => Stock::where('quantity', '<', 10)->count()
            ];
        });

        return response()->json($stats);
    }
}
