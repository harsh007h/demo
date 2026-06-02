<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transport;

class TransportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Transport::query();
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('transport_name', 'LIKE', "%{$search}%");
        }
        
        $perPage = $request->input('per_page', 10);
        return response()->json($query->orderBy('id', 'desc')->paginate($perPage));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'transport_name' => 'required|string|max:255|unique:transports,transport_name',
        ]);

        $transport = Transport::create($validated);
        return response()->json($transport, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $transport = Transport::findOrFail($id);
        return response()->json($transport);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $transport = Transport::findOrFail($id);

        $validated = $request->validate([
            'transport_name' => 'required|string|max:255|unique:transports,transport_name,' . $id,
        ]);

        $transport->update($validated);
        return response()->json($transport);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $transport = Transport::findOrFail($id);
        $transport->delete();
        return response()->json(null, 204);
    }
}
