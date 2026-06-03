<?php
$url = 'http://127.0.0.1:8000/api/login';
echo "Benchmarking $url...\n";

for ($i = 1; $i <= 5; $i++) {
    $start = microtime(true);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'email' => 'test@example.com',
        'password' => 'password'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $err = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    
    $end = microtime(true);
    $duration = $end - $start;
    
    if ($err) {
        echo "Request $i: Error: $err (took " . round($duration, 4) . "s)\n";
    } else {
        echo "Request $i: HTTP Code: {$info['http_code']}, Size: " . strlen($response) . " bytes, Time: " . round($duration, 4) . "s\n";
    }
}
