<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
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
        ];
    }
}
