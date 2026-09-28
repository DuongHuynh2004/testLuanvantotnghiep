<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Cho phép chủ tài khoản hoặc quản trị viên xem hồ sơ.
     */
    public function view(User $authUser, User $user): bool
    {
        return $authUser->id === $user->id || $authUser->isAdmin();
    }

    /**
     * Cho phép chủ tài khoản hoặc quản trị viên cập nhật hồ sơ.
     */
    public function update(User $authUser, User $user): bool
    {
        return $authUser->id === $user->id || $authUser->isAdmin();
    }
}
