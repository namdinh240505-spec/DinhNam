<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RagController extends Controller
{
    /* ================= Config ================= */
    private int $historyTTLMin   = 120;                 // phút lưu hội thoại
    private int $historyMaxTurns = 12;                  // số lượt (user/assistant) giữ lại
    private string $envApiUrlKey = 'GROQ_API_URL';
    private string $envApiKeyKey = 'GROQ_API_KEY';
    private string $envModelKey  = 'CHAT_MODEL_DEFAULT';

    /* ================= Public API ================= */
    public function chat(Request $request)
    {
        try {
            $msg = trim((string) $request->input('message', ''));
            if ($msg === '') {
                return response()->json(['reply' => '', 'conversation_id' => null, 'meta' => ['empty' => true]]);
            }

            // Quản lý hội thoại
            $convId   = (string) ($request->input('conversation_id') ?: Str::uuid());
            $reset    = filter_var($request->input('reset', false), FILTER_VALIDATE_BOOL);
            $cacheKey = "chat:conv:{$convId}";
            if ($reset) Cache::forget($cacheKey);

            $history = Cache::get($cacheKey, []);
            if (!is_array($history)) $history = [];

            // Push user message
            $history[] = ['role' => 'user', 'content' => $msg];

            // Gọi AI
            $reply = $this->askAI($history);

            if (trim($reply) === '') {
                // Fallback mềm khi AI lỗi
                $reply = "Xin lỗi, mình chưa thể trả lời ngay. Bạn hỏi lại ngắn gọn hơn giúp mình nhé!";
            }

            // Lưu assistant + cắt lịch sử
            $history[] = ['role' => 'assistant', 'content' => $reply];
            $history = $this->trimHistory($history);
            Cache::put($cacheKey, $history, now()->addMinutes($this->historyTTLMin));

            return response()->json([
                'reply' => $reply,
                'conversation_id' => $convId,                   // GIỮ convId cũ để tiếp tục hội thoại
                'meta' => ['mode' => 'ai'],
            ]);

        } catch (\Throwable $e) {
            Log::error('RagController.chat error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'reply' => 'Có lỗi hệ thống, vui lòng thử lại sau.',
                'conversation_id' => $request->input('conversation_id', null),
                'meta' => ['error' => true],
            ], 500);
        }
    }

    /* ================= Core: GROQ ================= */
    private function askAI(array $history): string
    {
        $apiBase = rtrim(env($this->envApiUrlKey, 'https://api.groq.com/openai/v1'), '/');
        $apiKey  = trim((string) env($this->envApiKeyKey, ''));
        $model   = trim((string) env($this->envModelKey, 'llama-3.1-8b-instant'));
        $timeout = (int) env('RAG_TIMEOUT', 30);
        $temp    = (float) env('CHAT_TEMPERATURE', 0.4);
        $maxTok  = (int) env('CHAT_MAX_TOKENS', 500);

        if ($apiKey === '') {
            Log::warning('GROQ_API_KEY is not set');
            return '';
        }

        $system = implode("\n", [
            'Bạn là HuyNam Assistant — trợ lý AI của hệ thống đặt vé HuyNamBusLines.',
            'Trả lời bằng TIẾNG VIỆT, tự nhiên, lịch sự, giọng người thật.',
            'Nếu câu hỏi cần dữ liệu động (lịch/giá/ghế theo ngày), hãy hướng người dùng dùng mục "Tìm chuyến xe".',
            'Tránh lặp lại nguyên văn câu hỏi; trả lời ngắn gọn nhưng đủ ý.',
        ]);

        // Cắt lịch sử an toàn
        $trimmed = $this->trimHistory($history);

        $messages = [['role' => 'system', 'content' => $system]];
        foreach ($trimmed as $m) {
            $role = ($m['role'] === 'assistant') ? 'assistant' : 'user';
            $messages[] = ['role' => $role, 'content' => (string) ($m['content'] ?? '')];
        }

        $payload = [
            'model'       => $model,
            'temperature' => $temp,
            'max_tokens'  => $maxTok,
            'messages'    => $messages,
        ];

        try {
            $resp = Http::timeout($timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type'  => 'application/json',
                ])
                ->post($apiBase.'/chat/completions', $payload);

            // Retry nhẹ khi 429 (rate-limit upstream)
            if ($resp->status() === 429) {
                usleep(200_000); // 200ms
                $resp = Http::timeout($timeout)
                    ->withHeaders([
                        'Authorization' => 'Bearer '.$apiKey,
                        'Content-Type'  => 'application/json',
                    ])
                    ->post($apiBase.'/chat/completions', $payload);
            }

            if (!$resp->ok()) {
                $status = $resp->status();
                // Ghi log ngắn gọn, không lộ key
                Log::warning('Groq non-200', ['status' => $status, 'body' => mb_substr($resp->body(), 0, 1000)]);

                // Thông điệp người dùng thân thiện theo nhóm lỗi
                if (in_array($status, [401, 403], true)) return 'Khoá AI không hợp lệ hoặc bị hạn chế. Vui lòng cấu hình lại.';
                if ($status === 404) return 'Model không tồn tại hoặc tạm thời không khả dụng.';
                if ($status === 429) return 'Hệ thống AI đang quá tải. Bạn đợi một chút rồi hỏi lại giúp mình nhé!';
                return '';
            }

            $data = $resp->json();
            return trim((string) ($data['choices'][0]['message']['content'] ?? ''));

        } catch (\Throwable $e) {
            Log::error('Groq call failed: '.$e->getMessage());
            return '';
        }
    }

    /* ================= Utils ================= */
    private function trimHistory(array $h): array
    {
        // chỉ giữ tối đa N lượt (user/assistant)
        $h = array_filter($h, fn($m) => isset($m['role'], $m['content']));
        $h = array_values($h);
        $maxMsgs = max(2, $this->historyMaxTurns * 2);
        if (count($h) > $maxMsgs) $h = array_slice($h, -$maxMsgs);

        // chuẩn hoá vai trò + nội dung
        return array_map(function ($m) {
            $role = in_array($m['role'], ['assistant','user'], true) ? $m['role'] : 'user';
            $content = trim((string) $m['content']);
            return ['role' => $role, 'content' => $content];
        }, $h);
    }

    /* ===== Endpoint test nhanh (tùy chọn bật ở routes) ===== */
    public function testChat()
    {
        $apiBase = rtrim(env($this->envApiUrlKey, 'https://api.groq.com/openai/v1'), '/');
        $apiKey  = trim((string) env($this->envApiKeyKey, ''));
        $model   = trim((string) env($this->envModelKey, 'llama-3.1-8b-instant'));

        if ($apiKey === '') {
            return response()->json(['ok' => false, 'err' => 'Missing GROQ_API_KEY'], 500);
        }

        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'Trả lời tiếng Việt, ngắn gọn.'],
                ['role' => 'user', 'content' => 'Xin chào, bạn đang hoạt động chứ?']
            ],
            'max_tokens' => 60,
            'temperature' => 0.4,
        ];

        try {
            $resp = Http::timeout((int) env('RAG_TIMEOUT', 30))
                ->withHeaders([
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type'  => 'application/json',
                ])
                ->post($apiBase.'/chat/completions', $payload);

            return response()->json([
                'ok'     => $resp->ok(),
                'status' => $resp->status(),
                'json'   => $resp->json(),
                'raw'    => mb_substr($resp->body(), 0, 1200),
            ], $resp->ok() ? 200 : 500);

        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'err' => $e->getMessage()], 500);
        }
    }
}
