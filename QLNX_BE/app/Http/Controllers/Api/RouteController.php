<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachRoute;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RouteController extends Controller
{
    /**
     * GET /api/routes
     * Trả về MẢNG các tuyến (không paginate) để FE .map() dùng trực tiếp.
     */
    public function index()
    {
        return CoachRoute::select('id', 'from', 'to')
            ->orderBy('from')
            ->orderBy('to')
            ->get();
    }

    /**
     * GET /api/routes/{id}
     */
    public function show($id)
    {
        $route = CoachRoute::find($id);
        if (!$route) {
            return response()->json(['message' => 'Không tìm thấy tuyến'], 404);
        }
        return $route->only(['id','from','to','distance']);
    }

    /**
     * POST /api/routes
     */
    public function store(Request $request)
    {
        // chuẩn hóa nhẹ cho rule unique 2 cột
        $from = trim((string) $request->input('from'));
        $to   = trim((string) $request->input('to'));

        $request->merge(['from' => $from, 'to' => $to]);

        $validated = $request->validate([
            'from' => [
                'required','string','max:100',
                function ($attr, $value, $fail) use ($from, $to) {
                    if ($from !== '' && $to !== '' && mb_strtolower($from) === mb_strtolower($to)) {
                        $fail('Điểm đi và Điểm đến không được trùng nhau.');
                    }
                },
                Rule::unique('coach_routes')->where(function ($q) use ($from, $to) {
                    return $q->whereRaw('LOWER("from") = ?', [mb_strtolower($from)])
                             ->whereRaw('LOWER("to") = ?', [mb_strtolower($to)]);
                }),
            ],
            'to'   => ['required','string','max:100'],
        ], [
            'from.required' => 'Vui lòng nhập Điểm đi',
            'to.required'   => 'Vui lòng nhập Điểm đến',
            'from.unique'   => 'Tuyến này đã tồn tại.',
        ]);

        $route = CoachRoute::create([
            'from' => $from,
            'to'   => $to,
        ]);

        return response()->json([
            'message' => 'Thêm tuyến xe thành công',
            'data'    => $route->only(['id','from','to']),
        ], 201);
    }

    /**
     * PUT /api/routes/{id}
     */
    public function update(Request $request, $id)
    {
        $route = CoachRoute::find($id);
        if (!$route) {
            return response()->json(['message' => 'Không tìm thấy tuyến'], 404);
        }

        $from = trim((string) $request->input('from', $route->from));
        $to   = trim((string) $request->input('to', $route->to));

        $request->merge(['from' => $from, 'to' => $to]);

        $request->validate([
            'from' => [
                'required','string','max:100',
                function ($attr, $value, $fail) use ($from, $to) {
                    if ($from !== '' && $to !== '' && mb_strtolower($from) === mb_strtolower($to)) {
                        $fail('Điểm đi và Điểm đến không được trùng nhau.');
                    }
                },
                Rule::unique('coach_routes')->where(function ($q) use ($from, $to, $id) {
                    return $q->whereRaw('LOWER("from") = ?', [mb_strtolower($from)])
                             ->whereRaw('LOWER("to") = ?', [mb_strtolower($to)])
                             ->where('id', '!=', $id);
                }),
            ],
            'to'   => ['required','string','max:100'],
        ], [
            'from.required' => 'Vui lòng nhập Điểm đi',
            'to.required'   => 'Vui lòng nhập Điểm đến',
            'from.unique'   => 'Tuyến này đã tồn tại.',
        ]);

        $route->update([
            'from' => $from,
            'to'   => $to,
        ]);

        return response()->json([
            'message' => 'Cập nhật tuyến xe thành công',
            'data'    => $route->only(['id','from','to']),
        ]);
    }

    /**
     * DELETE /api/routes/{id}
     */
    public function destroy($id)
    {
        $route = CoachRoute::find($id);
        if (!$route) {
            return response()->json(['message' => 'Không tìm thấy tuyến'], 404);
        }
        $route->delete();

        return response()->json(['message' => 'Đã xóa tuyến xe thành công']);
    }
}
