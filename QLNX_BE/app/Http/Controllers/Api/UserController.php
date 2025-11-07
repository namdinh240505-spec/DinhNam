<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * GET /api/user
     * Trả về DANH SÁCH người dùng (mặc định: customer) dưới dạng MẢNG.
     * Có thể truyền ?role=admin|customer để lọc.
     */
    public function index(Request $request)
    {
        $role = $request->query('role', 'customer');

        $q = User::query();
        if ($role === 'admin') {
            $q->where('roles', 'admin');
        } else {
            $q->where('roles', 'customer');
        }

        // Trả MẢNG trực tiếp (không paginate) để FE .map() không lỗi
        $user = $q->orderByDesc('created_at')
            ->get(['id', 'name', 'email', 'phone', 'roles', 'status']);

        // Chuẩn hóa: thêm field "blocked" cho FE (blocked = !status)
        $out = $user->map(fn ($u) => $this->transform($u))->values();

        return response()->json($out, 200);
    }

    /**
     * GET /api/user/{id}
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($this->transform($user), 200);
    }

    /**
     * PUT /api/user/{id}
     * Nhận { blocked: bool } hoặc các field khác (name/email/phone/roles/status/password).
     * Nếu gửi "blocked", sẽ ánh xạ thành status = blocked ? 0 : 1.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $id, // bảng "user"
            'phone'    => 'sometimes|nullable|string|max:20',
            'roles'    => 'sometimes|in:admin,customer',
            'status'   => 'sometimes|boolean',
            'blocked'  => 'sometimes|boolean', // FE dùng field này
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        // Ưu tiên "blocked" nếu có
        if (array_key_exists('blocked', $validated)) {
            $user->status = $validated['blocked'] ? 0 : 1;
        }

        // Các field khác (nếu gửi lên)
        if (array_key_exists('status', $validated))  $user->status = $validated['status'];
        if (array_key_exists('name', $validated))    $user->name   = $validated['name'];
        if (array_key_exists('email', $validated))   $user->email  = $validated['email'];
        if (array_key_exists('phone', $validated))   $user->phone  = $validated['phone'];
        if (array_key_exists('roles', $validated))   $user->roles  = $validated['roles'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Cập nhật người dùng thành công',
            'data'    => $this->transform($user),
        ], 200);
    }

    /**
     * DELETE /api/user/{id}
     * (Tùy chọn) xóa mềm nếu model có SoftDeletes
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Đã xóa người dùng'], 200);
    }
    public function doRegister(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:user,email',
            'password' => 'required|string|min:6',
            'phone'    => 'nullable|string|max:20',
            'roles'    => 'sometimes|in:admin,customer',
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        $user->roles = $validated['roles'] ?? 'customer';
        $user->status = 1; // mặc định kích hoạt
        $user->password = Hash::make($validated['password']);
        $user->save();

        return response()->json([
            'message' => 'Đăng ký thành công',
            'data'    => $this->transform($user),
        ], 201);
    }

    /* ---------- Helper chuẩn hóa dữ liệu trả về ---------- */
    private function transform(User $u): array
    {
        return [
            'id'      => $u->id,
            'name'    => $u->name,
            'email'   => $u->email,
            'phone'   => $u->phone,
            'roles'   => $u->roles,
            'status'  => (bool) $u->status,        // true = active
            'blocked' => !$u->status,              // FE đọc trường này
            'created_at' => $u->created_at,
        ];
    }
}
