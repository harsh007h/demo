<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
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
            'order_date' => 'sometimes|required|date',
            'party_id' => 'sometimes|required|exists:parties,id',
            'transport_name' => 'sometimes|required|string',
            'transport_number' => 'nullable|string',
            'payment_method' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'notes' => 'nullable|string',
            'user_id' => 'sometimes|exists:users,id',
            'products' => 'sometimes|required|array|min:1',
            'products.*.serial_no' => 'required|string',
            'products.*.size' => 'required|string',
            'products.*.pieces' => 'required|integer|min:1',
        ];
    }
}
