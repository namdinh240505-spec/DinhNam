<?php
namespace App\Services\Rag;
use Illuminate\Support\Facades\Http;

class Embedder {
  private string $model = 'text-embedding-3-small'; // 1536 dims
  public function embed(string $text): array {
    $r = Http::withToken(env('OPENAI_API_KEY'))->acceptJson()
      ->post('https://api.openai.com/v1/embeddings', [
        'model' => $this->model,
        'input' => $text
      ])->throw()->json();
    return $r['data'][0]['embedding'] ?? [];
  }
}
