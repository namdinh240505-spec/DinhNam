<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use GuzzleHttp\Client;
use App\Models\Conversation;
use App\Models\Message;

class ChatController extends Controller
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'base_uri'    => rtrim(env('RAG_BASE_URL', ''), '/').'/',
            'timeout'     => (float) env('RAG_TIMEOUT', 20),
            'http_errors' => false,
        ]);
    }

    /** Proxy sang RAG/LLM – KHÔNG fallback FAQ */
    public function ragOnly(Request $request)
    {
        $message = trim((string) $request->input('question', $request->input('message', '')));
        $convId  = $request->string('conversation_id')->toString() ?: null;

        if ($message === '') {
            return response()->json(['answer' => 'Bạn hãy nhập câu hỏi nhé.'], 200);
        }
        if (!env('RAG_BASE_URL')) {
            return response()->json(['answer' => 'AI service chưa cấu hình (RAG_BASE_URL).'], 503);
        }

        try {
            $resp = $this->http->post('query', [
                'json' => [
                    'question'        => $message,
                    'conversation_id' => $convId,
                ],
                // Nếu RAG yêu cầu key riêng thì mở dòng dưới
                // 'headers' => ['X-RAG-Key' => env('RAG_SERVICE_KEY')]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['answer' => 'AI đang bận.'], 503);
        }

        $code = $resp->getStatusCode();
        $json = json_decode((string) $resp->getBody(), true) ?: [];

        if ($code < 200 || $code >= 300 || empty($json['answer'])) {
            return response()->json(['answer' => 'AI đang bận.'], 503);
        }

        // Lưu hội thoại (có thể bỏ nếu không cần)
        $savedConvId = Arr::get($json, 'conversation_id');
        if (!$savedConvId) {
            $conv = Conversation::create([
                'user_id' => auth()->id(),
                'title'   => 'Chat (AI only)',
            ]);
            $savedConvId = $conv->id;
        }
        Message::create(['conversation_id'=>$savedConvId,'role'=>'user','content'=>$message]);
        Message::create(['conversation_id'=>$savedConvId,'role'=>'bot','content'=>Arr::get($json,'answer','')]);

        return response()->json([
            'conversation_id' => $savedConvId,
            'answer'          => Arr::get($json, 'answer', ''),
            'sources'         => Arr::get($json, 'sources', []),
        ], 200);
    }
}
