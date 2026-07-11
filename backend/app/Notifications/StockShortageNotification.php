<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StockShortageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $productSize;
    public int $shortage;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $productSize, int $shortage)
    {
        $this->productSize = $productSize;
        $this->shortage = $shortage;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Stock Shortage',
            'message' => "{$this->productSize} Size stock shortage.\nNeed to produce {$this->shortage} more pieces.",
            'type' => 'stock_shortage',
        ];
    }
}
