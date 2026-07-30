<?php

namespace App\Services;

class TenantManager
{
    protected ?string $tenantId = null;

    /**
     * Set the current tenant ID.
     */
    public function setTenantId(?string $tenantId): void
    {
        $this->tenantId = $tenantId;
    }

    /**
     * Get the current tenant ID.
     */
    public function getTenantId(): ?string
    {
        return $this->tenantId;
    }
}
