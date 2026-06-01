<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Party;

class PartyController extends Controller
{
    public function index(Request $request)
    {
        $query = Party::query();
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('mobile', 'LIKE', "%{$search}%");
        }
        
        $perPage = $request->input('per_page', 10);
        return response()->json($query->orderBy('id', 'desc')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20|unique:parties,mobile',
            'state' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'pincode' => 'required|string|max:10',
            'address' => 'required|string',
        ]);

        $party = Party::create($validated);
        return response()->json($party, 201);
    }

    public function show(string $id)
    {
        $party = Party::findOrFail($id);
        return response()->json($party);
    }

    public function update(Request $request, string $id)
    {
        $party = Party::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'mobile' => 'sometimes|required|string|max:20|unique:parties,mobile,' . $id,
            'state' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:255',
            'pincode' => 'sometimes|required|string|max:10',
            'address' => 'sometimes|required|string',
        ]);

        $party->update($validated);
        return response()->json($party);
    }

    public function destroy(string $id)
    {
        $party = Party::findOrFail($id);
        $party->delete();
        return response()->json(null, 204);
    }
}
