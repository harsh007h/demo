<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Order::with(['party', 'items']);
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('transport_name', 'LIKE', "%{$search}%")
                  ->orWhere('transport_number', 'LIKE', "%{$search}%")
                  ->orWhere('notes', 'LIKE', "%{$search}%")
                  ->orWhereHas('party', function($qp) use ($search) {
                      $qp->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('mobile', 'LIKE', "%{$search}%");
                  });
            });
        }
        
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10);
        $orders = $query->orderBy('id', 'desc')->paginate($perPage);
        return response()->json($orders);
    }

    /**
     * Get order stats (total orders, pending orders count).
     */
    public function stats()
    {
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'Pending')->count();

        return response()->json([
            'total_orders' => $totalOrders,
            'pending_orders' => $pendingOrders
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_date' => 'required|date',
            'party_id' => 'required|exists:parties,id',
            'transport_name' => 'required|string',
            'transport_number' => 'nullable|string',
            'payment_method' => 'required|string',
            'status' => 'required|string',
            'notes' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.serial_no' => 'required|string',
            'products.*.size' => 'required|string',
            'products.*.pieces' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated) {
            $order = Order::create(Arr::except($validated, ['products']));
            foreach ($validated['products'] as $product) {
                $order->items()->create([
                    'serial_no' => $product['serial_no'],
                    'size' => $product['size'],
                    'pieces' => $product['pieces'],
                ]);

                // Decrement stock quantity
                $stock = \App\Models\Stock::where('product_name', $product['serial_no'])->where('product_size', $product['size'])->first();
                if ($stock) {
                    $stock->quantity = max(0, $stock->quantity - $product['pieces']);
                    $stock->save();
                }
            }
            return response()->json($order->load('items'), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $order = Order::with(['party', 'items'])->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }
        return response()->json($order);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $order = Order::with('items')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $validated = $request->validate([
            'order_date' => 'sometimes|required|date',
            'party_id' => 'sometimes|required|exists:parties,id',
            'transport_name' => 'sometimes|required|string',
            'transport_number' => 'nullable|string',
            'payment_method' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'notes' => 'nullable|string',
            'products' => 'sometimes|required|array|min:1',
            'products.*.serial_no' => 'required|string',
            'products.*.size' => 'required|string',
            'products.*.pieces' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($order, $validated) {
            // Restore stock levels from previous order items
            foreach ($order->items as $item) {
                $stock = \App\Models\Stock::where('product_name', $item->serial_no)->where('product_size', $item->size)->first();
                if ($stock) {
                    $stock->quantity += $item->pieces;
                    $stock->save();
                }
            }

            $order->update(Arr::except($validated, ['products']));

            if (isset($validated['products'])) {
                $order->items()->delete();
                foreach ($validated['products'] as $product) {
                    $order->items()->create([
                        'serial_no' => $product['serial_no'],
                        'size' => $product['size'],
                        'pieces' => $product['pieces'],
                    ]);

                    // Deduct stock levels for updated order items
                    $stock = \App\Models\Stock::where('product_name', $product['serial_no'])->where('product_size', $product['size'])->first();
                    if ($stock) {
                        $stock->quantity = max(0, $stock->quantity - $product['pieces']);
                        $stock->save();
                    }
                }
            } else {
                // If products were not updated, re-apply deductions to stay balanced
                foreach ($order->items as $item) {
                    $stock = \App\Models\Stock::where('product_name', $item->serial_no)->where('product_size', $item->size)->first();
                    if ($stock) {
                        $stock->quantity = max(0, $stock->quantity - $item->pieces);
                        $stock->save();
                    }
                }
            }

            return response()->json($order->load('items'));
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $order = Order::with('items')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        DB::transaction(function () use ($order) {
            // Restore stock quantities
            foreach ($order->items as $item) {
                $stock = \App\Models\Stock::where('product_name', $item->serial_no)->where('product_size', $item->size)->first();
                if ($stock) {
                    $stock->quantity += $item->pieces;
                    $stock->save();
                }
            }
            $order->delete();
        });

        return response()->json(['message' => 'Order deleted successfully']);
    }
}
