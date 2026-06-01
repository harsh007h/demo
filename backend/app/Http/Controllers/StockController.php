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
        $query = Stock::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('product_name', 'LIKE', "%{$search}%")
                  ->orWhere('product_size', 'LIKE', "%{$search}%");
            });
        }

        // Support custom page sizes, defaulting to 10
        $perPage = $request->input('per_page', 10);

        // Return paginated results, sorted by id desc
        $stocks = $query->orderBy('id', 'desc')->paginate($perPage);
        return response()->json($stocks);
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
        return response()->json($stock);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $stock = Stock::findOrFail($id);
        $stock->delete();
        return response()->json(null, 204);
    }

    /**
     * Get stock stats (total items, low stock count).
     */
    public function stats()
    {
        $totalItems = Stock::count();
        $lowStockCount = Stock::where('quantity', '<', 10)->count();

        return response()->json([
            'total_items' => $totalItems,
            'low_stock_count' => $lowStockCount
        ]);
    }
}
