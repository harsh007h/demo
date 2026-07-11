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
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

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

            $paginator = $query->orderBy('id', 'desc')->paginate($perPage);
            
            // Format items using Resource while keeping standard Paginator structure
            $paginator->setCollection(OrderResource::collection($paginator->getCollection())->collection);
            return $paginator;
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
    public function store(StoreOrderRequest $request)
    {
        $order = $this->orderService->createOrder($request->validated());
        \Illuminate\Support\Facades\Cache::put('order_cache_version', microtime(true));

        return response()->json([
            'message' => 'Order created successfully',
            'order' => new OrderResource($order),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $order = Order::with(['party', 'items', 'user', 'logs.performer'])->find($id);
        
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        Gate::authorize('view', $order);

        return response()->json(new OrderResource($order));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrderRequest $request, string $id)
    {
        $order = Order::with('items')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        Gate::authorize('update', $order);

        $updatedOrder = $this->orderService->updateOrder($order, $request->validated());
        \Illuminate\Support\Facades\Cache::put('order_cache_version', microtime(true));

        return response()->json([
            'message' => 'Order updated successfully',
            'order' => new OrderResource($updatedOrder),
        ]);
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
