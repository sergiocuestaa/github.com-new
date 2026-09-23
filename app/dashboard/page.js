'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Plus, Phone, MessageSquare, CheckCircle, 
  XCircle, Search, Bot, Globe, ChevronLeft, ChevronRight, Sparkles, 
  Settings, Trash2, Edit3, Activity, Zap, ArrowRight, ShieldCheck,
  Check, Play, Users, DollarSign
} from 'lucide-react';

// --- CUSTOM HOOK PARA LOCALSTORAGE (SSR Safe) ---
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}

export default function AutonomousCRM() {
  // --- ESTADOS PERSISTENTES ---
  const [lang, setLang] = useLocalStorage('crm_lang', 'ES');
  const [step, setStep] = useLocalStorage('crm_step', 'landing'); // 'landing', 'auth', 'crm'
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useLocalStorage('crm_biz', {
    name: 'Clínica Estética Cuesta', 
    phone: '+34 600 000 000',
    email: 'contacto@gocuesta.com', 
    currency: 'EUR', 
    hoursStart: '09:00', 
    hoursEnd: '18:00'
  });
  
  const [services, setServices] = useLocalStorage('crm_services', [
    { id: '1', name: 'Consulta Evaluación & Diagnóstico', price: '150', duration: '45' },
    { id: '2', name: 'Tratamiento Avanzado', price: '350', duration: '60' }
  ]);
  
  const [staff, setStaff] = useLocalStorage('crm_staff', [
    { id: '1', name: 'Dr. Principal' },
    { id: '2', name: 'Dra. Especialista' }
  ]);
  
  const [clients, setClients] = useLocalStorage('crm_clients', [
    { id: '1', name: 'Carlos Mendoza', phone: '+34 612 345 678', notes: 'Interesado en tratamiento completo' },
    { id: '2', name: 'Ana Sofía Rodríguez', phone: '+34 699 888 777', notes: 'Paciente VIP recurrente' }
  ]);
  
  const [appointments, setAppointments] = useLocalStorage('crm_appointments', []);
  const [automations, setAutomations] = useLocalStorage('crm_automations', {
    aiVoiceAgent: true, yieldManagement: true, whatsappReminders: true
  });

  // --- ESTADOS DE UI TEMPORALES ---
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, clients, automations, settings
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [toast, setToast] = useState('');

  // Formularios
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });
  const [newStaffMember, setNewStaffMember] = useState('');
  const [apptForm, setApptForm] = useState({
    clientName: '', clientPhone: '', serviceId: '', staffId: '', date: selectedDate, time: ''
  });

  // --- TRADUCCIONES (Enfoque High-Ticket / AI Startup) ---
  const t = {
    ES: {
      authTitle: "Plataforma de Operaciones Autónomas",
      authSubtitle: "Despliega tu IA de reservas y gestión en minutos. Diseñado para Clínicas y Med-Spas.",
      placeholderBiz: "Ej. Clínica Estética Avanzada",
      aiActive: "Agente IA En Línea",
      settings: "Ajustes",
      saveChanges: "Guardar Cambios",
      yieldManagement: "Yield Management (Relleno de Huecos)",
      yieldDesc: "La IA detecta cancelaciones y ofrece el horario con tarifa dinámica a clientes recurrentes.",
      aiVoice: "Agente Telefónico Autónomo",
      aiVoiceDesc: "Contesta múltiples llamadas simultáneas, negocia horarios y cierra citas directo en el calendario.",
      duration: "Duración",
      staff: "Especialista"
    },
    EN: {
      authTitle: "Autonomous Operations Platform",
      authSubtitle: "Deploy your AI booking & management engine in minutes. Built for Clinics & Med-Spas.",
      placeholderBiz: "e.g., Advanced Aesthetic Clinic",
      aiActive: "AI Agent Online",
      settings: "Settings",
      saveChanges: "Save Changes",
      yieldManagement: "Yield Management (Gap Filling)",
      yieldDesc: "AI detects cancellations and offers the slot with dynamic pricing to recurring clients.",
      aiVoice: "Autonomous Voice Agent",
      aiVoiceDesc: "Handles multiple concurrent calls, negotiates times, and closes bookings into the calendar.",
      duration: "Duration",
      staff: "Specialist"
    }
  }[lang];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // --- MOTOR DE DISPONIBILIDAD (Bloqueo por Staff y Duración) ---
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getAvailableSlots = (date, staffId, serviceId) => {
    if (!date || !staffId || !serviceId) return [];
    const service = services.find(s => s.id === serviceId);
    if (!service) return [];
    
    const durationMins = parseInt(service.duration) || 30;
    const startMins = timeToMinutes(businessInfo.hoursStart);
    const endMins = timeToMinutes(businessInfo.hoursEnd);
    
    // Obtener citas activas de ESTE especialista en ESTE día
    const activeAppts = appointments.filter(a => 
      a.date === date && 
      a.staffId === staffId && 
      !['cancelled', 'no_show'].includes(a.status) &&
      a.id !== editingAppt?.id // Excluir la cita actual si estamos editando
    );

    const slots = [];
    // Generar intervalos de 30 mins
    for (let time = startMins; time + durationMins <= endMins; time += 30) {
      const slotStart = time;
      const slotEnd = time + durationMins;
      
      // Verificar solapamiento
      const isOverlapping = activeAppts.some(appt => {
        const apptSvc = services.find(s => s.id === appt.serviceId);
        const apptDuration = apptSvc ? parseInt(apptSvc.duration) : 30;
        const apptStart = timeToMinutes(appt.time);
        const apptEnd = apptStart + apptDuration;
        return (slotStart < apptEnd && slotEnd > apptStart); // Lógica de intersección
      });

      if (!isOverlapping) slots.push(minutesToTime(time));
    }
    return slots;
  };

  // --- MANEJADORES DE DATOS ---
  const handleSaveAppt = (e) => {
    e.preventDefault();
    const service = services.find(s => s.id === apptForm.serviceId);
    
    if (editingAppt) {
      // Editar
      setAppointments(appointments.map(a => a.id === editingAppt.id ? {
        ...a, ...apptForm, price: parseFloat(service?.price || 0)
      } : a));
      showToast("Cita actualizada exitosamente. Disponibilidad recalculada.");
    } else {
      // Crear nuevo
      const newApptObj = {
        id: Date.now().toString(),
        ...apptForm,
        price: parseFloat(service?.price || 0),
        status: 'pending'
      };
      setAppointments([...appointments, newApptObj]);
      
      // Auto-Guardado de Cliente
      const clientExists = clients.some(c => c.name.toLowerCase() === apptForm.clientName.toLowerCase());
      if (!clientExists && apptForm.clientName) {
        setClients([...clients, { id: Date.now().toString(), name: apptForm.clientName, phone: apptForm.clientPhone, notes: '' }]);
      }
      showToast("Cita agendada. Bloqueo de horario activado.");
    }
    closeApptModal();
  };

  const handleDeleteAppt = (id) => {
    if (window.confirm("¿Eliminar esta cita? El horario se liberará inmediatamente.")) {
      setAppointments(appointments.filter(a => a.id !== id));
      showToast("Cita eliminada. Horario liberado.");
    }
  };

  const closeApptModal = () => {
    setIsApptModalOpen(false);
    setEditingAppt(null);
    setApptForm({ clientName: '', clientPhone: '', serviceId: '', staffId: '', date: selectedDate, time: '' });
  };

  const openEditAppt = (appt) => {
    setEditingAppt(appt);
    setApptForm({
      clientName: appt.clientName, clientPhone: appt.clientPhone,
      serviceId: appt.serviceId, staffId: appt.staffId,
      date: appt.date, time: appt.time
    });
    setIsApptModalOpen(true);
  };

  // --- COMPONENTES UI AUXILIARES ---
  const calculateRevenue = () => appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0);
  const activeSlotsToday = appointments.filter(a => a.date === selectedDate && !['cancelled', 'no_show'].includes(a.status));

  // ==========================================
  // RENDER 1: LANDING PAGE (Misma Paleta Clara)
  // ==========================================
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
        {/* HEADER LANDING */}
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6B8F71] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">GoCuesta</span>
              <span className="ml-2 text-[10px] bg-[#6B8F71]/10 text-[#6B8F71] font-extrabold px-2 py-0.5 rounded-full uppercase">SaaS IA</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('crm')} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-all">
              Probar Demo CRM
            </button>
            <button onClick={() => setStep('auth')} className="px-5 py-2.5 bg-[#6B8F71] text-white font-bold rounded-xl text-xs hover:bg-[#58775d] transition-all shadow-md flex items-center gap-2">
              Desplegar Entorno <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </header>

        {/* HERO LANDING */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6B8F71]/10 text-[#6B8F71] text-xs font-bold mb-6">
            <Sparkles className="w-4 h-4" /> Plataforma de Operaciones Autónomas para Clínicas High-Ticket
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl tracking-tight">
            Gestión de citas y reservas impulsada por <span className="text-[#6B8F71]">Agentes Telefónicos IA</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-gray-500 max-w-2xl leading-relaxed">
            Optimiza la agenda de tu clínica, responde llamadas 24/7 de forma autónoma y recupera cancelaciones mediante automatización inteligente.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button onClick={() => setStep('auth')} className="px-8 py-4 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-2xl text-sm transition-all shadow-lg flex items-center gap-2">
              Comenzar Ahora <ArrowRight className="w-5 h-5"/>
            </button>
            <button onClick={() => setStep('crm')} className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl text-sm hover:bg-gray-50 transition-all shadow-sm">
              Ver CRM en Vivo
            </button>
          </div>

          {/* TARJETAS DE CARACTERÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left">
            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#6B8F71]/10 text-[#6B8F71] rounded-2xl flex items-center justify-center font-bold">
                <Bot className="w-6 h-6"/>
              </div>
              <h3 className="font-bold text-gray-900 text-base">Agente de Voz Inteligente</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Atiende llamadas en tiempo real, aclara dudas de tratamientos y agenda citas sin intervención de recepción.</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#6B8F71]/10 text-[#6B8F71] rounded-2xl flex items-center justify-center font-bold">
                <Zap className="w-6 h-6"/>
              </div>
              <h3 className="font-bold text-gray-900 text-base">Yield Management</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Detecta cancelaciones al instante y reasigna los huecos libres ofreciendo tarifas dinámicas a clientes VIP.</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#6B8F71]/10 text-[#6B8F71] rounded-2xl flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6"/>
              </div>
              <h3 className="font-bold text-gray-900 text-base">Bloqueo de Disponibilidad</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Calcula intervalos exactos según el especialista y la duración de cada procedimiento para evitar solapamientos.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: AUTH / ONBOARDING
  // ==========================================
  if (step === 'auth' || step === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <button onClick={() => setStep('landing')} className="mb-6 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
          ← Volver a la Landing Page
        </button>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl space-y-6 border border-gray-100">
          <div className="text-center">
            <Activity className="w-12 h-12 text-[#6B8F71] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">{t.authTitle}</h1>
            <p className="text-sm text-gray-500 mt-2">{t.authSubtitle}</p>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder={t.placeholderBiz} 
              className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-[#6B8F71] text-sm" 
              value={businessInfo.name} 
              onChange={e => setBusinessInfo({...businessInfo, name: e.target.value})} 
            />
            <button 
              onClick={() => { 
                if(!businessInfo.name) return; 
                if(services.length === 0) setServices([{id: '1', name: 'Consulta Evaluación', price: '150', duration: '45'}]);
                if(staff.length === 0) setStaff([{id: '1', name: 'Dr. Principal'}]);
                setStep('crm'); 
              }} 
              className="w-full py-3.5 bg-[#6B8F71] text-white font-bold rounded-xl hover:bg-[#58775d] transition-all shadow-md"
            >
              Desplegar Entorno CRM →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: CRM COMPLETO
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
            {businessInfo.name.charAt(0) || 'S'}
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{businessInfo.name}</h1>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B8F71] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#6B8F71] animate-pulse"></span> {t.aiActive}
            </span>
          </div>
        </div>

        <nav className="flex bg-gray-100 p-1 rounded-2xl">
          {[
            { id: 'appointments', label: 'Agenda' },
            { id: 'clients', label: 'Clientes' },
            { id: 'automations', label: 'Automatizaciones' },
            { id: 'settings', label: t.settings }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setStep('landing')} className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
          ← Landing
        </button>
      </header>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2 border border-gray-700 animate-fade-in-down">
          <Sparkles className="w-4 h-4 text-[#6B8F71]" /> {toast}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- TAB: AGENDA --- */}
        {activeTab === 'appointments' && (
          <>
            <div className="lg:col-span-4 space-y-6">
              {/* Calendario Básico Simplificado */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Seleccionar Fecha</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="w-full p-3 rounded-xl border text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#6B8F71]" 
                />
              </div>

              {/* FACTURACIÓN */}
              <div className="bg-gradient-to-br from-[#6B8F71] to-gray-900 p-6 rounded-3xl text-white shadow-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/70 tracking-widest">Facturación Total</span>
                <div className="text-3xl font-extrabold">{calculateRevenue().toLocaleString()} {businessInfo.currency}</div>
                <p className="text-[11px] text-white/60">Suma total de citas marcadas como completadas.</p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl border shadow-sm">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6B8F71]"/> Agenda • {selectedDate}
                </h2>
                <button 
                  onClick={() => setIsApptModalOpen(true)} 
                  className="px-4 py-2 bg-[#6B8F71] hover:bg-[#58775d] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  + Nueva Cita
                </button>
              </div>

              {activeSlotsToday.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-3xl border border-dashed">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Agenda libre para este día.</p>
                  <p className="text-xs text-gray-400 mt-1">La IA buscará rellenar huecos automáticamente.</p>
                </div>
              ) : (
                activeSlotsToday.map(appt => {
                  const service = services.find(s => s.id === appt.serviceId);
                  const staffMember = staff.find(s => s.id === appt.staffId);
                  const isCompleted = appt.status === 'completed';

                  return (
                    <div key={appt.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between group">
                      <div className="flex gap-4 items-center">
                        <div className="bg-gray-50 border px-3 py-2 rounded-xl text-center">
                          <span className="text-sm font-bold text-[#6B8F71]">{appt.time}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{appt.clientName}</h4>
                          <span className="text-xs text-gray-500">
                            {service?.name || 'Servicio'} ({service?.duration || '30'}m) • {staffMember?.name || 'Especialista'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        {isCompleted ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                            Completada
                          </span>
                        ) : (
                          <button 
                            onClick={() => setAppointments(appointments.map(a => a.id === appt.id ? {...a, status: 'completed'} : a))} 
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" 
                            title="Marcar Completada"
                          >
                            <CheckCircle className="w-4 h-4"/>
                          </button>
                        )}
                        <button onClick={() => openEditAppt(appt)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"><Edit3 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteAppt(appt.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* --- TAB: CLIENTES --- */}
        {activeTab === 'clients' && (
          <div className="lg:col-span-12 space-y-4">
            <div className="bg-white p-4 rounded-3xl border shadow-sm flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-sm">Directorio de Pacientes</h2>
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={clientSearchTerm}
                onChange={e => setClientSearchTerm(e.target.value)}
                className="p-2 rounded-xl border text-xs w-64"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())).map(c => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Cliente</span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#6B8F71]"/> {c.phone}</p>
                  {c.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mt-2">{c.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: AUTOMATIZACIONES IA --- */}
        {activeTab === 'automations' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 bg-[#F8F9FA] rounded-2xl border flex gap-4">
                <div className="p-3 bg-gray-900 text-white rounded-xl h-fit"><Bot className="w-6 h-6"/></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-gray-900">{t.aiVoice}</h4>
                    <input 
                      type="checkbox" 
                      checked={automations.aiVoiceAgent} 
                      onChange={e => setAutomations({...automations, aiVoiceAgent: e.target.checked})} 
                      className="accent-[#6B8F71] w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.aiVoiceDesc}</p>
                </div>
              </div>

              <div className="p-5 bg-[#F8F9FA] rounded-2xl border flex gap-4">
                <div className="p-3 bg-[#6B8F71] text-white rounded-xl h-fit"><Zap className="w-6 h-6"/></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-gray-900">{t.yieldManagement}</h4>
                    <input 
                      type="checkbox" 
                      checked={automations.yieldManagement} 
                      onChange={e => setAutomations({...automations, yieldManagement: e.target.checked})} 
                      className="accent-[#6B8F71] w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.yieldDesc}</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB: SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900"><Settings className="w-5 h-5 text-[#6B8F71]"/> Configuración del SaaS</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info del Negocio */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Información Base</h3>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Nombre</label>
                    <input type="text" value={businessInfo.name} onChange={e => setBusinessInfo({...businessInfo, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="Nombre" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Horario Inicio</label>
                      <input type="time" value={businessInfo.hoursStart} onChange={e => setBusinessInfo({...businessInfo, hoursStart: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Horario Cierre</label>
                      <input type="time" value={businessInfo.hoursEnd} onChange={e => setBusinessInfo({...businessInfo, hoursEnd: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Servicios High-Ticket</h3>
                  {services.map(s => (
                    <div key={s.id} className="flex gap-2 items-center">
                      <input type="text" value={s.name} onChange={e => setServices(services.map(ser => ser.id === s.id ? {...ser, name: e.target.value} : ser))} className="flex-1 p-2 border rounded-lg text-xs" />
                      <input type="number" value={s.price} onChange={e => setServices(services.map(ser => ser.id === s.id ? {...ser, price: e.target.value} : ser))} className="w-20 p-2 border rounded-lg text-xs text-center" />
                      <button onClick={() => setServices(services.filter(ser => ser.id !== s.id))} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <button onClick={() => setServices([...services, {id: Date.now().toString(), name: 'Nuevo Servicio', price: '100', duration: '60'}])} className="text-xs text-[#6B8F71] font-bold">+ Agregar Servicio</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CITA / BLOQUEO DINÁMICO */}
      {isApptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-gray-900">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm">{editingAppt ? 'Editar Cita' : 'Agendar & Bloquear Horario'}</h3>
              <button onClick={closeApptModal} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSaveAppt} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-500">Cliente / Paciente</label>
                <input 
                  type="text" 
                  required 
                  value={apptForm.clientName} 
                  onChange={e => setApptForm({...apptForm, clientName: e.target.value})} 
                  className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#6B8F71] mt-1" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500">Servicio</label>
                  <select 
                    required 
                    value={apptForm.serviceId} 
                    onChange={e => setApptForm({...apptForm, serviceId: e.target.value, time: ''})} 
                    className="w-full p-2.5 border rounded-xl text-sm mt-1"
                  >
                    <option value="">Seleccionar...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500">Especialista</label>
                  <select 
                    required 
                    value={apptForm.staffId} 
                    onChange={e => setApptForm({...apptForm, staffId: e.target.value, time: ''})} 
                    className="w-full p-2.5 border rounded-xl text-sm mt-1"
                  >
                    <option value="">Seleccionar...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">
                  Horarios Disponibles (Autofiltro)
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {getAvailableSlots(apptForm.date, apptForm.staffId, apptForm.serviceId).length > 0 ? (
                    getAvailableSlots(apptForm.date, apptForm.staffId, apptForm.serviceId).map(time => (
                      <button 
                        type="button" 
                        key={time} 
                        onClick={() => setApptForm({...apptForm, time})} 
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          apptForm.time === time 
                            ? 'bg-[#6B8F71] text-white border-[#6B8F71]' 
                            : 'hover:border-[#6B8F71] text-gray-700 bg-white'
                        }`}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <span className="col-span-4 text-xs text-gray-400 italic p-2 text-center">
                      Selecciona un servicio y especialista para calcular disponibilidad.
                    </span>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!apptForm.time} 
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all mt-4"
              >
                {editingAppt ? 'Actualizar Cita' : 'Confirmar & Bloquear'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}