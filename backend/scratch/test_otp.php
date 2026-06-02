<?php
// Scratch file for testing secure OTP generation, hashing, rate limiting, and lockouts

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\EmailOtp;
use App\Http\Controllers\OtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

echo "--- 🔒 Secure OTP System Tests 🔒 ---\n\n";

$user = User::first();
if (!$user) {
    echo "❌ No users found in database!\n";
    exit;
}

// Clean previous entries
EmailOtp::where('email', $user->email)->delete();
echo "🧹 Cleared previous OTP records for test...\n\n";

// --- TEST 1: Generation & Hashing ---
echo "--- TEST 1: Generation & Hashing ---\n";
$request = new Request();
$request->replace(['email' => $user->email]);

$controller = new OtpController();
$response = $controller->sendOtp($request);

echo "Send Response 1: " . $response->getContent() . " (HTTP " . $response->getStatusCode() . ")\n";

$otpRecord = EmailOtp::where('email', $user->email)->latest()->first();
if ($otpRecord) {
    echo "✅ OTP record created successfully!\n";
    echo "   Email in DB: " . $otpRecord->email . "\n";
    echo "   Hashed OTP in DB: " . $otpRecord->otp . "\n";
    
    // Crucial check: OTP must NOT be plaintext!
    if (is_numeric($otpRecord->otp)) {
        echo "❌ SECURITY FAILURE: OTP is stored in plain text!\n";
    } else {
        echo "✅ SECURITY SUCCESS: OTP is stored securely hashed!\n";
    }
} else {
    echo "❌ Fail: No OTP record created in database!\n";
}
echo "\n";


// --- TEST 2: Send Rate Limiting (Max 3 sends / 10 mins) ---
echo "--- TEST 2: Send Rate Limiting (Max 3 sends / 10 mins) ---\n";
// Record 1 was sent. Send record 2 and 3:
$response2 = $controller->sendOtp($request);
echo "Send Response 2: " . $response2->getContent() . " (HTTP " . $response2->getStatusCode() . ")\n";

$response3 = $controller->sendOtp($request);
echo "Send Response 3: " . $response3->getContent() . " (HTTP " . $response3->getStatusCode() . ")\n";

// Send record 4 - this MUST fail with 429:
$response4 = $controller->sendOtp($request);
echo "Send Response 4 (Should fail with 429): " . $response4->getContent() . " (HTTP " . $response4->getStatusCode() . ")\n";

if ($response4->getStatusCode() === 429) {
    echo "✅ SECURITY SUCCESS: Send rate limiting successfully blocked the 4th request!\n";
} else {
    echo "❌ SECURITY FAILURE: Send rate limiting allowed more than 3 requests!\n";
}
echo "\n";


// --- TEST 3: Verification Lockout (Max 5 failed attempts) ---
echo "--- TEST 3: Verification Lockout (Max 5 failed attempts) ---\n";
// Let's clear records and generate a single clean OTP to test guesses
EmailOtp::where('email', $user->email)->delete();
$controller->sendOtp($request);
$otpRecord = EmailOtp::where('email', $user->email)->latest()->first();

// We will try to guess 5 times with a wrong OTP:
$wrongRequest = new Request();
$wrongRequest->replace([
    'email' => $user->email,
    'otp' => '000000' // wrong OTP
]);

for ($i = 1; $i <= 5; $i++) {
    $verifyResp = $controller->verifyOtp($wrongRequest);
    echo "Verify Attempt $i (Wrong Code): " . $verifyResp->getContent() . " (HTTP " . $verifyResp->getStatusCode() . ")\n";
}

// 6th attempt - should fail with lockout 429:
$verifyResp6 = $controller->verifyOtp($wrongRequest);
echo "Verify Attempt 6 (Lockout Expected): " . $verifyResp6->getContent() . " (HTTP " . $verifyResp6->getStatusCode() . ")\n";

if ($verifyResp6->getStatusCode() === 429) {
    echo "✅ SECURITY SUCCESS: 5 failed attempts locked out the verification!\n";
} else {
    echo "❌ SECURITY FAILURE: Verification allowed more than 5 guesses without lockout!\n";
}
echo "\n";

echo "🎉 All Security Tests Executed successfully! 🎉\n";
