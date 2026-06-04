<?php

class DuplicateFileRemover
{
    private string $targetDirectory;
    private array $excludeDirectories;
    private array $fileHashes = [];
    private array $duplicates = [];

    /**
     * @param string $targetDirectory The root directory to scan
     * @param array $excludeDirectories List of folder names to exclude
     */
    public function __construct(string $targetDirectory, array $excludeDirectories = [])
    {
        $this->targetDirectory = $targetDirectory;
        $this->excludeDirectories = $excludeDirectories;
    }

    /**
     * Scans the directory and finds duplicate files based on MD5 hashes.
     */
    public function findDuplicates(): void
    {
        $directory = new RecursiveDirectoryIterator($this->targetDirectory, RecursiveDirectoryIterator::SKIP_DOTS);

        $filter = new RecursiveCallbackFilterIterator($directory, function ($current, $key, $iterator) {
            // Skip excluded directories entirely
            if ($current->isDir() && in_array($current->getFilename(), $this->excludeDirectories, true)) {
                return false;
            }
            return true;
        });

        $iterator = new RecursiveIteratorIterator($filter);

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $path = $file->getRealPath();
                
                // Read hash of the file to compare content
                $hash = md5_file($path);

                if (isset($this->fileHashes[$hash])) {
                    $this->duplicates[] = [
                        'original' => $this->fileHashes[$hash],
                        'duplicate' => $path
                    ];
                } else {
                    $this->fileHashes[$hash] = $path;
                }
            }
        }
    }

    /**
     * Returns the array of found duplicates.
     */
    public function getDuplicates(): array
    {
        return $this->duplicates;
    }

    /**
     * Removes all found duplicate files.
     */
    public function removeDuplicates(): void
    {
        foreach ($this->duplicates as $duplicateInfo) {
            $duplicatePath = $duplicateInfo['duplicate'];
            if (file_exists($duplicatePath)) {
                echo "Removing duplicate: {$duplicatePath} (Original: {$duplicateInfo['original']})\n";
                unlink($duplicatePath);
            }
        }
        
        if (count($this->duplicates) > 0) {
            echo "Removed " . count($this->duplicates) . " duplicate files.\n";
        }
    }
}

// -----------------------------------------------------------------------------
// Execution
// -----------------------------------------------------------------------------

// Path to project root (adjust if needed, currently assumes backend/scratch/)
// We'll scan the whole software directory, but you can change it to __DIR__ to just scan scratch/
$projectRoot = realpath(__DIR__ . '/../../'); 

// Standard directories to avoid scanning (for performance and safety)
$excludeDirs = ['vendor', 'node_modules', '.git', 'storage', 'bootstrap'];

$remover = new DuplicateFileRemover($projectRoot, $excludeDirs);

echo "Scanning for duplicate files in {$projectRoot}...\n";
echo "Excluding directories: " . implode(', ', $excludeDirs) . "\n\n";

$remover->findDuplicates();
$duplicates = $remover->getDuplicates();

if (empty($duplicates)) {
    echo "No duplicate files found.\n";
} else {
    echo "Found " . count($duplicates) . " duplicate files.\n\n";
    
    // Display what is going to be removed
    foreach ($duplicates as $dup) {
        echo "- Scheduled for removal: {$dup['duplicate']}\n  (Matches Original: {$dup['original']})\n\n";
    }
    
    // Removing the duplicates as requested
    $remover->removeDuplicates();
}
