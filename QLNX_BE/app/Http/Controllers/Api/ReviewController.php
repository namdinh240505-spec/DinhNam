<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    // GET /api/reviews?mine=1 | ?trip_id=...
    public function index(Request $request)
    {
        $q = Review::query()->with(['trip']);

        if ($request->boolean('mine') && $request->user()) {
            $q->where('user_id', $request->user()->id);
        }
        if ($request->filled('trip_id')) {
            $q->where('trip_id', $request->trip_id);
        }

        $list = $q->latest()->get();
        // TripReviews.jsx chấp nhận cả array lẫn {data:[]}, ta trả array cho gọn
        return response()->json($list);
    }

    // POST /api/reviews
    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'trip_id' => ['required', Rule::exists('trips','id')],
            'rating'  => ['required','integer','between:1,5'],
            'comment' => ['nullable','string'],
        ]);

        // tạo hoặc cập nhật nếu đã có review cho (user, trip)
        $review = Review::updateOrCreate(
            ['user_id' => $user->id, 'trip_id' => $data['trip_id']],
            ['rating' => $data['rating'], 'comment' => $data['comment'] ?? null]
        )->load('trip');

        return response()->json($review, 201);
    }

    // PUT /api/reviews/{review}
    public function update(Request $request, Review $review)
    {
        if ($request->user()->id !== $review->user_id) {
            return response()->json(['message' => 'Bạn không có quyền sửa nhận xét này'], 403);
        }
        $data = $request->validate([
            'rating'  => ['sometimes','required','integer','between:1,5'],
            'comment' => ['nullable','string'],
        ]);

        $review->fill($data)->save();
        return response()->json($review->fresh('trip'));
    }

    // DELETE /api/reviews/{review}
    public function destroy(Request $request, Review $review)
    {
        if ($request->user()->id !== $review->user_id) {
            return response()->json(['message' => 'Bạn không có quyền xóa nhận xét này'], 403);
        }
        $review->delete();
        return response()->json(['ok' => true]);
    }
}
