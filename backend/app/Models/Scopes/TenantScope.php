<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use App\Services\TenantManager;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $tenantId = app(TenantManager::class)->getTenantId();
        if ($tenantId) {
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        }
    }
}
