<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications.
     */
    public function index()
    {
        $version = \Illuminate\Support\Facades\Cache::get('notification_cache_version', 1);
        $cacheKey = "notifications_v{$version}_limit100";

        $notifications = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () {
            return Notification::orderBy('id', 'desc')->limit(100)->get();
        });

        return response()->json($notifications);
    }

    /**
     * Mark the specified notification as read.
     */
    public function markAsRead(string $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->is_read = true;
        $notification->save();

        \Illuminate\Support\Facades\Cache::increment('notification_cache_version');

        return response()->json($notification);
    }

    /**
     * Remove the specified notification from storage.
     */
    public function destroy(string $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        \Illuminate\Support\Facades\Cache::increment('notification_cache_version');

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
