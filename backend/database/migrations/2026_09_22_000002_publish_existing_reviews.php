<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Công khai các đánh giá cũ vì hệ thống không còn quy trình duyệt. */
    public function up(): void
    {
        DB::table('reviews')->where('status', '!=', 'approved')->update(['status' => 'approved']);
    }

    /** Việc công khai đánh giá không thể tự suy ra trạng thái cũ khi quay lui. */
    public function down(): void {}
};
