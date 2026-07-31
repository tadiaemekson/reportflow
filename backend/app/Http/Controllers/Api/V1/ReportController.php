<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{

    /**
     * List all reports.
     */
    public function index(Request $request)
    {
        $query = Report::with('generatedBy:id,name');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $user = $request->user();
        if ($user->role !== 'ADMIN_TENANT' && $user->role !== 'MANAGER') {
            $query->where('generated_by', $user->id);
        }

        $reports = $query->orderBy('created_at', 'desc')->get();

        return response()->json($reports);
    }

    /**
     * Show report details.
     */
    public function show($id)
    {
        $report = Report::with('generatedBy:id,name')->findOrFail($id);
        return response()->json($report);
    }

    /**
     * Generate report draft based on activities date range using mock LLM synthesis.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'period_start' => 'required|date',
            'period_end' => 'required|date',
        ]);

        $user = $request->user();
        $query = Activity::whereBetween('activity_date', [$request->period_start, $request->period_end]);

        if ($user->role !== 'ADMIN_TENANT' && $user->role !== 'MANAGER') {
            $query->where('user_id', $user->id);
        }

        $activities = $query->orderBy('activity_date', 'asc')->get();

        if ($activities->isEmpty()) {
            return response()->json([
                'error' => 'Aucune activité trouvée pour cette période.'
            ], 422);
        }

        // Mock LLM Synthesis with Administrative Styling
        $compiledContent = $this->synthesizeWithLLM($request->title, $request->period_start, $request->period_end, $activities);

        $report = Report::create([
            'generated_by' => $request->user()->id,
            'title' => $request->title,
            'period_start' => $request->period_start,
            'period_end' => $request->period_end,
            'compiled_content' => $compiledContent,
            'status' => 'DRAFT',
        ]);

        return response()->json($report, 201);
    }

    /**
     * Update report compiled content (allowed only for non-archived reports).
     */
    public function update(Request $request, $id)
    {
        $report = Report::findOrFail($id);

        if ($report->status === 'ARCHIVED') {
            return response()->json(['error' => 'Les rapports archivés sont immuables et ne peuvent être modifiés.'], 403);
        }

        $validated = $request->validate([
            'compiled_content' => 'required|string',
        ]);

        $report->update($validated);

        return response()->json($report);
    }

    /**
     * Submit report draft.
     */
    public function submit($id)
    {
        $report = Report::findOrFail($id);

        if ($report->status !== 'DRAFT') {
            return response()->json(['error' => 'Seuls les brouillons peuvent être soumis.'], 422);
        }

        $report->update(['status' => 'SUBMITTED']);

        return response()->json($report);
    }

    /**
     * Approve report (Managers/Admins only).
     */
    public function approve(Request $request, $id)
    {
        $report = Report::findOrFail($id);

        if ($report->status !== 'SUBMITTED') {
            return response()->json(['error' => 'Seuls les rapports soumis peuvent être approuvés.'], 422);
        }

        // Check role
        if (!$request->user()->hasRole(['MANAGER', 'ADMIN_TENANT'])) {
            return response()->json(['error' => 'Action non autorisée. Rôle Manager requis.'], 403);
        }

        $report->update(['status' => 'APPROVED']);

        return response()->json($report);
    }

    /**
     * Seal/archive report (calculates SHA-256, generates mock PDF, locks document).
     */
    public function archive($id)
    {
        $report = Report::findOrFail($id);

        if ($report->status !== 'APPROVED') {
            return response()->json(['error' => 'Seuls les rapports approuvés peuvent être archivés.'], 422);
        }

        // Calculate cryptographic hash (SHA-256) of content
        $hash = hash('sha256', $report->compiled_content);
        $pdfPath = "/storage/reports/report_" . Str::slug($report->title) . "_" . time() . ".pdf";

        $report->update([
            'status' => 'ARCHIVED',
            'file_hash' => $hash,
            'pdf_path' => $pdfPath,
        ]);

        return response()->json($report);
    }

    /**
     * Administrative synthesis generation engine simulation.
     */
    private function synthesizeWithLLM($title, $start, $end, $activities)
    {
        $grouped = $activities->groupBy('category');

        $md = "# RAPPORT ADMINISTRATIF D'ACTIVITÉ\n";
        $md .= "## OBJET : " . strtoupper($title) . "\n";
        $md .= "**Période du :** " . date('d/m/Y', strtotime($start)) . " **au** " . date('d/m/Y', strtotime($end)) . "\n";
        $md .= "**Date de génération :** " . date('d/m/Y à H:i') . "\n\n";
        $md .= "Bonjour,\n\nConformément aux directives administratives, veuillez trouver ci-dessous la synthèse structurée des activités enregistrées au cours de la période mentionnée :\n\n";

        foreach ($grouped as $category => $items) {
            $md .= "### SECTION " . strtoupper($category) . "\n";
            foreach ($items as $item) {
                $md .= "- **" . date('d/m/Y', strtotime($item->activity_date)) . " - " . $item->title . "**\n";
                $md .= "  " . $item->content . "\n\n";
            }
        }

        $md .= "---\n";
        $md .= "### RECOMMANDATIONS & PERSPECTIVES\n";
        $md .= "Les activités présentées démontrent une continuité de service conforme aux objectifs fixés. Il convient de consolider les données et de planifier les prochaines échéances de contrôle sanitaire et logistique.\n\n";
        $md .= "Document généré de manière sécurisée par l'Assistant IA ReportFlow.";

        return $md;
    }
}
