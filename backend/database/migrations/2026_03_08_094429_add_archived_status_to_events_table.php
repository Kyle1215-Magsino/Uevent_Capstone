<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE events MODIFY COLUMN status ENUM('draft','upcoming','ongoing','completed','cancelled','archived') DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE events SET status = 'cancelled' WHERE status = 'archived'");
        DB::statement("ALTER TABLE events MODIFY COLUMN status ENUM('draft','upcoming','ongoing','completed','cancelled') DEFAULT 'draft'");
    }
};
