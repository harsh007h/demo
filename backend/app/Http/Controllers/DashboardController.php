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
    public function stats()
    {
        $v1 = \Illuminate\Support\Facades\Cache::get('order_cache_version', 1);
        $v2 = \Illuminate\Support\Facades\Cache::get('stock_cache_version', 1);
        $v3 = \Illuminate\Support\Facades\Cache::get('party_cache_version', 1);
        
        $cacheKey = "dashboard_stats_v{$v1}_{$v2}_{$v3}";

        $stats = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () {
            $totalOrders = Order::count();
            $pendingOrders = Order::where('status', 'Pending')->count();
            $lowStockCount = Stock::where('quantity', '<', 10)->count();
            $totalParties = Party::count();

            // Fetch recent 5 orders with party and items loaded
            $recentOrders = Order::with(['party', 'items'])
                ->orderBy('id', 'desc')
                ->take(5)
                ->get();

            // Fetch top 10 low stock items
            $lowStockItems = Stock::where('quantity', '<', 10)
                ->orderBy('quantity', 'asc')
                ->take(10)
                ->get();

            return [
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'low_stock_count' => $lowStockCount,
                'total_parties' => $totalParties,
                'recent_orders' => $recentOrders,
                'low_stock_items' => $lowStockItems
            ];
        });

        return response()->json($stats);
    }
}
