<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use App\Services\TenantManager;
use Illuminate\Support\Str;

trait TenantScoped
{
    /**
     * Boot the tenant scoped trait.
     */
    protected static function bootTenantScoped(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            // Automatically set UUID primary key if not set
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }

            // Automatically set tenant_id if not set
            if (empty($model->tenant_id)) {
                $model->tenant_id = app(TenantManager::class)->getTenantId();
            }
        });
    }

    /**
     * Get the tenant relationship.
     */
    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }

    /**
     * Disable auto-incrementing for UUID primary key.
     */
    public function getIncrementing()
    {
        return false;
    }

    /**
     * Set primary key type to string.
     */
    public function getKeyType()
    {
        return 'string';
    }
}
