import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Shield, Users, Activity, FileText, Trash2, Edit, AlertTriangle, Loader2, Check, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStats, setExpandedStats] = useState<string[]>([]);
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);

  // Register Tenant States
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantLogo, setNewTenantLogo] = useState<File | null>(null);
  const [newTenantAdminName, setNewTenantAdminName] = useState('');
  const [newTenantAdminEmail, setNewTenantAdminEmail] = useState('');
  const [newTenantAdminPassword, setNewTenantAdminPassword] = useState('TempPassword#2026!');
  const [isRegisteringTenant, setIsRegisteringTenant] = useState(false);
  const [registerTenantError, setRegisterTenantError] = useState('');

  // Modals & Edit States
  const [successModal, setSuccessModal] = useState<{title: string, message: string} | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Tenant States
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [editTenantName, setEditTenantName] = useState('');
  const [editTenantSlug, setEditTenantSlug] = useState('');
  const [editTenantLogo, setEditTenantLogo] = useState<File | null>(null);
  const [isUpdatingTenant, setIsUpdatingTenant] = useState(false);

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

    try {
      const formData = new FormData();
      formData.append('name', newTenantName);
      formData.append('slug', newTenantSlug);
      formData.append('admin_name', newTenantAdminName);
      formData.append('admin_email', newTenantAdminEmail);
      formData.append('admin_password', newTenantAdminPassword);
      if (newTenantLogo) {
        formData.append('logo', newTenantLogo);
      }

      const response = await api.post('/admin/tenants', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessModal({
        title: "Organisation créée avec succès",
        message: response.data.message || `L'organisation ${newTenantName} a été enregistrée.`
      });
      
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantLogo(null);
      setNewTenantAdminName('');
      setNewTenantAdminEmail('');
      setNewTenantAdminPassword('TempPassword#2026!');
      setIsRegisterFormOpen(false); // Hide the form on success
      
      // Refresh list
      fetchTenants();
    } catch (error: any) {
      console.error(error);
      setRegisterTenantError(error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue lors de l'enregistrement de l'organisation.");
    } finally {
      setIsRegisteringTenant(false);
    }
  };

  const handleDeleteTenantClick = (id: string, name: string) => {
    setTenantToDelete({ id, name });
    setDeleteConfirmationText('');
  };

  const handleConfirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/tenants/${tenantToDelete.id}`);
      fetchTenants();
      setSuccessModal({
        title: "Organisation supprimée",
        message: `L'organisation "${tenantToDelete.name}" a été définitivement effacée.`
      });
      setTenantToDelete(null);
      setDeleteConfirmationText('');
    } catch (error: any) {
      alert(error.response?.data?.error || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (tenant: any) => {
    setEditingTenant(tenant);
    setEditTenantName(tenant.name);
    setEditTenantSlug(tenant.slug);
    setEditTenantLogo(null);
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant || !editTenantName || !editTenantSlug) return;
    setIsUpdatingTenant(true);

    try {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel method spoofing for multipart/form-data
      formData.append('name', editTenantName);
      formData.append('slug', editTenantSlug);
      if (editTenantLogo) {
        formData.append('logo', editTenantLogo);
      }

      await api.post(`/admin/tenants/${editingTenant.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessModal({
        title: "Organisation mise à jour",
        message: `Les informations de ${editTenantName} ont été enregistrées.`
      });
      
      setEditingTenant(null);
      fetchTenants();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsUpdatingTenant(false);
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Logo de l'Organisation (Optionnel)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewTenantLogo(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                </div>
                {newTenantLogo && (
                  <p className="text-[10px] text-emerald-400 mt-1.5 font-mono truncate">Fichier: {newTenantLogo.name}</p>
                )}
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

            <button type="submit" disabled={isRegisteringTenant} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-xs transition-all flex items-center justify-center gap-2">
              {isRegisteringTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer et Créer"}
            </button>
          </form>
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Shield className="h-5.5 w-5.5 text-blue-400" />
              Tableau de bord Global
            </h2>
            <p className="text-xs text-slate-400 mt-1">Supervisez l'utilisation de la plateforme pour toutes les organisations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
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
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 z-10">
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
                  <div className="flex gap-2 w-full sm:w-auto">
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
                    <button onClick={() => openEditModal(tenant)} className="text-slate-500 hover:text-blue-400 hover:bg-blue-950/40 transition-colors p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteTenantClick(tenant.id, tenant.name)} className="text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
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

      {/* Custom Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-400">
                <AlertTriangle className="h-8 w-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-2">Suppression Critique</h3>
              
              <p className="text-sm text-slate-400 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement <span className="text-slate-200 font-bold">"{tenantToDelete.name}"</span> ?
              </p>
              
              <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-left w-full mb-6">
                <p className="text-red-400/90 text-xs leading-relaxed font-medium">
                  Cette action est <span className="font-bold underline">strictement irréversible</span>. Tous les utilisateurs, activités, et rapports certifiés liés à cette organisation seront immédiatement et définitivement effacés de la base de données.
                </p>
              </div>

              <div className="w-full text-left mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Veuillez saisir <span className="text-slate-200 font-mono select-none">{tenantToDelete.name}</span> pour confirmer :
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Saisissez le nom ici..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm text-slate-200 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                  autoComplete="off"
                />
              </div>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setTenantToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDeleteTenant}
                  disabled={isDeleting || deleteConfirmationText !== tenantToDelete.name}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oui, Supprimer'}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setTenantToDelete(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Global Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20 text-emerald-400">
                <Check className="h-8 w-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-2">{successModal.title}</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                {successModal.message}
              </p>
              
              <button
                onClick={() => setSuccessModal(null)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-all border border-slate-700"
              >
                Super, merci !
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-400" />
                Modifier l'Organisation
              </h2>
              
              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nom de l'Organisation</label>
                  <input
                    type="text"
                    value={editTenantName}
                    onChange={(e) => setEditTenantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Slug du sous-domaine</label>
                  <input
                    type="text"
                    value={editTenantSlug}
                    onChange={(e) => setEditTenantSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nouveau Logo (Optionnel)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditTenantLogo(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {editTenantLogo && (
                    <p className="text-[10px] text-emerald-400 mt-1.5 font-mono truncate">Fichier: {editTenantLogo.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingTenant(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingTenant}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-sm text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {isUpdatingTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
