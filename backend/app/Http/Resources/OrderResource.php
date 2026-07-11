<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_date' => $this->order_date,
            'party_id' => $this->party_id,
            'transport_name' => $this->transport_name,
            'transport_number' => $this->transport_number,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'notes' => $this->notes,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Loaded relations
            'party' => $this->whenLoaded('party'),
            'user' => $this->whenLoaded('user'),
            'items' => $this->whenLoaded('items'),
            'logs' => $this->whenLoaded('logs'),
        ];
    }
}
