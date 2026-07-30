<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Activity;
use App\Services\TenantManager;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create a Tenant
        $tenant = Tenant::create([
            'name' => 'Délégation Régionale',
            'slug' => 'delegation-regionale',
            'logo_url' => 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=150&auto=format&fit=crop&q=80',
        ]);

        // 2. Set the Tenant context in TenantManager
        app(TenantManager::class)->setTenantId($tenant->id);

        // 3. Create Users
        User::create([
            'name' => 'Jean Agent',
            'email' => 'agent@reportflow.io',
            'password' => Hash::make('Agent_Secure#2026!'),
            'role' => 'DELEGATE',
        ]);

        User::create([
            'name' => 'Marie Manager',
            'email' => 'manager@reportflow.io',
            'password' => Hash::make('Manager_Secure#2026!'),
            'role' => 'MANAGER',
        ]);

        User::create([
            'name' => 'Pierre Admin',
            'email' => 'admin@reportflow.io',
            'password' => Hash::make('Admin_Secure#2026!'),
            'role' => 'ADMIN_TENANT',
        ]);

        User::create([
            'name' => 'System SuperAdmin',
            'email' => 'superadmin@reportflow.io',
            'password' => Hash::make('SuperAdmin_Secure#2026!'),
            'role' => 'SUPERADMIN',
        ]);

        // 4. Create some default activities to make the dashboard look nice on start
        $activities = [
            [
                'title' => 'Entretien routier - RN7',
                'category' => 'Infrastructure',
                'content' => 'Inspection des travaux de goudronnage sur le tronçon Sud. Avancement à 85%. Signature du procès-verbal intermédiaire.',
                'activity_date' => now()->subDays(2)->format('Y-m-d'),
            ],
            [
                'title' => 'Réunion avec la commission locale',
                'category' => 'Réunion',
                'content' => 'Discussion sur le budget participatif 2026. Présentation des priorités éducatives et validation de la subvention pour la rénovation des écoles primaires.',
                'activity_date' => now()->subDays(1)->format('Y-m-d'),
            ],
            [
                'title' => 'Contrôle sanitaire - Cantine centrale',
                'category' => 'Inspection',
                'content' => 'Audit d’hygiène inopiné. Respect des normes de conservation de la chaîne du froid. Recommandation mineure sur l’étiquetage des produits laitiers.',
                'activity_date' => now()->format('Y-m-d'),
            ],
        ];

        // We need to retrieve a user to associate with the activities
        $agent = User::where('role', 'DELEGATE')->first();

        foreach ($activities as $act) {
            Activity::create(array_merge($act, [
                'user_id' => $agent->id,
            ]));
        }
    }
}
