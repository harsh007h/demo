<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\EmailOtp;
use App\Mail\OtpMail;

class OtpController extends Controller
{
    /**
     * Generate and send OTP to the user's registered email with rate limiting.
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required',
        ]);

        $loginInput = $request->input('email');
        
        // Auto-detect if input is email or mobile number
        $isEmail = filter_var($loginInput, FILTER_VALIDATE_EMAIL);
        $fieldType = $isEmail ? 'email' : 'mobile';

        // Find the user in the database
        $user = User::where($fieldType, $loginInput)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'The provided account is not registered.'
            ], 404);
        }

        if ($user->status !== 'Active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated.'
            ], 403);
        }

        // 1. Rate Limit Check: Max 3 requests per 10 minutes
        $recentRequestsCount = EmailOtp::where('email', $user->email)
                                       ->where('created_at', '>=', now()->subMinutes(10))
                                       ->count();

        if ($recentRequestsCount >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'Too many OTP requests. Maximum 3 requests per 10 minutes. Please wait.'
            ], 429);
        }

        // 2. Secure OTP generation (using cryptographically secure random_int)
        $otp = sprintf('%06d', random_int(100000, 999999));
        $expiresAt = now()->addMinutes(5);

        // 3. Hash OTP before saving in database for security
        EmailOtp::create([
            'email' => $user->email,
            'otp' => Hash::make($otp),
            'attempts' => 0,
            'expires_at' => $expiresAt,
            'verified_at' => null,
        ]);

        // 4. Send OTP using SMTP Mail
        try {
            Mail::to($user->email)->send(new OtpMail($otp));
        } catch (\Exception $e) {
            Log::error('SMTP OTP dispatch failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please check your SMTP mail server settings in .env.'
            ], 500);
        }

        // 5. Never expose OTP in response or toasts
        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully'
        ]);
    }

    /**
     * Verify the OTP and log the user in, enforcing security rules.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required',
            'otp' => 'required|string|size:6',
        ]);

        $loginInput = $request->input('email');
        $otp = $request->input('otp');

        // Auto-detect if input is email or mobile number
        $isEmail = filter_var($loginInput, FILTER_VALIDATE_EMAIL);
        $fieldType = $isEmail ? 'email' : 'mobile';

        // Find the user
        $user = User::where($fieldType, $loginInput)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'Your account has been deactivated.'
            ], 403);
        }

        // Retrieve latest unverified OTP record
        $otpRecord = EmailOtp::where('email', $user->email)
                             ->whereNull('verified_at')
                             ->latest()
                             ->first();

        if (!$otpRecord) {
            return response()->json([
                'message' => 'Invalid OTP'
            ], 400);
        }

        // 1. Lockout Check: Max 5 attempts
        if ($otpRecord->attempts >= 5) {
            return response()->json([
                'message' => 'Maximum verification attempts exceeded. Please request a new OTP.'
            ], 429);
        }

        // Increment verification attempts immediately
        $otpRecord->increment('attempts');

        // 2. Expiry Check (must not exceed 5 minutes)
        if (now()->greaterThan($otpRecord->expires_at)) {
            return response()->json([
                'message' => 'OTP Expired'
            ], 400);
        }

        // 3. Hash verification
        if (!Hash::check($otp, $otpRecord->otp)) {
            // Check if this was the 5th attempt (which just got incremented)
            if ($otpRecord->fresh()->attempts >= 5) {
                return response()->json([
                    'message' => 'Invalid OTP. Maximum verification attempts exceeded. Please request a new OTP.'
                ], 429);
            }
            return response()->json([
                'message' => 'Invalid OTP'
            ], 400);
        }

        // 4. Mark OTP as verified (used)
        $otpRecord->update([
            'verified_at' => now(),
        ]);

        // 5. Generate token and log user in
        $token = Str::random(60);
        $user->forceFill([
            'api_token' => $token,
        ])->save();

        return response()->json([
            'token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'message' => 'Login successful'
        ]);
    }
}
