<?php

namespace App\Models;

use App\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use TenantScoped;

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'content',
        'attachments',
        'activity_date',
    ];

    protected $casts = [
        'activity_date' => 'date',
        'attachments' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
