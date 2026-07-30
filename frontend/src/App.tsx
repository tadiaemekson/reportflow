

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import api from './lib/api';
import {
  Lock,
  PlusCircle,
  Calendar,
  LogOut,
  User as UserIcon,
  Building,
  Sparkles,
  Shield,
  Search,
  FileCheck,
  Loader2,
  Check,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import SuperAdminDashboard from './components/SuperAdminDashboard';

export default function App() {
  const { isAuthenticated, user, tenant, tenantSlug, login, logout, initialize } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'activities' | 'generate' | 'archives' | 'admin'>('activities');

  // Login Form States
  const [slugInput, setSlugInput] = useState('delegation-regionale');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('password');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App States
  const [activities, setActivities] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Log Activity States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Infrastructure');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [activitySuccess, setActivitySuccess] = useState(false);

  // Generate Report States
  const [reportPeriod, setReportPeriod] = useState('last_30_days'); // today, this_week, this_month, last_30_days, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [reportEditText, setReportEditText] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isApprovingReport, setIsApprovingReport] = useState(false);
  const [isArchivingReport, setIsArchivingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  // Search/Filter Archives
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize session
  useEffect(() => {
    initialize();
    if (user?.role === 'SUPERADMIN') {
      setActiveTab('admin');
    }
  }, [initialize, user?.role]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities();
      fetchReports();
    }
  }, [isAuthenticated, activeTab]);

  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (err) {
      console.error("Error fetching activities", err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (err) {
      console.error("Error fetching reports", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput || !emailInput || !passwordInput) {
      setLoginError("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      // Set tenant slug in localStorage temporarily for the login request header interceptor
      localStorage.setItem('rf_tenant_slug', slugInput);

      const response = await api.post('/auth/login', {
        email: emailInput,
        password: passwordInput,
      });

      const { access_token, user: userData, tenant: tenantData } = response.data;
      login(access_token, userData, tenantData, slugInput);
      if (userData.role === 'SUPERADMIN') {
        setActiveTab('admin');
      } else {
        setActiveTab('activities');
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        "Échec de l'authentification. Vérifiez l'organisation ou vos identifiants."
      );
      localStorage.removeItem('rf_tenant_slug');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setEmailInput(email);
    setSlugInput('delegation-regionale');
    if (email.includes('agent')) {
      setPasswordInput('Agent_Secure#2026!');
    } else if (email.includes('manager')) {
      setPasswordInput('Manager_Secure#2026!');
    } else if (email.includes('admin')) {
      setPasswordInput('Admin_Secure#2026!');
    } else if (email.includes('superadmin')) {
      setPasswordInput('SuperAdmin_Secure#2026!');
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent || !newDate) return;

    setIsSubmittingActivity(true);
    setActivitySuccess(false);

    try {
      await api.post('/activities', {
        title: newTitle,
        category: newCategory,
        content: newContent,
        activity_date: newDate,
      });

      setNewTitle('');
      setNewContent('');
      setActivitySuccess(true);
      fetchActivities();

      setTimeout(() => setActivitySuccess(false), 3000);
    } catch (err) {
      console.error("Error saving activity", err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleGenerateReport = async () => {
    let start = new Date();
    let end = new Date();

    if (reportPeriod === 'today') {
      // both start and end are today
    } else if (reportPeriod === 'this_week') {
      const day = start.getDay() || 7; // Get current day number, converting Sun. to 7
      start.setDate(start.getDate() - day + 1); // Set to Monday
    } else if (reportPeriod === 'this_month') {
      start.setDate(1); // Set to 1st of month
    } else if (reportPeriod === 'last_30_days') {
      start.setDate(end.getDate() - 30);
    } else if (reportPeriod === 'custom') {
      if (!customStartDate || !customEndDate) {
        setReportError("Veuillez sélectionner les dates de début et de fin.");
        return;
      }
      start = new Date(customStartDate);
      end = new Date(customEndDate);
    }
    
    const formattedEnd = end.toISOString().split('T')[0];
    const formattedStart = start.toISOString().split('T')[0];
    
    // Auto-generate a title
    const autoTitle = `Synthèse automatique du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;

    setIsGeneratingReport(true);
    setReportError('');
    setGeneratedReport(null);

    try {
      const response = await api.post('/reports/generate', {
        title: autoTitle,
        period_start: formattedStart,
        period_end: formattedEnd,
      });
      setGeneratedReport(response.data);
      setReportEditText(response.data.compiled_content);
    } catch (err: any) {
      console.error(err);
      setReportError(err.response?.data?.error || "Aucune activité trouvée pour cette période.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSaveReportEdit = async () => {
    if (!generatedReport) return;
    setIsSavingReport(true);
    setSaveSuccess(false);
    try {
      const response = await api.put(`/reports/${generatedReport.id}`, {
        compiled_content: reportEditText
      });
      setGeneratedReport(response.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving report", err);
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!generatedReport) return;
    setIsSubmittingReport(true);
    try {
      const response = await api.post(`/reports/${generatedReport.id}/submit`);
      setGeneratedReport(response.data);
      fetchReports();
    } catch (err) {
      console.error("Error submitting report", err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleApproveReport = async () => {
    if (!generatedReport) return;
    setIsApprovingReport(true);
    try {
      const response = await api.post(`/reports/${generatedReport.id}/approve`);
      setGeneratedReport(response.data);
      fetchReports();
    } catch (err) {
      console.error("Error approving report", err);
    } finally {
      setIsApprovingReport(false);
    }
  };

  const handleArchiveReport = async () => {
    if (!generatedReport) return;
    setIsArchivingReport(true);
    try {
      const response = await api.post(`/reports/${generatedReport.id}/archive`);
      setGeneratedReport(response.data);
      fetchReports();
    } catch (err) {
      console.error("Error archiving report", err);
    } finally {
      setIsArchivingReport(false);
    }
  };

  // Filter reports for Archives
  const archivedReports = reports
    .filter(r => r.status === 'ARCHIVED')
    .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.file_hash?.includes(searchQuery));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel-glow rounded-3xl p-8 transition-all">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.jpg" alt="ReportFlow Logo" className="h-28 w-28 rounded-2xl object-cover mb-4 shadow-lg shadow-blue-500/25 border border-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              REPORTFLOW
            </h1>
            <p className="text-xs text-slate-400 mt-1">Plateforme Intelligente de Rapports Administratifs</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Organisation (Slug)</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500"
                  placeholder="ex: delegation-regionale"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Adresse Email</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500"
                  placeholder="nom@reportflow.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-sm transition-all shadow-md shadow-blue-600/10 active:scale-98 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Quick login presets */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="block text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Accès de Démonstration (WAMP)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('agent@reportflow.io')}
                className="py-2 px-1 text-center rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300"
              >
                Agent / Délégué
              </button>
              <button
                onClick={() => handleQuickLogin('manager@reportflow.io')}
                className="py-2 px-1 text-center rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300"
              >
                Chef / Manager
              </button>
              <button
                onClick={() => handleQuickLogin('admin@reportflow.io')}
                className="py-2 px-1 text-center rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300"
              >
                Admin Tenant
              </button>
              <button
                onClick={() => handleQuickLogin('superadmin@reportflow.io')}
                className="py-2 px-1 text-center rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300"
              >
                System SuperAdmin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="ReportFlow" className="h-7 w-7 rounded-lg object-cover border border-slate-800" />
          <span className="font-extrabold text-xs tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">REPORTFLOW</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Overlay for mobile when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-950/95 backdrop-blur-xl border-r border-slate-900 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 overflow-y-auto">
          {/* Close button for mobile */}
          <button 
            className="md:hidden absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>

          {/* App Branding Row (Desktop Only) */}
          <div className="hidden md:flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-900">
            <img src="/logo.jpg" alt="ReportFlow Logo" className="h-7 w-7 rounded-lg object-cover border border-slate-800" />
            <span className="font-extrabold text-xs tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">REPORTFLOW</span>
          </div>
          {/* Tenant Profile Header */}
          <div className="flex items-center gap-3 mb-8">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-9 w-9 rounded-xl object-cover border border-slate-800" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-500/20">
                <Building className="h-5 w-5 text-blue-400" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-sm text-slate-100 truncate max-w-[140px]">{tenant?.name}</h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{tenantSlug}.reportflow.io</span>
            </div>
          </div>

          {/* User Profile info */}
          <div className="mb-6 py-3 px-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-600/30 flex items-center justify-center border border-cyan-500/20 text-cyan-400 font-bold text-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xs text-slate-200 truncate">{user?.name}</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/40 uppercase tracking-wider mt-0.5">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1.5">
            {user?.role !== 'SUPERADMIN' && (
              <>
                <button
                  onClick={() => { setActiveTab('activities'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'activities'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  Saisie Activités
                </button>

                <button
                  onClick={() => { setActiveTab('generate'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'generate'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Générateur IA
                </button>

                <button
                  onClick={() => { setActiveTab('archives'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'archives'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  Archives Immuables
                </button>
              </>
            )}

            {user?.role === 'SUPERADMIN' && (
              <button
                onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <Shield className="h-4 w-4" />
                Administration
              </button>
            )}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-900">
          <button
            onClick={logout}
            className="w-full py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 transition-all text-xs font-semibold text-slate-400 flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        {activeTab === 'activities' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Saisie d'Activités Form */}
            <div className="lg:col-span-1 glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-400" />
                Saisir une activité
              </h2>

              <form onSubmit={handleLogActivity} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Intitulé de l'activité</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="ex: Travaux d'inspection RN4"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catégorie</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    >
                      <option className="bg-slate-950 text-slate-300" value="Infrastructure">Infrastructure</option>
                      <option className="bg-slate-950 text-slate-300" value="Réunion">Réunion</option>
                      <option className="bg-slate-950 text-slate-300" value="Inspection">Inspection</option>
                      <option className="bg-slate-950 text-slate-300" value="Logistique">Logistique</option>
                      <option className="bg-slate-950 text-slate-300" value="Sécurité">Sécurité</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description détaillée</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                    placeholder="Saisissez les faits marquants, avancements, incidents..."
                    required
                  />
                </div>

                {activitySuccess && (
                  <div className="text-cyan-400 text-xs bg-cyan-950/40 border border-cyan-900/50 p-3 rounded-lg flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Activité enregistrée avec succès!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingActivity}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-xs transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingActivity ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </button>
              </form>
            </div>

            {/* List of Activities */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  Journal des Activités Récentes
                </h2>
                <button
                  onClick={fetchActivities}
                  className="p-1 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
                >
                  Actualiser
                </button>
              </div>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : activities.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                  Aucune activité enregistrée. Utilisez le formulaire de gauche pour commencer.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div key={act.id} className="glass-panel rounded-2xl p-5 hover:border-slate-800 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 uppercase tracking-wider mb-2">
                            {act.category}
                          </span>
                          <h3 className="font-bold text-sm text-slate-200">{act.title}</h3>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line">{act.content}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            {new Date(act.activity_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-[10px] text-slate-600 block mt-1">Saisi par {act.user?.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Generate form panel */}
            <div className="lg:col-span-1 glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                Générer un Rapport
              </h2>

              <div className="space-y-4 mt-2">
                <p className="text-xs text-slate-400 mb-4">
                  Générez instantanément une synthèse IA de vos activités. Choisissez la période ci-dessous. Le titre sera généré automatiquement !
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Période</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs appearance-none"
                  >
                    <option value="today" className="bg-slate-900 text-slate-100 py-1">Aujourd'hui</option>
                    <option value="this_week" className="bg-slate-900 text-slate-100 py-1">Cette Semaine</option>
                    <option value="this_month" className="bg-slate-900 text-slate-100 py-1">Ce Mois</option>
                    <option value="last_30_days" className="bg-slate-900 text-slate-100 py-1">30 Derniers Jours</option>
                    <option value="custom" className="bg-slate-900 text-slate-100 py-1">Période Personnalisée</option>
                  </select>
                </div>

                {reportPeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date de début</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date de fin</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>
                )}

                {reportError && (
                  <div className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{reportError}</span>
                  </div>
                )}

                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse et Génération IA en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Générer la synthèse
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI synthesis playground */}
            <div className="lg:col-span-2">
              {generatedReport ? (
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                    <div>
                      <h3 className="font-bold text-slate-100">{generatedReport.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Période : {new Date(generatedReport.period_start).toLocaleDateString('fr-FR')} au {new Date(generatedReport.period_end).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Statut :</span>
                      {generatedReport.status === 'DRAFT' && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[9px]">DRAFT</span>
                      )}
                      {generatedReport.status === 'SUBMITTED' && (
                        <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-900 text-blue-400 font-bold text-[9px]">SUBMITTED</span>
                      )}
                      {generatedReport.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900 text-cyan-400 font-bold text-[9px]">APPROVED</span>
                      )}
                      {generatedReport.status === 'ARCHIVED' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 font-bold text-[9px] flex items-center gap-1">
                          <Lock className="h-3 w-3" /> ARCHIVED
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Édition du rapport compilé (Style administratif)</label>
                    <textarea
                      value={reportEditText}
                      onChange={(e) => setReportEditText(e.target.value)}
                      disabled={generatedReport.status === 'ARCHIVED'}
                      rows={14}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-xs font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
                    {/* Save actions */}
                    <div>
                      {generatedReport.status !== 'ARCHIVED' && (
                        <button
                          onClick={handleSaveReportEdit}
                          disabled={isSavingReport}
                          className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-all flex items-center gap-2"
                        >
                          {isSavingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sauvegarder"}
                        </button>
                      )}
                      {saveSuccess && (
                        <span className="text-[10px] text-cyan-400 ml-2">Modifications enregistrées !</span>
                      )}
                    </div>

                    {/* Workflow status triggers */}
                    <div className="flex gap-2">
                      {generatedReport.status === 'DRAFT' && (
                        <button
                          onClick={handleSubmitReport}
                          disabled={isSubmittingReport}
                          className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-xs font-semibold transition-all"
                        >
                          Soumettre à validation
                        </button>
                      )}

                      {generatedReport.status === 'SUBMITTED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleApproveReport}
                            disabled={isApprovingReport || !['MANAGER', 'ADMIN_TENANT'].includes(user?.role || '')}
                            className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
                              ['MANAGER', 'ADMIN_TENANT'].includes(user?.role || '')
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white'
                                : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                            title={!['MANAGER', 'ADMIN_TENANT'].includes(user?.role || '') ? "Rôle de Manager requis" : ""}
                          >
                            Approuver le rapport
                          </button>
                        </div>
                      )}

                      {generatedReport.status === 'APPROVED' && (
                        <button
                          onClick={handleArchiveReport}
                          disabled={isArchivingReport}
                          className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Sceller et Archiver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cryptographic hash info once archived */}
                  {generatedReport.status === 'ARCHIVED' && (
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <FileCheck className="h-4.5 w-4.5" />
                        <span>DOCUMENT SCELLÉ PAR CLÉ DE PREUVE</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-mono truncate">
                        Empreinte Numérique (SHA-256) : {generatedReport.file_hash}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Ce document a été marqué comme immuable. Les modifications ultérieures et les suppressions sont bloquées par la base de données.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-panel rounded-3xl p-20 text-center text-slate-500 flex flex-col items-center">
                  <Sparkles className="h-10 w-10 text-slate-700 mb-3 animate-bounce" />
                  <p className="font-semibold text-sm">Zone de Génération IA</p>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">Configurez une plage de dates à gauche et lancez la synthèse automatique pour compiler vos activités.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'archives' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
                  <Lock className="h-5.5 w-5.5 text-emerald-400" />
                  Coffre-fort des Archives
                </h2>
                <p className="text-xs text-slate-500 mt-1">Documents scellés garantissant une traçabilité intégrale à valeur probatoire.</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
                  placeholder="Rechercher par titre, hash..."
                />
              </div>
            </div>

            {isLoadingReports ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : archivedReports.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-500">
                <Lock className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                Aucun rapport archivé trouvé.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {archivedReports.map((rep) => (
                  <div key={rep.id} className="glass-panel rounded-2xl p-5 border-emerald-950/30 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-bold text-sm text-slate-200">{rep.title}</h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 font-bold text-[9px] flex items-center gap-1">
                          <Lock className="h-3 w-3" /> SCELLÉ
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 space-y-1 mb-4">
                        <p>Période : {new Date(rep.period_start).toLocaleDateString('fr-FR')} au {new Date(rep.period_end).toLocaleDateString('fr-FR')}</p>
                        <p>Généré par : {rep.generated_by?.name || 'Système'}</p>
                        <p>Archivé le : {new Date(rep.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-900">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-900">
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Empreinte SHA-256</span>
                        <code className="text-[9px] text-emerald-400 font-mono block truncate">{rep.file_hash}</code>
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 font-medium">Fichier ID: {rep.id.slice(0, 8)}...</span>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); alert(`Simulation du téléchargement du PDF scellé pour: ${rep.title}\nSHA-256: ${rep.file_hash}`); }}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          Télécharger le PDF
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && user?.role === 'SUPERADMIN' && (
          <SuperAdminDashboard />
        )}
      </main>
    </div>
  );
}
