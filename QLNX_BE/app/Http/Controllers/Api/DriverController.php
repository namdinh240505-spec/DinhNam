<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    // Lấy danh sách tất cả tài xế
    public function index()
    {
        return response()->json(Driver::all(), 200);
    }

    // Thêm tài xế mới
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:drivers',
            'license_number' => 'required|string|max:50|unique:drivers',
            'address' => 'nullable|string|max:255',
            'avatar' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $driver = Driver::create($validated);
        return response()->json([
            'message' => 'Thêm tài xế thành công!',
            'data' => $driver,
        ], 201);
    }

    // Lấy chi tiết 1 tài xế
    public function show($id)
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['message' => 'Không tìm thấy tài xế'], 404);
        }
        return response()->json($driver, 200);
    }

    // Cập nhật thông tin tài xế
    public function update(Request $request, $id)
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['message' => 'Không tìm thấy tài xế'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20|unique:drivers,phone,' . $id,
            'license_number' => 'sometimes|string|max:50|unique:drivers,license_number,' . $id,
            'address' => 'nullable|string|max:255',
            'avatar' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $driver->update($validated);
        return response()->json([
            'message' => 'Cập nhật tài xế thành công!',
            'data' => $driver,
        ], 200);
    }

    // Xóa tài xế
    public function destroy($id)
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['message' => 'Không tìm thấy tài xế'], 404);
        }

        $driver->delete();
        return response()->json(['message' => 'Đã xóa tài xế'], 200);
    }
}
