import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Users, Trash2, AlertTriangle, Loader2, Check, UserPlus, X } from 'lucide-react';

export default function TenantAdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Register User States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Personnel#2026!');
  const [newUserRole, setNewUserRole] = useState('DELEGATE');
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const [registerUserError, setRegisterUserError] = useState('');

  // Modals States
  const [successModal, setSuccessModal] = useState<{title: string, message: string} | null>(null);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) {
      setRegisterUserError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsRegisteringUser(true);
    setRegisterUserError('');

    try {
      const response = await api.post('/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });

      setSuccessModal({
        title: "Membre ajouté avec succès",
        message: response.data.message || `L'utilisateur ${newUserName} a été ajouté à votre équipe.`
      });
      
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('Personnel#2026!');
      setNewUserRole('DELEGATE');
      
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      setRegisterUserError(error.response?.data?.message || error.response?.data?.error || "Erreur lors de la création.");
    } finally {
      setIsRegisteringUser(false);
    }
  };

  const handleDeleteUserClick = (id: string, name: string) => {
    setUserToDelete({ id, name });
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      fetchUsers();
      setSuccessModal({
        title: "Accès révoqué",
        message: `L'accès pour "${userToDelete.name}" a été définitivement supprimé.`
      });
      setUserToDelete(null);
    } catch (error: any) {
      alert(error.response?.data?.error || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Dashboard */}
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Users className="h-5.5 w-5.5 text-blue-400" />
              Gestion de l'Équipe
            </h2>
            <p className="text-xs text-slate-400 mt-1">Gérez le personnel autorisé à utiliser l'application pour votre organisation.</p>
          </div>
          <div className="bg-slate-900/50 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800">
            {users.length} Utilisateur(s)
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{user.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => handleDeleteUserClick(user.id, user.name)} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950/40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="z-10 mt-2">
                   <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                      user.role === 'ADMIN_TENANT' 
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40' 
                        : user.role === 'MANAGER'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                    }`}>
                      {user.role}
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New User */}
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            Ajouter un Membre
          </h2>
          <p className="text-xs text-slate-400 mb-6">Créez un nouveau compte pour un agent ou un superviseur.</p>

          <form onSubmit={handleRegisterUser} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nom Complet</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="ex: Jean Dupont"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Adresse Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="ex: jean.dupont@organisation.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rôle</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs appearance-none"
                >
                  <option value="DELEGATE" className="bg-slate-900 text-slate-100">Délégué (Peut créer des activités)</option>
                  <option value="MANAGER" className="bg-slate-900 text-slate-100">Superviseur (Peut générer des rapports)</option>
                  <option value="ADMIN_TENANT" className="bg-slate-900 text-slate-100">Administrateur (Gestion d'équipe)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mot de passe initial</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>
            </div>

            {registerUserError && (
              <div className="mt-4 text-red-400 text-xs bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{registerUserError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegisteringUser}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isRegisteringUser ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Créer l'utilisateur
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-400">
                <AlertTriangle className="h-8 w-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-2">Supprimer l'utilisateur ?</h3>
              
              <p className="text-sm text-slate-400 mb-6">
                Êtes-vous sûr de vouloir supprimer l'accès de <span className="text-slate-200 font-bold">"{userToDelete.name}"</span> ? 
                <br /><br />
                <span className="text-emerald-400/90 text-xs">Ne vous inquiétez pas : tous les rapports générés par cet utilisateur seront conservés dans les archives de l'organisation pour garantir la traçabilité. Seules ses activités non compilées seront effacées.</span>
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oui, Supprimer'}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setUserToDelete(null)}
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
    </div>
  );
}
