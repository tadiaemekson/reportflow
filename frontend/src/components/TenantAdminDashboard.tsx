import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Users, Trash2, AlertTriangle, Loader2, Check, UserPlus } from 'lucide-react';

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
  const [registerUserSuccess, setRegisterUserSuccess] = useState<any | null>(null);

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
    setRegisterUserSuccess(null);

    try {
      const response = await api.post('/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setRegisterUserSuccess(response.data);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('Personnel#2026!');
      setNewUserRole('DELEGATE');
      
      // Refresh list
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      setRegisterUserError(error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue lors de l'enregistrement de l'utilisateur.");
    } finally {
      setIsRegisteringUser(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer l'utilisateur "${name}" ? Cette action supprimera également ses activités et rapports.`)) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.error || "Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Dashboard */}
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Users className="h-5.5 w-5.5 text-emerald-400" />
              Gestion de l'Équipe
            </h2>
            <p className="text-xs text-slate-400 mt-1">Gérez le personnel autorisé à utiliser l'application pour votre organisation.</p>
          </div>
          <div className="bg-slate-900/50 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800">
            {users.length} Utilisateur(s)
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{user.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="z-10 mt-2">
                   <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                      user.role === 'ADMIN_TENANT' 
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40' 
                        : user.role === 'MANAGER'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
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
              <div className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{registerUserError}</span>
              </div>
            )}

            {registerUserSuccess && (
              <div className="text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Check className="h-4.5 w-4.5" />
                  <span>{registerUserSuccess.message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegisteringUser}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRegisteringUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {isRegisteringUser ? 'Création en cours...' : 'Créer l\'utilisateur'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
