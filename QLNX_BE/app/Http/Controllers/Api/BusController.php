<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BusController extends Controller
{
    // GET /api/buses  -> trả mảng cho FE .map()
    public function index(Request $request)
    {
        $data = Bus::orderBy('created_at','desc')
            ->get(['id','license_number','type','seats','manufacturer','model','year','note','active']);
        return response()->json($data);
    }

    // GET /api/buses/{id}
    public function show($id)
    {
        $bus = Bus::find($id);
        if (!$bus) return response()->json(['message' => 'Không tìm thấy xe'], 404);
        return response()->json($bus);
    }

    // POST /api/buses
    public function store(Request $request)
    {
        $validated = $request->validate([
            'license_number' => ['required','string','max:50','unique:buses,license_number'],
            'type'           => ['required','string','max:100'],
            'seats'          => ['required','integer','min:1','max:100'],
            'manufacturer'   => ['nullable','string','max:120'],
            'model'          => ['nullable','string','max:120'],
            'year'           => ['nullable','integer','min:1950','max:'.(date('Y')+1)],
            'note'           => ['nullable','string'],
            'active'         => ['nullable','boolean'],
        ], [
            'license_number.required' => 'Vui lòng nhập biển số',
            'license_number.unique'   => 'Biển số đã tồn tại',
            'type.required'           => 'Vui lòng nhập loại xe',
            'seats.required'          => 'Vui lòng nhập số ghế',
        ]);

        $bus = Bus::create([
            'license_number' => $validated['license_number'],
            'type'           => $validated['type'],
            'seats'          => $validated['seats'],
            'manufacturer'   => $validated['manufacturer'] ?? null,
            'model'          => $validated['model'] ?? null,
            'year'           => $validated['year'] ?? null,
            'note'           => $validated['note'] ?? null,
            'active'         => $validated['active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Thêm xe thành công',
            'data'    => $bus,
        ], 201);
    }

    // PUT /api/buses/{id}
    public function update(Request $request, $id)
    {
        $bus = Bus::find($id);
        if (!$bus) return response()->json(['message' => 'Không tìm thấy xe'], 404);

        $validated = $request->validate([
            'license_number' => [
                'sometimes','required','string','max:50',
                Rule::unique('buses','license_number')->ignore($bus->id),
            ],
            'type'           => ['sometimes','required','string','max:100'],
            'seats'          => ['sometimes','required','integer','min:1','max:100'],
            'manufacturer'   => ['nullable','string','max:120'],
            'model'          => ['nullable','string','max:120'],
            'year'           => ['nullable','integer','min:1950','max:'.(date('Y')+1)],
            'note'           => ['nullable','string'],
            'active'         => ['nullable','boolean'],
        ]);

        $bus->fill($validated);
        $bus->save();

        return response()->json([
            'message' => 'Cập nhật xe thành công',
            'data'    => $bus,
        ]);
    }

    // DELETE /api/buses/{id}
    public function destroy($id)
    {
        $bus = Bus::find($id);
        if (!$bus) return response()->json(['message' => 'Không tìm thấy xe'], 404);
        $bus->delete();

        return response()->json(['message' => 'Đã xóa xe']);
    }
}
