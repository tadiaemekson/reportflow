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
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('generated_by')->nullable();
            $table->string('title');
            $table->date('period_start');
            $table->date('period_end');
            $table->text('compiled_content');
            $table->string('pdf_path')->nullable();
            $table->string('file_hash', 64)->nullable(); // SHA-256
            $table->string('status', 50)->default('DRAFT'); // DRAFT, SUBMITTED, APPROVED, ARCHIVED
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('generated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
