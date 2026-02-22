import { useState, useEffect, FormEvent, useRef } from 'react';
import { 
  Terminal, 
  Plus, 
  Play, 
  Square, 
  Trash2, 
  Cpu, 
  Database as DbIcon, 
  Activity, 
  Settings, 
  ChevronRight,
  Info,
  ExternalLink,
  Github,
  Upload,
  Link as LinkIcon,
  Store,
  Box,
  FileCode,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AppBlueprint } from './types';

const TEMPLATES = [
  { id: 'jellyfin', name: 'Jellyfin', description: 'The Free Software Media System', icon: '🎬', github: 'https://github.com/jellyfin/jellyfin' },
  { id: 'minecraft', name: 'Minecraft Server', description: 'High-performance PaperMC server', icon: '⛏️', github: 'https://github.com/PaperMC/Paper' },
  { id: 'pihole', name: 'Pi-hole', description: 'Network-wide Ad Blocking', icon: '🛡️', github: 'https://github.com/pi-hole/pi-hole' },
  { id: 'homeassistant', name: 'Home Assistant', description: 'Open source home automation', icon: '🏠', github: 'https://github.com/home-assistant/core' },
  { id: 'nextcloud', name: 'Nextcloud', description: 'A safe home for all your data', icon: '☁️', github: 'https://github.com/nextcloud/server' },
];

export default function App() {
  const [apps, setApps] = useState<AppBlueprint[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployType, setDeployType] = useState<'code' | 'file' | 'github'>('code');
  const [newAppName, setNewAppName] = useState('');
  const [newAppCode, setNewAppCode] = useState('// Your Node.js code here\nconsole.log("Hello Pi!");');
  const [newGithubUrl, setNewGithubUrl] = useState('');
  const [envVars, setEnvVars] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'desktop' | 'containers' | 'marketplace' | 'setup'>('desktop');
  const [systemStats, setSystemStats] = useState<any[]>([]);
  const [viewingLogs, setViewingLogs] = useState<AppBlueprint | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchApps();
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
      fetchApps();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewingLogs) {
      fetchLogs(viewingLogs.id);
      const logInterval = setInterval(() => fetchLogs(viewingLogs.id), 3000);
      return () => clearInterval(logInterval);
    }
  }, [viewingLogs]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      setApps(data);
    } catch (err) {
      console.error('Failed to fetch apps', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/system/stats');
      const data = await res.json();
      setSystemStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchLogs = async (id: number) => {
    try {
      const res = await fetch(`/api/apps/${id}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const handleDeploy = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const envObj = envVars.reduce((acc, curr) => {
        if (curr.key) acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      const payload: any = { 
        name: newAppName, 
        deploy_type: deployType,
        env_vars: envObj
      };

      if (deployType === 'code') payload.code = newAppCode;
      if (deployType === 'github') payload.github_url = newGithubUrl;
      if (deployType === 'file' && selectedFile) payload.file_name = selectedFile.name;

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDeploying(false);
        resetForm();
        fetchApps();
      }
    } catch (err) {
      console.error('Failed to deploy', err);
    }
  };

  const resetForm = () => {
    setNewAppName('');
    setNewAppCode('// Your Node.js code here\nconsole.log("Hello Pi!");');
    setNewGithubUrl('');
    setSelectedFile(null);
    setDeployType('code');
    setEnvVars([{ key: '', value: '' }]);
  };

  const toggleApp = async (id: number) => {
    try {
      const res = await fetch(`/api/apps/${id}/toggle`, { method: 'POST' });
      if (res.ok) fetchApps();
    } catch (err) {
      console.error('Failed to toggle app', err);
    }
  };

  const deleteApp = async (id: number) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (res.ok) fetchApps();
    } catch (err) {
      console.error('Failed to delete app', err);
    }
  };

  const installTemplate = async (template: typeof TEMPLATES[0]) => {
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: template.name, 
          deploy_type: 'github', 
          github_url: template.github 
        }),
      });
      if (res.ok) {
        setActiveTab('containers');
        fetchApps();
      }
    } catch (err) {
      console.error('Failed to install template', err);
    }
  };

  const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
  const removeEnvVar = (index: number) => setEnvVars(envVars.filter((_, i) => i !== index));
  const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...envVars];
    next[index][field] = val;
    setEnvVars(next);
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-black/10 flex flex-col bg-white shadow-xl z-20">
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-black tracking-tighter text-2xl">DOCKER-PI</h1>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-30 font-mono font-bold">Medizinische Analyse v1.4</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('desktop')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'desktop' ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5 text-zinc-500'}`}
          >
            <Activity className="w-4 h-4" />
            Desktop
          </button>
          <button 
            onClick={() => setActiveTab('containers')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'containers' ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5 text-zinc-500'}`}
          >
            <Box className="w-4 h-4" />
            Container
          </button>
          <button 
            onClick={() => setActiveTab('marketplace')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'marketplace' ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5 text-zinc-500'}`}
          >
            <Store className="w-4 h-4" />
            App Store
          </button>
          <button 
            onClick={() => setActiveTab('setup')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'setup' ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5 text-zinc-500'}`}
          >
            <Zap className="w-4 h-4" />
            Diagnose
          </button>
          
          <div className="pt-8 pb-2 px-4">
            <p className="text-[10px] uppercase tracking-widest opacity-30 font-black">System-Tools</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black/5 text-zinc-400 cursor-not-allowed">
            <Settings className="w-4 h-4" />
            Einstellungen
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black/5 text-zinc-400 cursor-not-allowed">
            <DbIcon className="w-4 h-4" />
            Speicher
          </button>
        </nav>

        <div className="p-6 border-t border-black/5">
          <div className="bg-black/5 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="opacity-40">RAM AUSLASTUNG</span>
              <span className="text-blue-600">24%</span>
            </div>
            <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[24%] shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="opacity-40">SPEICHER</span>
              <span className="text-zinc-600">12.4 GB Frei</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F8F9FA]">
        <header className="h-20 border-b border-black/5 flex items-center justify-between px-10 bg-white/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="opacity-30">Pi-Engine</span>
            <ChevronRight className="w-4 h-4 opacity-10" />
            <span className="text-zinc-900">
              {activeTab === 'desktop' ? 'Dashboard' : 
               activeTab === 'containers' ? 'Container-Management' : 
               activeTab === 'marketplace' ? 'App Store' : 'System-Diagnose'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity" />
              <input 
                type="text" 
                placeholder="Suchen..." 
                className="bg-black/5 border border-transparent rounded-2xl pl-11 pr-6 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 w-72 transition-all"
              />
            </div>
            {activeTab === 'containers' && (
              <button 
                onClick={() => setIsDeploying(true)}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Container hinzufügen
              </button>
            )}
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {activeTab === 'desktop' ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white border border-black/5 p-8 rounded-[2rem] shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-30 mb-1">System-Vitalwerte</h3>
                      <p className="text-sm font-medium text-zinc-500">Echtzeit-Analyse der Pi-Ressourcen</p>
                    </div>
                    <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                        <span>CPU</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span>RAM</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={systemStats}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000005" />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={3} />
                        <Area type="monotone" dataKey="ram" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'Aktiv', value: apps.filter(a => a.status === 'running').length, icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Gestoppt', value: apps.filter(a => a.status === 'stopped').length, icon: Square, color: 'text-zinc-400', bg: 'bg-zinc-50' },
                    { label: 'Container', value: apps.length, icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-black/5 p-6 rounded-[1.5rem] shadow-sm flex items-center gap-5 group hover:scale-[1.02] transition-transform">
                      <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-sm`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">{stat.label}</p>
                        <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-black/5 p-8 rounded-[2rem] shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-30 mb-6">Letzte Aktivitäten</h4>
                  <div className="space-y-4">
                    {apps.length === 0 ? (
                      <p className="text-sm opacity-30 italic">Keine Aktivitäten aufgezeichnet.</p>
                    ) : (
                      apps.slice(0, 4).map(app => (
                        <div key={app.id} className="flex items-center justify-between p-3 hover:bg-black/[0.02] rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${app.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`} />
                            <span className="font-bold text-sm">{app.name}</span>
                          </div>
                          <span className="opacity-30 text-[10px] font-bold">{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="bg-zinc-900 text-white p-10 rounded-[2rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">Pi Engine Status</h4>
                    <p className="text-2xl font-light leading-snug">Alle Systeme im <span className="text-emerald-400 font-bold">Optimalbereich</span>. Engine Version 1.4 ist einsatzbereit.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('setup')}
                    className="relative z-10 w-fit text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-3 mt-8 bg-white/5 px-6 py-3 rounded-xl hover:bg-white/10"
                  >
                    Diagnosebericht öffnen <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'containers' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Container-Management</h2>
                  <p className="text-sm text-zinc-500 mt-1">Verwalten und überwachen Sie Ihre isolierten Anwendungen.</p>
                </div>
                <button 
                  onClick={() => setIsDeploying(true)}
                  className="bg-black text-white px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10"
                >
                  <Plus className="w-5 h-5" />
                  Container hinzufügen
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <div className="p-20 text-center opacity-30 italic font-medium">Synchronisiere mit Pi Engine...</div>
                  ) : apps.length === 0 ? (
                    <div className="p-20 text-center bg-white border-2 border-dashed border-black/5 rounded-[2.5rem]">
                      <Box className="w-16 h-16 mx-auto mb-6 opacity-5" />
                      <p className="text-zinc-400 font-bold">Keine Container aktiv.</p>
                      <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Starten Sie durch Hinzufügen eines neuen Containers.</p>
                    </div>
                  ) : (
                    apps.map((app) => (
                      <motion.div 
                        key={app.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${app.status === 'running' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-zinc-50 text-zinc-300'}`}>
                            <Box className="w-7 h-7" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-black text-lg tracking-tight">{app.name}</h3>
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${app.status === 'running' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-zinc-200 text-zinc-500 bg-zinc-50'}`}>
                                {app.status === 'running' ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex items-center gap-5 mt-2">
                              <div className="flex items-center gap-1.5 opacity-40 text-[11px] font-bold">
                                <Activity className="w-3.5 h-3.5" /> 192.168.1.{100 + app.id}
                              </div>
                              <div className="flex items-center gap-1.5 opacity-40 text-[11px] font-bold">
                                <Settings className="w-3.5 h-3.5" /> Port: {app.port || 8080}
                              </div>
                              <div className="flex items-center gap-1.5 opacity-40 text-[11px] font-bold uppercase tracking-widest">
                                {app.deploy_type === 'code' && <FileCode className="w-3.5 h-3.5" />}
                                {app.deploy_type === 'file' && <Upload className="w-3.5 h-3.5" />}
                                {app.deploy_type === 'github' && <Github className="w-3.5 h-3.5" />}
                                {app.deploy_type}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setViewingLogs(app)}
                            className="p-3 text-zinc-400 hover:text-black hover:bg-black/5 rounded-2xl transition-all"
                            title="Logs anzeigen"
                          >
                            <Terminal className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleApp(app.id)}
                            className={`p-3 rounded-2xl transition-all shadow-sm ${app.status === 'running' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                          >
                            {app.status === 'running' ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                          </button>
                          <button 
                            onClick={() => deleteApp(app.id)}
                            className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : activeTab === 'marketplace' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">App Store</h2>
                <p className="text-sm text-zinc-500 mt-1">Installieren Sie vorkonfigurierte Anwendungen mit einem Klick.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {TEMPLATES.map((template) => (
                  <div key={template.id} className="bg-white border border-black/5 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all group flex flex-col">
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform inline-block drop-shadow-sm">{template.icon}</div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">{template.name}</h3>
                    <p className="text-sm text-zinc-500 mb-8 flex-1 leading-relaxed">{template.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-black/5">
                      <a href={template.github} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline">
                        <Github className="w-4 h-4" /> Source
                      </a>
                      <button 
                        onClick={() => installTemplate(template)}
                        className="bg-black text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                      >
                        Installieren
                      </button>
                    </div>
                  </div>
                ))}
                <div className="bg-black/[0.02] border-2 border-dashed border-black/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:bg-black/[0.04] transition-colors">
                  <Plus className="w-12 h-12 mb-4 opacity-10 group-hover:opacity-20 transition-opacity" />
                  <p className="text-sm font-black uppercase tracking-widest opacity-40">App anfragen</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Community Driven Development</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white border border-black/5 p-10 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    System-Diagnose
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    System Stabil
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Pi Engine', status: 'Gesund', icon: Cpu, detail: 'Core v1.4.2-stable' },
                    { label: 'SQLite Datenbank', status: 'Optimiert', icon: DbIcon, detail: 'Indexierung abgeschlossen' },
                    { label: 'Netzwerk-Bridge', status: 'Verbunden', icon: Activity, detail: 'Latenz: 2ms' },
                    { label: 'Speicherplatz', status: '12.4 GB Frei', icon: Box, detail: 'SSD Status: Exzellent' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-black/[0.02] rounded-2xl hover:bg-black/[0.04] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <item.icon className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <span className="font-black text-sm block">{item.label}</span>
                          <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{item.detail}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-orange-50 border border-orange-100 p-8 rounded-[2rem] flex gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm h-fit">
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-orange-900 mb-2 tracking-tight">Wartungsempfehlung</h4>
                    <p className="text-sm text-orange-800 leading-relaxed opacity-80 font-medium">Ihr Raspberry Pi läuft seit 12 Tagen ohne Unterbrechung. Wir empfehlen einen Neustart, um den System-Cache zu leeren und die Container-Performance zu optimieren.</p>
                    <button className="mt-6 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">Neustart planen</button>
                  </div>
                </div>
                
                <div className="bg-blue-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 opacity-10">
                    <CheckCircle2 className="w-40 h-40" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">Sicherheits-Status</h4>
                    <p className="text-xl font-bold leading-tight">Firewall aktiv. Keine Bedrohungen erkannt.</p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 relative z-10">
                    Letzter Scan: Vor 5 Min
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Deploy Modal */}
      <AnimatePresence>
        {isDeploying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeploying(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-black/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">New Container</h2>
                  <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Deploy to Pi Engine</p>
                </div>
                <button onClick={() => setIsDeploying(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-black/10">
                <button 
                  onClick={() => setDeployType('code')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${deployType === 'code' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
                >
                  <FileCode className="w-4 h-4" /> Code
                </button>
                <button 
                  onClick={() => setDeployType('file')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${deployType === 'file' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
                >
                  <Upload className="w-4 h-4" /> File
                </button>
                <button 
                  onClick={() => setDeployType('github')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${deployType === 'github' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
                >
                  <Github className="w-4 h-4" /> GitHub
                </button>
              </div>

              <form onSubmit={handleDeploy} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 block">Container Name</label>
                      <input 
                        autoFocus
                        required
                        type="text" 
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        placeholder="e.g. weather-service"
                        className="w-full bg-black/5 border border-black/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 block">Port Mapping</label>
                      <input 
                        type="number" 
                        placeholder="8080"
                        className="w-full bg-black/5 border border-black/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {deployType === 'code' && (
                    <div className="flex-1 flex flex-col min-h-[200px]">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 block">Source Code (Node.js)</label>
                      <textarea 
                        required
                        value={newAppCode}
                        onChange={(e) => setNewAppCode(e.target.value)}
                        className="flex-1 w-full bg-zinc-900 text-zinc-300 p-4 rounded-lg font-mono text-sm focus:outline-none resize-none"
                        spellCheck={false}
                      />
                    </div>
                  )}

                  {deployType === 'file' && (
                    <div className="py-8 border-2 border-dashed border-black/10 rounded-xl flex flex-col items-center justify-center text-center">
                      <Upload className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-sm font-medium mb-1">
                        {selectedFile ? selectedFile.name : 'Click to upload app file'}
                      </p>
                      <p className="text-xs opacity-40 mb-4">Supports .js, .zip, .tar.gz</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        Select File
                      </button>
                    </div>
                  )}

                  {deployType === 'github' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 block">Repository URL</label>
                      <div className="relative">
                        <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                        <input 
                          required
                          type="url" 
                          value={newGithubUrl}
                          onChange={(e) => setNewGithubUrl(e.target.value)}
                          placeholder="https://github.com/user/repo"
                          className="w-full bg-black/5 border border-black/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Environment Variables</label>
                      <button type="button" onClick={addEnvVar} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Add Var</button>
                    </div>
                    <div className="space-y-2">
                      {envVars.map((ev, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            placeholder="KEY" 
                            value={ev.key}
                            onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                            className="flex-1 bg-black/5 border border-black/10 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none"
                          />
                          <input 
                            placeholder="VALUE" 
                            value={ev.value}
                            onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                            className="flex-1 bg-black/5 border border-black/10 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none"
                          />
                          <button type="button" onClick={() => removeEnvVar(i)} className="p-1.5 text-zinc-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-black/10 bg-black/5 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsDeploying(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                  >
                    Deploy Container
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Viewer Modal */}
      <AnimatePresence>
        {viewingLogs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingLogs(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-900 w-full max-w-4xl h-[70vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-800">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-white font-bold">{viewingLogs.name} <span className="opacity-30 font-normal ml-2">Logs</span></h2>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => fetchLogs(viewingLogs.id)} className="text-white/40 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewingLogs(null)} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-black/40">
                {logs.length === 0 ? (
                  <p className="text-white/20 italic">No logs generated yet...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="mb-1 flex gap-4">
                      <span className="text-white/20 select-none">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-emerald-400/80">{log.message || 'Container started successfully.'}</span>
                    </div>
                  ))
                )}
                <div className="mt-4 flex items-center gap-2 text-emerald-500/40">
                  <Zap className="w-3 h-3 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Live Stream Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
