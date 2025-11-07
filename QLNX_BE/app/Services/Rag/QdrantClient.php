<?php
namespace App\Services\Rag;
use Illuminate\Support\Facades\Http;

class QdrantClient {
  public function __construct(private string $base = '', private string $collection = '') {
    $this->base = env('QDRANT_URL');
    $this->collection = env('QDRANT_COLLECTION', 'hnb_docs');
  }

  public function ensureCollection(int $dim = 1536): void {
    if (Http::get("{$this->base}/collections/{$this->collection}")->ok()) return;
    Http::put("{$this->base}/collections/{$this->collection}", [
      'vectors' => ['size' => $dim, 'distance' => 'Cosine']
    ])->throw();
  }

  public function upsert(array $points): void {
    Http::post("{$this->base}/collections/{$this->collection}/points", ['points' => $points])->throw();
  }

  public function search(array $vector, int $limit = 5): array {
    $r = Http::post("{$this->base}/collections/{$this->collection}/points/search", [
      'vector' => $vector,
      'limit' => $limit,
      'with_payload' => true
    ])->throw()->json();
    return $r['result'] ?? [];
  }
}
