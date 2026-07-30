<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Display a listing of activities.
     */
    public function index(Request $request)
    {
        $query = Activity::with('user:id,name');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('activity_date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $activities = $query->orderBy('activity_date', 'desc')
                            ->orderBy('created_at', 'desc')
                            ->get();

        return response()->json($activities);
    }

    /**
     * Store a newly created activity in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:50',
            'content' => 'required|string',
            'activity_date' => 'required|date',
        ]);

        $activity = Activity::create(array_merge($validated, [
            'user_id' => $request->user()->id,
        ]));

        return response()->json($activity, 201);
    }
}
