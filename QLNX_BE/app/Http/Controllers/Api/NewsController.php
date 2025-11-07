<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class NewsController extends Controller
{
    /** GET /api/news
     *  Hỗ trợ: ?q=...&category=...&status=...&per_page=...&sort=-created_at,title
     */
    public function index(Request $request)
    {
        $q         = trim((string) $request->query('q', ''));
        $category  = $request->query('category');
        $status    = $request->query('status');
        $perPage   = (int) ($request->query('per_page', 10));
        $sort      = (string) $request->query('sort', '-created_at'); // - = desc

        $query = News::query();

        if ($q !== '') {
            $query->where(function ($x) use ($q) {
                $x->where('title', 'like', "%{$q}%")
                  ->orWhere('summary', 'like', "%{$q}%")
                  ->orWhere('content', 'like', "%{$q}%");
            });
        }

        if ($category) $query->where('category', $category);
        if ($status)   $query->where('status', $status);

        // sort: ví dụ "-created_at,title"
        foreach (explode(',', $sort) as $field) {
            $field = trim($field);
            if ($field === '') continue;
            $dir = Str::startsWith($field, '-') ? 'desc' : 'asc';
            $col = ltrim($field, '-');
            if (in_array($col, ['id','title','created_at','updated_at','category','status'])) {
                $query->orderBy($col, $dir);
            }
        }

        return response()->json($query->paginate($perPage));
    }

    /** POST /api/news */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'     => ['required','string','max:255'],
            'slug'      => ['nullable','string','max:255','unique:news,slug'],
            'summary'   => ['nullable','string'],
            'content'   => ['nullable','string'],
            'image'     => ['nullable','string','max:255'],
            'category'  => ['nullable','string','max:100'],
            'status'    => ['nullable', Rule::in(['draft','published'])],
        ]);

        // Auto slug nếu không gửi
        $data['slug'] = $this->ensureUniqueSlug($data['slug'] ?? Str::slug($data['title']));
        $data['status'] = $data['status'] ?? 'published';
        $data['created_by'] = $request->user()->id ?? null;

        $news = News::create($data);
        return response()->json($news, 201);
    }

    /** GET /api/news/{id|slug} */
    public function show($id)
    {
        $news = is_numeric($id)
            ? News::findOrFail($id)
            : News::where('slug', $id)->firstOrFail();

        return response()->json($news);
    }

    /** PUT/PATCH /api/news/{id} */
    public function update(Request $request, $id)
    {
        $news = News::findOrFail($id);

        $data = $request->validate([
            'title'     => ['sometimes','string','max:255'],
            'slug'      => ['nullable','string','max:255', Rule::unique('news','slug')->ignore($news->id)],
            'summary'   => ['nullable','string'],
            'content'   => ['nullable','string'],
            'image'     => ['nullable','string','max:255'],
            'category'  => ['nullable','string','max:100'],
            'status'    => ['nullable', Rule::in(['draft','published'])],
        ]);

        if (array_key_exists('title', $data) && empty($data['slug'])) {
            // nếu đổi title và không truyền slug mới → cập nhật slug theo title (giữ unique)
            $data['slug'] = $this->ensureUniqueSlug(Str::slug($data['title']), $news->id);
        } elseif (array_key_exists('slug', $data) && $data['slug']) {
            $data['slug'] = $this->ensureUniqueSlug($data['slug'], $news->id);
        }

        $news->update($data);
        return response()->json($news);
    }

    /** DELETE /api/news/{id} */
    public function destroy($id)
    {
        $news = News::findOrFail($id);
        $news->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /** Tạo slug duy nhất, thêm -2, -3... khi trùng */
    private function ensureUniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base);
        $orig = $slug;
        $i = 2;

        while (
            News::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$orig}-{$i}";
            $i++;
        }

        return $slug ?: Str::random(8);
    }
}
