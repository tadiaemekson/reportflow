import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Shield, Users, Activity, FileText, Trash2, Edit, AlertTriangle, Loader2, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStats, setExpandedStats] = useState<string[]>([]);
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);

  // Register Tenant States
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantLogoUrl, setNewTenantLogoUrl] = useState('');
  const [newTenantAdminName, setNewTenantAdminName] = useState('');
  const [newTenantAdminEmail, setNewTenantAdminEmail] = useState('');
  const [newTenantAdminPassword, setNewTenantAdminPassword] = useState('TempPassword#2026!');
  const [isRegisteringTenant, setIsRegisteringTenant] = useState(false);
  const [registerTenantError, setRegisterTenantError] = useState('');
  const [registerTenantSuccess, setRegisterTenantSuccess] = useState<any | null>(null);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/admin/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug || !newTenantAdminName || !newTenantAdminEmail || !newTenantAdminPassword) {
      setRegisterTenantError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsRegisteringTenant(true);
    setRegisterTenantError('');
    setRegisterTenantSuccess(null);

    try {
      const response = await api.post('/admin/tenants', {
        name: newTenantName,
        slug: newTenantSlug,
        logo_url: newTenantLogoUrl,
        admin_name: newTenantAdminName,
        admin_email: newTenantAdminEmail,
        admin_password: newTenantAdminPassword,
      });

      setRegisterTenantSuccess(response.data);
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantLogoUrl('');
      setNewTenantAdminName('');
      setNewTenantAdminEmail('');
      setNewTenantAdminPassword('TempPassword#2026!');
      
      // Refresh list
      fetchTenants();
    } catch (error: any) {
      console.error(error);
      setRegisterTenantError(error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue lors de l'enregistrement de l'organisation.");
    } finally {
      setIsRegisteringTenant(false);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer l'organisation "${name}" ? Cette action est irréversible et supprimera toutes ses données.`)) {
      try {
        await api.delete(`/admin/tenants/${id}`);
        fetchTenants();
      } catch (error: any) {
        alert(error.response?.data?.error || "Erreur lors de la suppression.");
      }
    }
  };

  const toggleStats = (id: string) => {
    setExpandedStats(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* Add New Tenant */}
      {isRegisterFormOpen && (
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 mb-6">
            <Edit className="h-5.5 w-5.5 text-blue-400" />
            Enregistrer une nouvelle Organisation
          </h2>
          <form onSubmit={handleRegisterTenant} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nom de l'Organisation</label>
                  <input type="text" value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-xs" placeholder="ex: Délégation Régionale Nord" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Slug du sous-domaine</label>
                  <input type="text" value={newTenantSlug} onChange={(e) => setNewTenantSlug(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-xs" placeholder="ex: delegation-nord" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">URL du Logo (Optionnel)</label>
                <input type="text" value={newTenantLogoUrl} onChange={(e) => setNewTenantLogoUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-xs" placeholder="ex: https://images.unsplash.com/photo..." />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-1.5 border-b border-slate-900">Identifiants de l'Administrateur</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nom Complet</label>
                  <input type="text" value={newTenantAdminName} onChange={(e) => setNewTenantAdminName(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-xs" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Adresse Email</label>
                  <input type="email" value={newTenantAdminEmail} onChange={(e) => setNewTenantAdminEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-xs" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mot de passe initial</label>
                <input type="text" value={newTenantAdminPassword} onChange={(e) => setNewTenantAdminPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl glass-input text-xs" required />
              </div>
            </div>

            {registerTenantError && (
              <div className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{registerTenantError}</span>
              </div>
            )}

            {registerTenantSuccess && (
              <div className="text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-xl flex items-center gap-2 font-bold">
                <Check className="h-4.5 w-4.5" />
                <span>{registerTenantSuccess.message}</span>
              </div>
            )}

            <button type="submit" disabled={isRegisteringTenant} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-xs transition-all flex items-center justify-center gap-2">
              {isRegisteringTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer et Créer"}
            </button>
          </form>
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Shield className="h-5.5 w-5.5 text-blue-400" />
              Tableau de bord Global
            </h2>
            <p className="text-xs text-slate-400 mt-1">Supervisez l'utilisation de la plateforme pour toutes les organisations.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/50 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800">
              {tenants.length} Organisation(s)
            </div>
            <button
              onClick={() => setIsRegisterFormOpen(!isRegisterFormOpen)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isRegisterFormOpen ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isRegisterFormOpen ? 'Fermer le formulaire' : 'Nouvelle Organisation'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tenants.map(tenant => (
              <div key={tenant.id} className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    {tenant.logo_url ? (
                      <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 font-bold">
                        {tenant.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{tenant.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStats(tenant.id)} 
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-800 transition-colors py-2 rounded-xl text-xs font-semibold text-slate-300 border border-slate-800/50"
                    >
                      {expandedStats.includes(tenant.id) ? (
                        <>Masquer les statistiques <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Voir les statistiques <ChevronDown className="h-4 w-4" /></>
                      )}
                    </button>
                    <button onClick={() => handleDeleteTenant(tenant.id, tenant.name)} className="text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {expandedStats.includes(tenant.id) && (
                  <div className="grid grid-cols-3 gap-2 mt-2 z-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-950/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-800/30">
                      <Users className="h-4 w-4 text-emerald-400 mb-1" />
                      <span className="text-lg font-bold text-slate-200">{tenant.users_count}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Utilisateurs</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-800/30">
                      <Activity className="h-4 w-4 text-blue-400 mb-1" />
                      <span className="text-lg font-bold text-slate-200">{tenant.activities_count}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Activités</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-800/30">
                      <FileText className="h-4 w-4 text-purple-400 mb-1" />
                      <span className="text-lg font-bold text-slate-200">{tenant.reports_count}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Rapports</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
