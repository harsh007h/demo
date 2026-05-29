<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Party;

class PartyController extends Controller
{
    public function index()
    {
        return response()->json(Party::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
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
            'mobile' => 'sometimes|required|string|max:20',
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
