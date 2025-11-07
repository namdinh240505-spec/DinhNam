<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Services\Rag\RagService;

class RagIngest extends Command
{
    protected $signature = 'rag:ingest {path=rag} {--prefix=}';
    protected $description = 'Ingest all .txt/.md files in storage/app/{path} into Qdrant';

    public function handle(RagService $rag): int
    {
        $dir = $this->argument('path');              // default: rag
        $prefix = (string)$this->option('prefix');   // optional doc_id prefix
        $disk = Storage::disk('local');

        if (!$disk->exists($dir)) {
            $this->error("Folder storage/app/{$dir} not found.");
            return 1;
        }

        $files = collect($disk->files($dir))
            ->filter(fn($f) => str_ends_with($f, '.txt') || str_ends_with($f, '.md'));

        if ($files->isEmpty()) {
            $this->warn("No .txt/.md files in storage/app/{$dir}");
            return 0;
        }

        foreach ($files as $f) {
            $content = $disk->get($f);
            $name = basename($f);
            $docId = ($prefix ? rtrim($prefix,'-').'-' : '') . pathinfo($name, PATHINFO_FILENAME);

            $count = $rag->ingest($docId, $name, $content, ['source'=>'file','path'=>$f]);
            $this->info("Ingested {$name} -> {$count} chunks");
        }
        return 0;
    }
}
