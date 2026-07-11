<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $userId = $request->input('user_id', '');
        $user = $request->user();

        $version = \Illuminate\Support\Facades\Cache::get('order_cache_version', 1);
        $cacheKey = "orders_v{$version}_page_{$page}_per_{$perPage}_search_" . md5($search) . "_status_{$status}_user_{$userId}_auth_" . $user->id;

        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($search, $status, $perPage, $user, $userId) {
            $query = Order::with(['party', 'items', 'user']);
            
            if ($user->role !== 'Admin') {
                $query->where('user_id', $user->id);
            } else if (!empty($userId)) {
                $query->where('user_id', $userId);
            }

            if (!empty($search)) {
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
            
            if (!empty($status)) {
                $query->where('status', $status);
            }

            return $query->orderBy('id', 'desc')->paginate($perPage);
        });

        return response()->json($result);
    }

    /**
     * Get order stats (total orders, pending orders count).
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        $version = \Illuminate\Support\Facades\Cache::get('order_cache_version', 1);
        $cacheKey = "orders_stats_v{$version}_auth_" . $user->id;

        $stats = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
            $query = Order::query();
            if ($user->role !== 'Admin') {
                $query->where('user_id', $user->id);
            }
            return [
                'total_orders' => (clone $query)->count(),
                'pending_orders' => (clone $query)->where('status', 'Pending')->count()
            ];
        });

        return response()->json($stats);
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
            'user_id' => 'sometimes|exists:users,id',
            'products' => 'required|array|min:1',
            'products.*.serial_no' => 'required|string',
            'products.*.size' => 'required|string',
            'products.*.pieces' => 'required|integer|min:1',
        ]);

        $userId = auth()->id();
        if (auth()->user()->role === 'Admin' && isset($validated['user_id'])) {
            $userId = $validated['user_id'];
        }

        return DB::transaction(function () use ($validated, $userId) {
            $orderData = Arr::except($validated, ['products', 'user_id']);
            $orderData['user_id'] = $userId;
            
            $order = Order::create($orderData);
            
            OrderLog::create([
                'order_id' => $order->id,
                'new_owner_id' => $userId,
                'performed_by' => auth()->id(),
                'action' => 'created',
            ]);

            foreach ($validated['products'] as $product) {
                $order->items()->create([
                    'serial_no' => $product['serial_no'],
                    'size' => $product['size'],
                    'pieces' => $product['pieces'],
                ]);

                // Decrement stock quantity
                $stock = \App\Models\Stock::where('product_name', $product['serial_no'])->where('product_size', $product['size'])->first();
                $availableStock = $stock ? $stock->quantity : 0;

                if ($product['pieces'] > $availableStock) {
                    $shortage = $product['pieces'] - $availableStock;
                    \App\Models\Notification::create([
                        'title' => 'Stock Shortage',
                        'message' => "{$product['size']} Size stock shortage.\nNeed to produce {$shortage} more pieces.",
                        'type' => 'stock_shortage',
                        'is_read' => false,
                    ]);
                }

                if ($stock) {
                    $stock->quantity = max(0, $stock->quantity - $product['pieces']);
                    $stock->save();
                }
            }
            \Illuminate\Support\Facades\Cache::put('order_cache_version', microtime(true));
            \Illuminate\Support\Facades\Cache::put('stock_cache_version', microtime(true));
            \Illuminate\Support\Facades\Cache::put('notification_cache_version', microtime(true));
            return response()->json($order->load('items'), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $order = Order::with(['party', 'items', 'user'])->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }
        
        Gate::authorize('view', $order);
        
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

        Gate::authorize('update', $order);

        $validated = $request->validate([
            'order_date' => 'sometimes|required|date',
            'party_id' => 'sometimes|required|exists:parties,id',
            'transport_name' => 'sometimes|required|string',
            'transport_number' => 'nullable|string',
            'payment_method' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'notes' => 'nullable|string',
            'user_id' => 'sometimes|exists:users,id',
            'products' => 'sometimes|required|array|min:1',
            'products.*.serial_no' => 'required|string',
            'products.*.size' => 'required|string',
            'products.*.pieces' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($order, $validated) {
            $previousOwner = $order->user_id;

            if (auth()->user()->role === 'Admin' && isset($validated['user_id'])) {
                $order->user_id = $validated['user_id'];
            }

            $action = 'updated';
            if ($previousOwner != $order->user_id) {
                $action = 'reassigned';
            }

            OrderLog::create([
                'order_id' => $order->id,
                'previous_owner_id' => $previousOwner,
                'new_owner_id' => $order->user_id,
                'performed_by' => auth()->id(),
                'action' => $action,
            ]);

            // Restore stock levels from previous order items
            foreach ($order->items as $item) {
                $stock = \App\Models\Stock::where('product_name', $item->serial_no)->where('product_size', $item->size)->first();
                if ($stock) {
                    $stock->quantity += $item->pieces;
                    $stock->save();
                }
            }

            $order->update(Arr::except($validated, ['products', 'user_id']));

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
                    $availableStock = $stock ? $stock->quantity : 0;

                    if ($product['pieces'] > $availableStock) {
                        $shortage = $product['pieces'] - $availableStock;
                        \App\Models\Notification::create([
                            'title' => 'Stock Shortage',
                            'message' => "{$product['size']} Size stock shortage.\nNeed to produce {$shortage} more pieces.",
                            'type' => 'stock_shortage',
                            'is_read' => false,
                        ]);
                    }

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
            \Illuminate\Support\Facades\Cache::put('order_cache_version', microtime(true));
            \Illuminate\Support\Facades\Cache::put('stock_cache_version', microtime(true));
            \Illuminate\Support\Facades\Cache::put('notification_cache_version', microtime(true));
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

        Gate::authorize('delete', $order);

        DB::transaction(function () use ($order) {
            OrderLog::create([
                'order_id' => $order->id,
                'previous_owner_id' => $order->user_id,
                'performed_by' => auth()->id(),
                'action' => 'deleted',
            ]);

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

        \Illuminate\Support\Facades\Cache::put('order_cache_version', microtime(true));
        \Illuminate\Support\Facades\Cache::put('stock_cache_version', microtime(true));

        return response()->json(['message' => 'Order deleted successfully']);
    }
}
