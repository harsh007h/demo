<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->index('name');
            $table->index('mobile');
        });
        
        Schema::table('stocks', function (Blueprint $table) {
            $table->index('product_name');
            $table->index('product_size');
        });
        
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('user_id');
        });

        Schema::table('transports', function (Blueprint $table) {
            $table->index('transport_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['mobile']);
        });
        
        Schema::table('stocks', function (Blueprint $table) {
            $table->dropIndex(['product_name']);
            $table->dropIndex(['product_size']);
        });
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('transports', function (Blueprint $table) {
            $table->dropIndex(['transport_name']);
        });
    }
};
