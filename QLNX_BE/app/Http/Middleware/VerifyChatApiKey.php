<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyChatApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $key = config('app.chat_api_key');
        $provided = $request->header('X-Chat-Api-Key') 
                    ?: $request->input('api_key');

        if (! filled($key) || ! hash_equals($key, (string)$provided)) {
            return response()->json(['error' => 'Unauthorized API key'], 401);
        }

        return $next($request);
    }
}
