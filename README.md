# Simple Login Authentication Website

This project is a lightweight, beginner-friendly Login Authentication system featuring a Laravel backend API and a vanilla HTML/CSS/JS frontend. It explicitly avoids complex packages like Sanctum or Breeze in favor of a straightforward token-based authentication mechanism.

## Features

- **Backend**: Laravel 11.x API
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Design**: Modern, premium aesthetic with glassmorphism and animated backgrounds.
- **Authentication**: Simple custom API token (`api_token` column).

## Folder Structure

```
├── backend/                  # Laravel API project
│   ├── app/Http/Controllers/ # Contains AuthController.php
│   ├── database/migrations/  # User table migration with api_token
│   ├── database/seeders/     # DatabaseSeeder to create dummy user
│   ├── routes/               # api.php for routes
│   └── ...                   # Standard Laravel directories
├── frontend/                 # Vanilla JS Frontend
│   ├── login.html            # Login page UI
│   ├── dashboard.html        # Protected dashboard UI
│   └── assets/
│       ├── css/style.css     # Premium styling
│       └── js/               # auth.js and dashboard.js
└── README.md                 # Project documentation
```

## Setup Guide

### 1. Database Setup
Ensure you have MySQL installed and running. Create a database for the project (e.g., `laravel_auth_db`).

### 2. Backend Setup (Laravel API)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update your `.env` file with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=laravel_auth_db
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```
4. Install PHP dependencies:
   ```bash
   composer install
   ```
5. Generate application key:
   ```bash
   php artisan key:generate
   ```
6. Run migrations to create the tables (including `api_token` column):
   ```bash
   php artisan migrate
   ```
7. Seed the database to create the default user:
   ```bash
   php artisan db:seed
   ```
   **Default Test User:**
   - Email: `test@example.com`
   - Password: `password`

8. Start the Laravel development server:
   ```bash
   php artisan serve
   ```
   The backend will run on `http://127.0.0.1:8000`.

### 3. Frontend Setup

1. The frontend does not require a build step (No Node.js needed).
2. Simply open `frontend/login.html` in your web browser. Or, you can serve it using a lightweight HTTP server, like Python's built-in server or Live Server extension in VS Code.

## Deployment on Shared Hosting

1. Zip the entire `backend` directory (excluding `/vendor` and `.env` initially, if preferred). Upload it to a folder outside your `public_html`.
2. Extract the backend folder.
3. Zip the contents of your `frontend` directory and extract them into your `public_html` (or a subfolder where you want the site to be accessible).
4. **Backend Setup on Host**:
   - Create a MySQL database and user from your hosting control panel.
   - Configure `.env` in the backend folder with the production database credentials.
   - Run `composer install`, `php artisan key:generate`, and `php artisan migrate --seed` via SSH or configure your database manually.
   - Update `API_URL` in `frontend/assets/js/auth.js` and `frontend/assets/js/dashboard.js` to point to your live domain's API (e.g., `https://api.yourdomain.com/api` or `https://yourdomain.com/backend/public/api`).

## How It Works

- **Login**: When the user submits the form on `login.html`, `auth.js` sends a POST request to `/api/login`. The Laravel controller verifies the credentials, generates an `api_token`, saves it to the database, and returns it.
- **Session**: The frontend stores the returned token in `localStorage`.
- **Dashboard**: Upon loading `dashboard.html`, `dashboard.js` retrieves the token and fetches user data from the protected `/api/user` endpoint.
- **Logout**: Clicking the sign out button sends a POST request to `/api/logout`, which clears the token in the database. The frontend then removes it from `localStorage`.
