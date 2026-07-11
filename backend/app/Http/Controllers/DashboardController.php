<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Party;
use App\Models\Stock;

class DashboardController extends Controller
{
    /**
     * Get all dashboard stats consolidated into one response.
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        
        $v1 = \Illuminate\Support\Facades\Cache::get('order_cache_version', 1);
        $v2 = \Illuminate\Support\Facades\Cache::get('stock_cache_version', 1);
        $v3 = \Illuminate\Support\Facades\Cache::get('party_cache_version', 1);
        
        $cacheKey = "dashboard_stats_v{$v1}_{$v2}_{$v3}_user_{$user->id}";

        $stats = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
            if ($user->role === 'Admin') {
                $totalOrders = Order::count();
                $pendingOrders = Order::where('status', 'Pending')->count();
                $completedOrders = Order::where('status', 'Completed')->count();
                $lowStockCount = Stock::where('quantity', '<', 10)->count();
                $totalParties = Party::count();

                // Fetch recent 5 orders with party and items loaded
                $recentOrders = Order::with(['party', 'items', 'user'])
                    ->orderBy('id', 'desc')
                    ->take(5)
                    ->get();

                // Fetch top 10 low stock items
                $lowStockItems = Stock::where('quantity', '<', 10)
                    ->orderBy('quantity', 'asc')
                    ->take(10)
                    ->get();
                    
                // Staff-wise Order Count
                $staffStats = \App\Models\User::where('role', '!=', 'Admin')
                    ->withCount([
                        'orders as total_orders',
                        'orders as pending_orders' => function ($query) {
                            $query->where('status', 'Pending');
                        },
                        'orders as completed_orders' => function ($query) {
                            $query->where('status', 'Completed');
                        }
                    ])
                    ->get()
                    ->map(function ($staff) {
                        return [
                            'name' => $staff->name,
                            'total_orders' => $staff->total_orders,
                            'pending' => $staff->pending_orders,
                            'completed' => $staff->completed_orders
                        ];
                    });

                return [
                    'total_orders' => $totalOrders,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                    'low_stock_count' => $lowStockCount,
                    'total_parties' => $totalParties,
                    'recent_orders' => $recentOrders,
                    'low_stock_items' => $lowStockItems,
                    'staff_stats' => $staffStats
                ];
            } else {
                // Staff stats
                $myTotalOrders = Order::where('user_id', $user->id)->count();
                $myPendingOrders = Order::where('user_id', $user->id)->where('status', 'Pending')->count();
                $myCompletedOrders = Order::where('user_id', $user->id)->where('status', 'Completed')->count();
                $myCancelledOrders = Order::where('user_id', $user->id)->where('status', 'Cancelled')->count();
                
                $recentOrders = Order::with(['party', 'items'])
                    ->where('user_id', $user->id)
                    ->orderBy('id', 'desc')
                    ->take(5)
                    ->get();
                    
                return [
                    'total_orders' => $myTotalOrders,
                    'pending_orders' => $myPendingOrders,
                    'completed_orders' => $myCompletedOrders,
                    'cancelled_orders' => $myCancelledOrders,
                    'recent_orders' => $recentOrders,
                    // Return 0/empty for others to avoid frontend JS errors if they don't check
                    'low_stock_count' => 0,
                    'total_parties' => 0,
                    'low_stock_items' => [],
                    'staff_stats' => []
                ];
            }
        });

        return response()->json($stats);
    }
}
