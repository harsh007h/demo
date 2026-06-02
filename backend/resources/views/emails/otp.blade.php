<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #cbd5e1;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }
        .container {
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 1px;
            margin-bottom: 24px;
            background: linear-gradient(to right, #6366f1, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }
        h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
        }
        p {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #cbd5e1;
        }
        .otp-box {
            background: rgba(99, 102, 241, 0.1);
            border: 2px dashed #6366f1;
            border-radius: 12px;
            padding: 16px 24px;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 8px;
            display: inline-block;
            margin-bottom: 30px;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
        .warning {
            font-size: 12px;
            color: #ef4444;
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Demo</div>
        <h1>Welcome Back</h1>
        <p>You requested a secure verification code to access your account. Please use the following one-time password (OTP) to complete your sign-in process.</p>
        <div class="otp-box">{{ $otp }}</div>
        <p style="font-size: 14px; margin-bottom: 0;">This OTP code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} Demo. All rights reserved.
        </div>
    </div>
</body>
</html>
