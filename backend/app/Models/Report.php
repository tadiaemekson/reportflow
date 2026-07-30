<?php

namespace App\Models;

use App\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use TenantScoped;

    protected $fillable = [
        'generated_by',
        'title',
        'period_start',
        'period_end',
        'compiled_content',
        'pdf_path',
        'file_hash',
        'status', // DRAFT, SUBMITTED, APPROVED, ARCHIVED
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    /**
     * Boot function to enforce immutable archiving.
     */
    protected static function boot()
    {
        parent::boot();

        static::updating(function ($report) {
            if ($report->getOriginal('status') === 'ARCHIVED') {
                abort(403, 'Les rapports archivés sont immuables et ne peuvent pas être modifiés.');
            }
        });

        static::deleting(function ($report) {
            if ($report->getOriginal('status') === 'ARCHIVED') {
                abort(403, 'Les rapports archivés sont immuables et ne peuvent pas être supprimés.');
            }
        });
    }

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
