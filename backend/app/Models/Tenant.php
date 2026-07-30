<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tenant extends Model
{
    protected $fillable = ['name', 'slug', 'logo_url'];

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Boot function to generate UUID.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
