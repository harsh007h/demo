<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            // Admins logic? In the previous setup, it was just grabbing all notifications from the global table.
            // Let's get all users who are admins and get their notifications, or just use the current user.
            // Since this was an admin-only route before:
            $user = \App\Models\User::role('Admin')->first();
        }

        if (!$user) {
            return response()->json([]);
        }

        $notifications = $user->notifications()->limit(100)->get()->map(function ($notification) {
            return [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'type' => $notification->data['type'] ?? 'info',
                'is_read' => $notification->read_at !== null,
                'created_at' => $notification->created_at,
            ];
        });

        return response()->json($notifications);
    }

    /**
     * Mark the specified notification as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user() ?? \App\Models\User::role('Admin')->first();
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json([
            'id' => $notification->id,
            'title' => $notification->data['title'] ?? 'Notification',
            'message' => $notification->data['message'] ?? '',
            'type' => $notification->data['type'] ?? 'info',
            'is_read' => true,
            'created_at' => $notification->created_at,
        ]);
    }

    /**
     * Remove the specified notification from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user() ?? \App\Models\User::role('Admin')->first();
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
