<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case TenantOwner = 'tenant_owner';
}
