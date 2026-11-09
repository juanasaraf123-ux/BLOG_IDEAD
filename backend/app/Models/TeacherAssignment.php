<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherAssignment extends Model
{
    protected $table = 'teacher_assignments';

    protected $guarded = ['id'];

    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function program() { return $this->belongsTo(Program::class); }
}
