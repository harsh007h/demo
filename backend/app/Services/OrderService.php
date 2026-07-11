<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderLog;
use App\Notifications\StockShortageNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class OrderService
{
    /**
     * Create a new order with items and log.
     */
    public function createOrder(array $validated): Order
    {
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

                // Deduct stock levels
                $stock = \App\Models\Stock::where('product_name', $product['serial_no'])
                                          ->where('product_size', $product['size'])
                                          ->first();
                $availableStock = $stock ? $stock->quantity : 0;

                if ($product['pieces'] > $availableStock) {
                    $shortage = $product['pieces'] - $availableStock;
                    $admins = \App\Models\User::role('Admin')->get();
                    Notification::send($admins, new StockShortageNotification($product['size'], $shortage));
                }

                if ($stock) {
                    $stock->quantity -= $product['pieces'];
                    $stock->save();
                }
            }

            return $order->load('party', 'items', 'user', 'logs.performer');
        });
    }

    /**
     * Update an existing order and handle stock restoration/deduction.
     */
    public function updateOrder(Order $order, array $validated): Order
    {
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
                        $admins = \App\Models\User::role('Admin')->get();
                        Notification::send($admins, new StockShortageNotification($product['size'], $shortage));
                    }

                    if ($stock) {
                        $stock->quantity -= $product['pieces'];
                        $stock->save();
                    }
                }
            }

            return $order->load('party', 'items', 'user', 'logs.performer');
        });
    }
}
