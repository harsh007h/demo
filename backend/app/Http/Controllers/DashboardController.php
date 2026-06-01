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

        return response()->json([
            'total_orders' => $totalOrders,
            'pending_orders' => $pendingOrders,
            'low_stock_count' => $lowStockCount,
            'total_parties' => $totalParties,
            'recent_orders' => $recentOrders,
            'low_stock_items' => $lowStockItems
        ]);
    }
}
