<?php
namespace App\Services\Rag;

class Chunker {
  public function split(string $t, int $size = 800, int $overlap = 120): array {
    $t = trim(preg_replace('/\s+/', ' ', $t));
    $out = [];
    $start = 0;
    $len = mb_strlen($t);

    while ($start < $len) {
      $end = min($start + $size, $len);
      $out[] = mb_substr($t, $start, $end - $start);
      if ($end === $len) break;
      $start = max(0, $end - $overlap);
    }
    return $out;
  }
}
