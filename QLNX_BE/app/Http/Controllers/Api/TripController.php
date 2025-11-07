<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TripController extends Controller
{
    // GET /api/trips
    public function index(Request $req)
    {
        $q = Trip::with('route')->orderBy('date')->orderBy('time');
        if ($req->filled('route')) $q->where('route_id', $req->route);
        if ($req->filled('date'))  $q->whereDate('date', $req->date);

        return response()->json($q->get());
    }

    // GET /api/trips/{id}
    public function show($id)
    {
        $id = (int) $id;
        $trip = Trip::with('route')->find($id);
        if (!$trip) return response()->json(['message' => 'Trip not found'], 404);

        // (nếu bạn còn dùng booked_seats từ Booking thì giữ logic cũ của bạn ở đây)

        return response()->json($trip);
    }

    // POST /api/trips
    public function store(Request $req)
    {
        $data = $req->validate([
            'route_id' => ['required', 'integer', 'exists:coach_routes,id'],
            'date'     => ['required', 'date'],     // Y-m-d
            'time'     => ['required', 'string'],   // "07:30"
            'bus'      => ['required', 'string', 'max:255'],
            'seats'    => ['required', 'integer', 'min:1'],
            'price'    => ['required', 'integer', 'min:0'],
            'status'   => ['nullable', Rule::in(['Open', 'Full', 'Closed'])],
        ]);

        $data['status'] = $data['status'] ?? 'Open';
        $data['booked'] = 0;

        $trip = Trip::create($data);

        return response()->json($trip->load('route'), 201);
    }

    // PUT/PATCH /api/trips/{id}
    public function update(Request $req, $id)
    {
        $trip = Trip::find($id);
        if (!$trip) return response()->json(['message' => 'Trip not found'], 404);

        $data = $req->validate([
            'route_id' => ['sometimes','integer','exists:coach_routes,id'],
            'date'     => ['sometimes','date'],
            'time'     => ['sometimes','string'],
            'bus'      => ['sometimes','string','max:255'],
            'seats'    => ['sometimes','integer','min:1'],
            'price'    => ['sometimes','integer','min:0'],
            'status'   => ['sometimes', Rule::in(['Open', 'Full', 'Closed'])],
            'booked'   => ['sometimes','integer','min:0'],
        ]);

        $trip->update($data);

        return response()->json($trip->load('route'));
    }

    // DELETE /api/trips/{id}
    public function destroy($id)
    {
        $trip = Trip::find($id);
        if (!$trip) return response()->json(['message' => 'Trip not found'], 404);

        $trip->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
