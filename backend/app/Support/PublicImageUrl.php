<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicImageUrl
{
    /** Trả URL ảnh công khai; trả null khi chưa có ảnh và giữ nguyên URL CDN. */
    public static function resolve(?string $path, Request $request): ?string
    {
        if (! $path) {
            return null;
        }

        $url = Storage::disk('public')->url($path);

        return Str::startsWith($url, ['http://', 'https://'])
            ? $url
            : $request->getSchemeAndHttpHost().$url;
    }
}
