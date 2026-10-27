import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sprout,
  Stethoscope,
  CloudSun,
  Droplets,
  CalendarDays,
  Boxes,
  IndianRupee,
  TrendingUp,
  Bot,
  Bell,
  Cpu,
  FileText,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  Send,
  Upload,
  Layers,
  Thermometer,
  Wind,
  Check,
  X
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lang, setLang] = useState('en');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeSimulationModal, setActiveSimulationModal] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [rescheduleResult, setRescheduleResult] = useState(null);

  // Crop Doctor State
  const [diagField, setDiagField] = useState('field-101');
  const [diagCrop, setDiagCrop] = useState('Wheat (DBW-187)');
  const [diagSymptoms, setDiagSymptoms] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);
  const [uploadedImageName, setUploadedImageName] = useState(null);

  // Field Modal State
  const [activeAddFieldModal, setActiveAddFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldArea, setNewFieldArea] = useState('12');
  const [newFieldCrop, setNewFieldCrop] = useState('Wheat (HD-3086)');
  const [newFieldStage, setNewFieldStage] = useState('Tillering');
  const [addingField, setAddingField] = useState(false);

  // Task Modal State
  const [activeAddTaskModal, setActiveAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Irrigation');
  const [newTaskPriority, setNewTaskPriority] = useState('HIGH');
  const [newTaskWorker, setNewTaskWorker] = useState('Ramesh Kumar');
  const [newTaskCost, setNewTaskCost] = useState('1500');
  const [addingTask, setAddingTask] = useState(false);

  // Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! I am AgriMind AI, your autonomous farm operations assistant. How can I optimize your Karnal farmstead today?',
      actions: ['Review CRI Irrigation', 'Check Weather Squall Risk', 'Examine Soil Moisture']
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch full platform state
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
      if (data.farms?.[0]?.fields?.[0] && !selectedField) {
        setSelectedField(data.farms[0].fields[0]);
      }
      setLoading(false);
    } catch (e) {
      console.error('Error fetching state:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    try {
      await fetch('/api/state/reset', { method: 'POST' });
      await fetchState();
      setRescheduleResult(null);
      alert('Farmstead reset to deterministic Karnal baseline state.');
    } catch (e) {
      alert('Reset failed: ' + e.message);
    }
  };

  // Trigger Dynamic Simulation
  const handleSimulate = async (eventType) => {
    setSimulating(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType })
      });
      const proposal = await res.json();
      setRescheduleResult(proposal);
      await fetchState();
      setActiveSimulationModal(false);
      setCurrentTab('planner');
    } catch (e) {
      alert('Simulation error: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleProposalDecision = async (proposalId, decision) => {
    try {
      await fetch(`/api/proposals/${proposalId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: `Farmer marked ${decision} via Command Center UI` })
      });
      await fetchState();
      setRescheduleResult(null);
    } catch (e) {
      alert('Error updating decision: ' + e.message);
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SCHEDULED' })
      });
      await fetchState();
    } catch (e) {
      alert('Failed to approve task: ' + e.message);
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    setAddingField(true);
    try {
      await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFieldName || 'New Precision Block',
          areaAcres: newFieldArea,
          crop: newFieldCrop,
          growthStage: newFieldStage
        })
      });
      await fetchState();
      setActiveAddFieldModal(false);
      setNewFieldName('');
    } catch (err) {
      alert('Failed to register field: ' + err.message);
    } finally {
      setAddingField(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setAddingTask(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle || 'Field Inspection',
          category: newTaskCategory,
          priority: newTaskPriority,
          assignedWorker: newTaskWorker,
          costEstimateInr: newTaskCost,
          fieldName: selectedField?.name || 'North Block A (Wheat)'
        })
      });
      await fetchState();
      setActiveAddTaskModal(false);
      setNewTaskTitle('');
    } catch (err) {
      alert('Failed to add task: ' + err.message);
    } finally {
      setAddingTask(false);
    }
  };

  // Crop Doctor Diagnostic submission
  const handleDiagnose = async (demoScenario) => {
    setDiagLoading(true);
    let cropName = diagCrop;
    let symptomsText = diagSymptoms;
    let field = diagField;

    if (demoScenario === 'wheat_zinc') {
      cropName = 'Wheat (DBW-187 Karan Vandana)';
      symptomsText = 'Chlorotic yellow mottling and white striping in middle third of younger leaves, stunted crown root growth';
      field = 'field-101';
      setDiagCrop(cropName);
      setDiagSymptoms(symptomsText);
      setDiagField(field);
    } else if (demoScenario === 'mustard_aphid') {
      cropName = 'Mustard (RH-725)';
      symptomsText = 'Dense green aphid colonies on inflorescence branches and curled terminal leaves with glistening honey-dew';
      field = 'field-102';
      setDiagCrop(cropName);
      setDiagSymptoms(symptomsText);
      setDiagField(field);
    } else if (!symptomsText.trim()) {
      symptomsText = 'Observed visible foliar discoloration and abnormal growth symptoms on leaf surface';
    }

    try {
      const res = await fetch('/api/crop-doctor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: field,
          crop: cropName,
          symptoms: symptomsText,
          demoScenario
        })
      });
      const data = await res.json();
      setActiveDiagnosis(data);
      await fetchState();
      // Scroll to diagnosis result
      setTimeout(() => {
        document.getElementById('diagnostic-report-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      alert('Analysis error: ' + e.message);
    } finally {
      setDiagLoading(false);
    }
  };

  // Assistant Query
  const handleSendChat = async (userText) => {
    const textToSend = userText || inputQuery;
    if (!textToSend.trim()) return;

    const newMsgs = [...chatMessages, { sender: 'user', text: textToSend }];
    setChatMessages(newMsgs);
    setInputQuery('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, language: lang })
      });
      const data = await res.json();
      setChatMessages([
        ...newMsgs,
        {
          sender: 'bot',
          text: data.response,
          actions: data.suggestedActions || []
        }
      ]);
    } catch (e) {
      setChatMessages([
        ...newMsgs,
        { sender: 'bot', text: 'Error connecting to intelligence service: ' + e.message }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#071e12] text-emerald-400">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-semibold tracking-wide">AgriMind AI Platform Initializing...</h2>
          <p className="text-sm text-emerald-200/70">Connecting to Autonomous Farm Telemetry Engine (Karnal, Haryana)</p>
        </div>
      </div>
    );
  }

  const farm = state.farms[0] || {};
  const currentPendingProposal = state.rescheduleProposals?.find(p => p.status === 'AWAITING_FARMER_APPROVAL');

  return (
    <div className="flex h-screen bg-[#f8faf7] text-slate-800 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#071e12] text-slate-200 flex flex-col justify-between shrink-0 border-r border-[#14432a]">
        <div>
          {/* Logo & Platform Brand */}
          <div className="p-5 border-b border-[#14432a] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-lime-400 flex items-center justify-center text-forest-950 font-black shadow-lg">
                <Sprout className="w-5 h-5 text-forest-950" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  AgriMind <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">AI</span>
                </h1>
                <p className="text-[10px] text-emerald-300/60 font-medium tracking-wider uppercase">Autonomous Farm OS</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] text-sm">
            {[
              { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
              { id: 'fields', label: 'Fields & Crops', icon: Sprout },
              { id: 'doctor', label: 'AI Crop Doctor', icon: Stethoscope },
              { id: 'planner', label: 'Autonomous Planner', icon: CalendarDays, badge: currentPendingProposal ? 'ALERT' : null },
              { id: 'weather', label: 'Weather Sentinel', icon: CloudSun },
              { id: 'soil', label: 'Soil & Irrigation', icon: Droplets },
              { id: 'resources', label: 'Resources & Fleet', icon: Boxes },
              { id: 'finance', label: 'Farm Finance', icon: IndianRupee },
              { id: 'market', label: 'Market Mandi Intel', icon: TrendingUp },
              { id: 'iot', label: 'IoT Sensor Mesh', icon: Cpu },
              { id: 'assistant', label: 'AI Farm Assistant', icon: Bot },
              { id: 'audit', label: 'System Audit Logs', icon: FileText }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-300 hover:bg-[#14432a]/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500 text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & Mode indicator */}
        <div className="p-4 border-t border-[#14432a] bg-[#0c2e1c]/50 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/80 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Live Autonomous Loop
            </span>
            <span className="text-[10px] text-slate-400">v2.0 PROD</span>
          </div>

          <button
            onClick={() => setActiveSimulationModal(true)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-forest-950 font-bold shadow-md transition-all text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Farm Incident</span>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-[#14432a] hover:bg-[#1d5c3b] text-slate-300 hover:text-white text-[11px] font-medium transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP APP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-900">{farm.name}</span>
              <span className="text-xs text-slate-500 font-medium">({farm.district}, {farm.state})</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {farm.totalAreaAcres} Acres Active
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold border border-slate-200">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition ${lang === 'en' ? 'bg-white shadow text-emerald-700' : 'text-slate-600'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-md transition ${lang === 'hi' ? 'bg-white shadow text-emerald-700' : 'text-slate-600'}`}
              >
                हिन्दी
              </button>
            </div>

            {/* AI Assistant Quick Pill */}
            <button
              onClick={() => setCurrentTab('assistant')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Farm Advisor</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative transition"
              >
                <Bell className="w-4 h-4" />
                {currentPendingProposal && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operational Alerts</h4>
                    <span className="text-[10px] text-emerald-600 font-medium">Real-time Sentinel</span>
                  </div>
                  <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                    {currentPendingProposal ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Schedule Reassessment Required</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 line-clamp-2">
                          {currentPendingProposal.justification}
                        </p>
                        <button
                          onClick={() => { setCurrentTab('planner'); setNotificationOpen(false); }}
                          className="mt-2 text-[10px] font-bold text-amber-900 underline block"
                        >
                          Review & Authorize Changes →
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">
                        No critical schedule conflicts detected.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-forest-800 text-emerald-300 font-bold flex items-center justify-center text-xs">
                HK
              </div>
              <div className="text-left text-xs leading-none">
                <p className="font-bold text-slate-800">Harpreet K.</p>
                <p className="text-[10px] text-slate-500">Farm Lead</p>
              </div>
            </div>
          </div>
        </header>

        {/* ACTIVE CONTENT VIEW */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* LOW-PESTICIDE & SUSTAINABLE FARMING HERO BENTO (Eloqwnt Style) */}
              <div className="bg-gradient-to-br from-[#0c2e1c] via-[#14432a] to-[#071e12] text-white rounded-3xl p-7 shadow-2xl border border-emerald-500/20 relative overflow-hidden">
                {/* Subtle tech background grid pattern & ambient glow */}
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
                <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-400/30 backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI-Powered Low-Pesticide Agriculture</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                      Intelligent Biological Defense & Precision Chemical Abatement
                    </h2>

                    <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed font-normal">
                      Autonomous multispectral scouting isolates pest hotspots to within 2 meters, deploying targeted bio-rational inputs while curtailing synthetic runoff into Karnal canal basins by <strong className="text-emerald-300 font-bold">78.4%</strong>.
                    </p>

                    {/* Low-Pesticide KPI Chips */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-slate-300">Pesticide Reduction:</span>
                        <span className="text-emerald-300 font-bold font-mono">-78.4%</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2">
                        <span className="text-slate-300">Bio-Control Ratio:</span>
                        <span className="text-emerald-300 font-bold font-mono">92% Organic</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2">
                        <span className="text-slate-300">Runoff Protection:</span>
                        <span className="text-emerald-300 font-bold">Safe (Canal Shield Active)</span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Right Action Card */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                    <button
                      onClick={() => setCurrentTab('doctor')}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-400 hover:from-emerald-300 hover:to-lime-300 text-forest-950 font-black text-xs shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Stethoscope className="w-4 h-4 text-forest-950" />
                      <span>Launch AI Crop Doctor</span>
                    </button>

                    <button
                      onClick={() => setActiveSimulationModal(true)}
                      className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>Simulate Incident Adaptive Re-plan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* URGENT OPERATIONAL BANNER */}
              {currentPendingProposal ? (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <h3 className="font-extrabold text-sm text-amber-950">
                        Dynamic Reassessment Awaiting Farmer Sign-off
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('planner')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition"
                    >
                      Review & Approve Changes →
                    </button>
                  </div>
                  <p className="text-xs text-amber-900 bg-white/80 p-3 rounded-xl border border-amber-200">
                    {currentPendingProposal.justification}
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-950/5 border border-emerald-900/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Canopy Health & Eco-Spraying Window: OPTIMAL</h4>
                      <p className="text-slate-500 text-[11px]">No chemical drift risk detected. Crown Root micro-irrigation window prioritized for North Block A.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentTab('planner')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition"
                  >
                    View Task Timeline
                  </button>
                </div>
              )}

              {/* BENTO GRID: PESTICIDE SAVINGS & PRECISION TELEMETRY */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Low-Pesticide Abatement Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-semibold uppercase tracking-wider">Chemical Abatement</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-emerald-700">-78.4%</div>
                    <div className="text-xs text-slate-500 mt-0.5">Synthetic Chemical Pesticide Cut</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Targeted Spot-Spray:</span>
                    <strong className="text-emerald-700">92% Saved</strong>
                  </div>
                </div>

                {/* Weather card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-semibold uppercase tracking-wider">Agro Weather</span>
                    <CloudSun className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-800">{state.weather.current.temperature}°C</div>
                    <div className="text-xs text-slate-500 mt-0.5">{state.weather.current.condition} • {state.weather.location}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>Humidity: <strong className="text-slate-800">{state.weather.current.humidity}%</strong></div>
                    <div>Rain Risk: <strong className="text-emerald-700">{state.weather.current.precipitationChance}%</strong></div>
                  </div>
                </div>

                {/* Soil & Water */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-semibold uppercase tracking-wider">Root-zone Moisture</span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-800">18.2% <span className="text-xs font-medium text-amber-600">(Deficit)</span></div>
                    <div className="text-xs text-slate-500 mt-0.5">North Block A • Wheat CRI Stage</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Avail. Water: <strong className="text-slate-800">1,25,000 L</strong></span>
                    <span className="text-emerald-600 font-semibold">Pump #1 Ready</span>
                  </div>
                </div>

                {/* Autonomous Operations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-semibold uppercase tracking-wider">Operations Pipeline</span>
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-800">
                      {state.tasks.length} <span className="text-xs font-semibold text-slate-500">Tasks</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {state.tasks.filter(t => t.priority === 'CRITICAL').length} Critical • {state.tasks.filter(t => t.status === 'PENDING_APPROVAL').length} Pending Approval
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Resource Conflict:</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">0 Conflicts</span>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN WORKSPACE: FIELDS OVERVIEW & SCHEDULE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Registered Fields & Geospatial Status */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-600" /> Registered Fields ({farm.fields?.length})
                    </h3>
                    <button
                      onClick={() => setCurrentTab('fields')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Manage →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {farm.fields?.map(f => (
                      <div
                        key={f.id}
                        onClick={() => setSelectedField(f)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                          selectedField?.id === f.id
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{f.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            f.healthStatus === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {f.healthStatus}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-1">
                          Crop: <strong className="text-slate-700">{f.crop}</strong>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Stage: {f.growthStage} • {f.areaAcres} Acres
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                          <div>Moisture: <strong>{f.soil.moisturePercent}%</strong></div>
                          <div>Soil pH: <strong>{f.soil.ph}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mandi Price Flash */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Karnal Mandi Price
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Agmarknet Sync</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Wheat (DBW-187):</span>
                      <span className="font-bold text-slate-800">₹2,475 / Qtl <span className="text-emerald-600 font-normal">(+2.4%)</span></span>
                    </div>
                  </div>
                </div>

                {/* Operational Task Calendar & Next Actions */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-emerald-600" /> Operational Action Pipeline
                      </h3>
                      <p className="text-xs text-slate-500">Autonomous multi-constraint scheduling engine</p>
                    </div>

                    <button
                      onClick={() => setCurrentTab('planner')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200"
                    >
                      Open Full Planner
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.tasks.slice(0, 4).map(task => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="font-bold text-slate-800">{task.title}</span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            {task.fieldName} • Assigned: <span className="text-slate-700 font-medium">{task.assignedWorker}</span> ({task.assignedEquipment})
                          </p>
                          <p className="text-slate-400 text-[10px] italic">
                            Reason: {task.notes}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right text-[11px]">
                            <div className="font-semibold text-slate-800 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3 text-slate-400" /> {task.scheduledDate}
                            </div>
                            <div className="text-emerald-700 font-medium text-[10px]">{task.weatherWindowSuitability}</div>
                          </div>

                          {task.status === 'PENDING_APPROVAL' ? (
                            <button
                              onClick={() => handleApproveTask(task.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer transition active:scale-95"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                              {task.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Reasoning Feed Preview */}
                  <div className="mt-4 p-3.5 rounded-xl bg-forest-950 text-emerald-300 font-mono text-[11px] space-y-1.5 border border-forest-800">
                    <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-sans border-b border-forest-800 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Autonomous Decision Audit
                      </span>
                      <span className="text-slate-400">Deterministic Engine</span>
                    </div>
                    <p className="text-emerald-200/90">
                      &gt; Checking weather window for Drone Zinc Spray on North Block A: Favorable.
                    </p>
                    <p className="text-slate-400">
                      &gt; Soil Moisture probe at 15cm indicates 18.2% VWC. Tubewell Pump #1 ready with zero conflict.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUTONOMOUS PLANNER & RESCHEDULING ENGINE */}
          {currentTab === 'planner' && (
            <div className="space-y-6">
              {/* Proposal Banner if Reassessment is active */}
              {currentPendingProposal && (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <h3 className="font-extrabold text-sm text-amber-950 tracking-tight">
                        Farmer Approval Required: Dynamic Reassessment Proposal
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 font-bold text-xs uppercase">
                      Risk Level: {currentPendingProposal.riskLevel}
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200">
                    <strong>Agronomic Justification:</strong> {currentPendingProposal.justification}
                  </p>

                  {/* BEFORE VS AFTER DIFF TABLE */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Proposed Schedule Modifications ({currentPendingProposal.diffSummary.length} Tasks Modified)
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-100/50 text-slate-700 border-b border-amber-200 text-[11px]">
                          <tr>
                            <th className="p-3 font-bold">Field & Task</th>
                            <th className="p-3 font-bold">Original Date</th>
                            <th className="p-3 font-bold">Proposed Date</th>
                            <th className="p-3 font-bold">Reason & Resource Impact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {currentPendingProposal.diffSummary.map((diff, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-3 font-semibold text-slate-800">
                                <div>{diff.taskTitle}</div>
                                <div className="text-[10px] text-slate-500">{diff.field}</div>
                              </td>
                              <td className="p-3 text-red-600 line-through font-mono">{diff.oldSchedule}</td>
                              <td className="p-3 text-emerald-700 font-bold font-mono">{diff.proposedSchedule}</td>
                              <td className="p-3 text-slate-600">
                                <div>{diff.reason}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{diff.resourceImpact}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Approval Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => handleProposalDecision(currentPendingProposal.id, 'REJECTED')}
                      className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      Reject & Keep Prior Schedule
                    </button>
                    <button
                      onClick={() => handleProposalDecision(currentPendingProposal.id, 'APPROVED')}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Commit Reorganized Plan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Task Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Autonomous Operations Plan</h3>
                    <p className="text-xs text-slate-500">Continuous coordination of workers, machinery, weather suitability, and crop priorities</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveAddTaskModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Create Task</span>
                    </button>
                    <button
                      onClick={() => setActiveSimulationModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Incident</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-3 font-bold">Priority</th>
                        <th className="p-3 font-bold">Task Title</th>
                        <th className="p-3 font-bold">Target Field</th>
                        <th className="p-3 font-bold">Scheduled Window</th>
                        <th className="p-3 font-bold">Assigned Worker & Machinery</th>
                        <th className="p-3 font-bold">Est. Cost</th>
                        <th className="p-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {state.tasks.map(task => (
                        <tr key={task.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            <div>{task.title}</div>
                            <div className="text-[10px] text-slate-400 font-normal italic">{task.recommendationSource}</div>
                          </td>
                          <td className="p-3 text-slate-600">{task.fieldName}</td>
                          <td className="p-3 font-mono">
                            <div className="font-semibold text-slate-800">{task.scheduledDate}</div>
                            <div className="text-[10px] text-emerald-600">{task.weatherWindowSuitability}</div>
                          </td>
                          <td className="p-3 text-slate-700">
                            <div>{task.assignedWorker}</div>
                            <div className="text-[10px] text-slate-500">{task.assignedEquipment}</div>
                          </td>
                          <td className="p-3 font-mono font-semibold text-slate-800">₹{task.costEstimateInr}</td>
                          <td className="p-3">
                            {task.status === 'PENDING_APPROVAL' ? (
                              <button
                                onClick={() => handleApproveTask(task.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm cursor-pointer transition active:scale-95"
                              >
                                Approve Task
                              </button>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                task.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {task.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI CROP DOCTOR */}
          {currentTab === 'doctor' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-emerald-600" />
                      AI Crop Pathology & Computer Vision Diagnostic
                    </h3>
                    <p className="text-xs text-slate-500">
                      Correlates leaf imagery with soil chemistry, crop growth stage, and local micro-meteorological history
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDiagnose('wheat_zinc')}
                      disabled={diagLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
                    >
                      Sample 1: Wheat Zinc Chlorosis
                    </button>
                    <button
                      onClick={() => handleDiagnose('mustard_aphid')}
                      disabled={diagLoading}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition"
                    >
                      Sample 2: Mustard Aphid Infestation
                    </button>
                  </div>
                </div>

                {/* Submission Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Field</label>
                    <select
                      value={diagField}
                      onChange={e => setDiagField(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    >
                      {farm.fields?.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.crop})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Crop Type & Variety</label>
                    <input
                      type="text"
                      value={diagCrop}
                      onChange={e => setDiagCrop(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Leaf Surface Photo</label>
                    <label className="border border-dashed border-slate-300 rounded-xl p-2.5 bg-slate-50 flex items-center justify-center space-x-2 text-slate-500 cursor-pointer hover:bg-slate-100 hover:border-emerald-500 transition">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-[11px] truncate max-w-[180px]">
                        {uploadedImageName || "Upload High-Res Leaf Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedImageName(file.name);
                            if (!diagSymptoms) {
                              setDiagSymptoms(`Leaf sample "${file.name}" uploaded. Scanning for foliar chlorosis and fungal spore colonies.`);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="md:col-span-3">
                    <label className="font-semibold text-slate-700 block mb-1">Visible Symptoms & Field Observations</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={diagSymptoms}
                        onChange={e => setDiagSymptoms(e.target.value)}
                        placeholder="E.g., Mottled chlorotic banding on lower leaves, no orange spore dust detected... (or click samples above)"
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDiagnose()}
                        disabled={diagLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {diagLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing Field...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Run AI Diagnosis</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* DIAGNOSTIC REPORT CARD */}
                {(activeDiagnosis || state.cropAnalyses?.[0]) && (
                  <div id="diagnostic-report-result" className="mt-6 pt-5 border-t border-slate-200 space-y-4">
                    {(() => {
                      const report = activeDiagnosis || state.cropAnalyses[0];
                      return (
                        <div className="bg-slate-50 rounded-2xl p-5 border-2 border-emerald-500/30 shadow-sm space-y-4 text-xs animate-in fade-in duration-300">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  report.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {report.severity}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900">{report.suspectedDiagnosis}</h4>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Analyzed for {report.crop} • Field: {report.fieldName} • {new Date(report.timestamp).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-emerald-700 font-extrabold text-base">
                                {(report.modelConfidence * 100).toFixed(0)}%
                              </span>
                              <div className="text-[10px] text-slate-400">Diagnostic Confidence</div>
                            </div>
                          </div>

                          {/* Differential Diagnosis Table */}
                          <div>
                            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2">
                              Differential Hypotheses & Agronomic Fit
                            </h5>
                            <div className="space-y-1.5">
                              {report.differentialDiagnosis?.map((d, idx) => (
                                <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800">{d.condition}</div>
                                    <div className="text-slate-500 text-[10px]">{d.agronomicFit}</div>
                                  </div>
                                  <span className="font-mono font-bold text-slate-700 shrink-0 ml-3">
                                    {(d.probability * 100).toFixed(0)}% prob
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Plan & Safe Guidance */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                              <h5 className="font-bold text-emerald-950 text-[11px] uppercase tracking-wider">
                                Verified Action Plan (ICAR / HAU Guideline)
                              </h5>
                              <ul className="space-y-1 text-emerald-900 text-[11px]">
                                {report.immediateActionPlan?.map((step, sIdx) => (
                                  <li key={sIdx}>{step}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                              <h5 className="font-bold text-amber-950 text-[11px] uppercase tracking-wider">
                                Safety & Long-Term Prevention
                              </h5>
                              <p className="text-amber-900 text-[11px] leading-relaxed">
                                {report.preventiveGuidelines}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: WEATHER SENTINEL */}
          {currentTab === 'weather' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                      <CloudSun className="w-5 h-5 text-amber-500" /> Weather Sentinel & Agro Forecast
                    </h3>
                    <p className="text-xs text-slate-500">
                      Station: Karnal, Haryana (Lat 29.68° N, Long 76.99° E) • Synced with IMD Agro-advisory
                    </p>
                  </div>
                  <button
                    onClick={() => handleSimulate('SUDDEN_WEATHER_STORM')}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition"
                  >
                    Simulate Squall / Rain Alert
                  </button>
                </div>

                {/* 5-day forecast grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {state.weather.forecast.map((day, i) => (
                    <div key={i} className={`p-4 rounded-xl border text-center space-y-2 ${
                      i === 0 ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <div className="text-xs font-bold text-slate-700">{day.date}</div>
                      <div className="text-xl font-black text-slate-800">{day.tempMax}° / {day.tempMin}°</div>
                      <div className="text-[11px] text-slate-600 font-medium">{day.condition}</div>
                      <div className="pt-2 border-t border-slate-200/60 text-[10px] space-y-0.5 text-slate-500">
                        <div>Rain: <strong>{day.rainMm} mm</strong></div>
                        <div>PoP: <strong>{day.pop}%</strong></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agro-weather task suitability matrix */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Weather Suitability Rules for Scheduled Operations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-bold text-slate-800">Foliar Chemical Spraying</div>
                      <p className="text-[10px] text-slate-500 mt-1">Requires 12h rain-free window & wind &lt; 15 km/h to prevent runoff into groundwater.</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-bold text-slate-800">Tubewell Micro-Irrigation</div>
                      <p className="text-[10px] text-slate-500 mt-1">Automatically deferred if expected rainfall &gt; 15mm within 24h to save power.</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-bold text-slate-800">Combine Harvesting</div>
                      <p className="text-[10px] text-slate-500 mt-1">Halted during RH &gt; 70% or rain threat to keep grain moisture below 12%.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SOIL & IRRIGATION */}
          {currentTab === 'soil' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" /> Precision Soil & Irrigation Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Continuous monitoring of soil moisture, pH, electrical conductivity, and tubewell quota allocation
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {farm.fields?.map(f => (
                    <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                        <span>{f.name}</span>
                        <span className="text-xs font-normal text-slate-500">{f.crop}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500">Moisture</div>
                          <div className="font-bold text-slate-800 text-sm">{f.soil.moisturePercent}%</div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500">Soil pH</div>
                          <div className="font-bold text-slate-800 text-sm">{f.soil.ph}</div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500">EC (Salinity)</div>
                          <div className="font-bold text-slate-800 text-sm">{f.soil.ec} dS/m</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                        <div>Method: <strong>{f.irrigation.method}</strong></div>
                        <div>Water Quota: <strong>{f.irrigation.waterQuotaLiters.toLocaleString()} Liters</strong></div>
                        <div>Last Irrigated: <strong>{f.irrigation.lastIrrigated}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RESOURCES & INVENTORY */}
          {currentTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-emerald-600" /> Farm Resources, Machinery & Inputs
                    </h3>
                    <p className="text-xs text-slate-500">Shared machinery allocation, worker schedules, and input warehouse inventory</p>
                  </div>
                  <button
                    onClick={() => handleSimulate('EQUIPMENT_BREAKDOWN')}
                    className="px-3.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs transition border border-red-200"
                  >
                    Simulate Drone Motor Fault
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {state.resources.map(res => (
                    <div key={res.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{res.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                          res.status === 'MAINTENANCE_REQUIRED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Type: {res.type} {res.model ? `• ${res.model}` : ''}
                      </div>
                      {res.quantity !== undefined && (
                        <div className="text-sm font-black text-slate-800">
                          {res.quantity} {res.unit} <span className="text-[10px] text-slate-400 font-normal">(Min: {res.thresholdMin})</span>
                        </div>
                      )}
                      {res.condition && (
                        <div className="text-[10px] text-slate-600 italic">
                          Condition: {res.condition}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: IOT SENSOR MESH */}
          {currentTab === 'iot' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600" /> IoT Telemetry & Field Probe Registry
                  </h3>
                  <p className="text-xs text-slate-500">Live telemetry from multi-depth soil probes, ultrasonic flow meters, and agro weather station</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {state.iotDevices.map(device => (
                    <div key={device.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{device.deviceType}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {device.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Field: {device.fieldName} • Battery: {device.batteryPercent}%</div>
                      <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-[11px] text-slate-700 border border-slate-200">
                        {device.lastTelemetry}
                      </div>
                      <div className="text-[10px] text-slate-400">Synced: {new Date(device.updatedAt).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MULTILINGUAL AI ASSISTANT */}
          {currentTab === 'assistant' && (
            <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">AgriMind Conversational Farm Advisor</h3>
                    <p className="text-[11px] text-slate-500">Supports Hindi and English with verified ICAR/HAU agricultural protocols</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Language Mode: <strong className="text-emerald-700">{lang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}</strong>
                </div>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xl p-3.5 rounded-2xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Suggested Quick Actions */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleSendChat(act)}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200 transition"
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AgriMind Assistant analyzing agronomic telemetry...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder={lang === 'hi' ? "फसल, सिंचाई, मौसम या कार्यों के बारे में पूछें..." : "Ask about wheat irrigation, mustard aphids, weather forecast..."}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={chatLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {currentTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" /> Continuous Autonomous Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">Immutable chronological history of all AI decisions, sensor alerts, and farmer approvals</p>
                </div>

                <div className="space-y-2 text-xs">
                  {state.auditLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{log.summary}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                            {log.actor}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FIELDS */}
          {currentTab === 'fields' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-600" /> Fields & Crop Portfolio
                  </h3>
                  <p className="text-xs text-slate-500">Detailed boundary, soil chemistry, and growth stage progression for Karnal farmstead</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {farm.fields?.map(f => (
                    <div key={f.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{f.name}</h4>
                          <p className="text-slate-500 text-[11px]">{f.areaAcres} Acres • {f.crop}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          f.healthStatus === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Health: {f.healthScore}/100
                        </span>
                      </div>

                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                        <div>Growth Stage: <strong>{f.growthStage}</strong></div>
                        <div>Sowing Date: <strong>{f.sowingDate}</strong></div>
                        <div>Estimated Harvest: <strong>{f.expectedHarvest}</strong></div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <span className="text-slate-500 block">Soil Moisture:</span>
                          <span className="font-bold text-slate-800 text-sm">{f.soil.moisturePercent}%</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <span className="text-slate-500 block">Soil pH:</span>
                          <span className="font-bold text-slate-800 text-sm">{f.soil.ph} (Loam)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCE */}
          {currentTab === 'finance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-emerald-600" /> Operational Finance & Input Economics
                  </h3>
                  <p className="text-xs text-slate-500">Expenditure tracking per field, seasonal budget constraints, and cost optimization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Allocated Season Budget</div>
                    <div className="text-xl font-black text-slate-800 mt-1">₹2,50,000</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Committed Expenditure</div>
                    <div className="text-xl font-black text-slate-800 mt-1">₹1,14,500</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Estimated Rabi Revenue</div>
                    <div className="text-xl font-black text-emerald-700 mt-1">₹6,80,000</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MARKET MANDI INTEL */}
          {currentTab === 'market' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" /> Regional Mandi Market Intelligence
                  </h3>
                  <p className="text-xs text-slate-500">Official AGMARKNET synced wholesale prices across Haryana Mandis</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {state.marketPrices.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                      <div className="font-bold text-slate-800 text-sm">{item.crop}</div>
                      <div className="text-slate-500 text-[11px]">{item.mandi} ({item.distanceKm} km away)</div>
                      <div className="text-xl font-black text-emerald-700">₹{item.modalPricePerQuintalInr} <span className="text-xs font-normal text-slate-500">/ Qtl</span></div>
                      <div className="text-[10px] text-slate-600">MSP: ₹{item.mspPerQuintalInr} • Trend: <strong className="text-slate-800">{item.priceTrend}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SIMULATION MODAL (HACKATHON DEMO DRIVER) */}
      {activeSimulationModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-800">
                  Interactive Farm Incident Simulator
                </h3>
              </div>
              <button
                onClick={() => setActiveSimulationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Trigger real-world agricultural shocks to demonstrate the <strong>Autonomous Operations Engine</strong> dynamically recalculating task suitability, resolving resource conflicts, and generating explainable approval proposals.
            </p>

            <div className="space-y-3">
              {/* Scenario 1 */}
              <div
                onClick={() => handleSimulate('SUDDEN_WEATHER_STORM')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 cursor-pointer transition text-xs space-y-1"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>1. Sudden Heavy Squall & Thunderstorm Alert (35mm Rain)</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">Weather</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Cancels foliar spray to prevent 100% chemical runoff loss. Defers tubewell pumping to substitute free rainwater.
                </p>
              </div>

              {/* Scenario 2 */}
              <div
                onClick={() => handleSimulate('EQUIPMENT_BREAKDOWN')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 cursor-pointer transition text-xs space-y-1"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>2. Autonomous Agri-Drone Motor Breakdown</span>
                  <span className="text-[10px] text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">Machinery</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Detects hardware ESC fault. Automatically allocates secondary knapsack mist blower and adjusts labor duration.
                </p>
              </div>

              {/* Scenario 3 */}
              <div
                onClick={() => handleSimulate('PEST_DISEASE_OUTBREAK')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition text-xs space-y-1"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>3. Mustard Aphid Economic Threshold (ETL) Exceeded</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">Pathology</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Preempts routine hand weeding to deploy urgent organic neem biocontrol with pollinator safety windows.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Deterministic Hackathon Simulation Mode • Changes persist to state
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

