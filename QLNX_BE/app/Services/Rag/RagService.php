<?php
namespace App\Services\Rag;

class RagService {
  public function __construct(
    private QdrantClient $qdrant,
    private Embedder $embedder,
    private Chunker $chunker
  ) {
    $this->qdrant->ensureCollection();
  }

  public function ingest(string $docId, string $title, string $content, array $meta = []): int {
    $chunks = $this->chunker->split(
      $content,
      (int)env('CHUNK_SIZE', 800),
      (int)env('CHUNK_OVERLAP', 120)
    );

    $points = [];
    foreach ($chunks as $i => $chunk) {
      $points[] = [
        'id' => crc32($docId . '#' . $i),
        'vector' => $this->embedder->embed($chunk),
        'payload' => [
          'doc_id' => $docId,
          'title'  => $title,
          'text'   => $chunk,
          'index'  => $i
        ] + $meta,
      ];
    }
    $this->qdrant->upsert($points);
    return count($points);
  }

  public function retrieve(string $query, int $k = 5): array {
    return $this->qdrant->search($this->embedder->embed($query), $k);
  }
}
