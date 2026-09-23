'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Plus, Phone, MessageSquare, CheckCircle, 
  XCircle, Search, Bot, Globe, ChevronLeft, ChevronRight, Sparkles, 
  Settings, Trash2, Edit3, Activity, Zap, ArrowRight, ShieldCheck,
  Check, Play, Users, DollarSign, Key, Lock
} from 'lucide-react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setValue(JSON.parse(item));
    } catch (error) { console.error(error); }
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) { console.error(error); }
  }, [key, value]);

  return [value, setValue];
}

export default function GoCuestaApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- ESTADOS PRINCIPALES DE NAVEGACIÓN ---
  const [lang, setLang] = useLocalStorage('goc_lang', 'ES');
  const [step, setStep] = useLocalStorage('goc_step', 'landing'); // 'landing', 'pricing', 'onboarding', 'dashboard'
  const [onboardingSubStep, setOnboardingSubStep] = useLocalStorage('goc_substep', 1); // 1: Registro, 2: Código, 3: Moneda/Horario, 4: Servicios

  // --- DATOS DEL NEGOCIO Y CONFIGURACIÓN ---
  const [businessInfo, setBusinessInfo] = useLocalStorage('goc_biz', {
    name: '', email: '', currency: 'EUR', hoursStart: '09:00', hoursEnd: '19:00'
  });
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  
  const [services, setServices] = useLocalStorage('goc_services', []);
  const [staff, setStaff] = useLocalStorage('goc_staff', [{ id: '1', name: 'Especialista Principal' }]);
  const [clients, setClients] = useLocalStorage('goc_clients', [
    { id: '1', name: 'Carlos Mendoza', phone: '+34 612 345 678', notes: 'Paciente frecuente' }
  ]);
  const [appointments, setAppointments] = useLocalStorage('goc_appointments', []);
  const [automations, setAutomations] = useLocalStorage('goc_automations', {
    aiVoiceAgent: true, yieldManagement: true
  });

  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({ clientName: '', clientPhone: '', serviceId: '', staffId: '', date: selectedDate, time: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  if (!mounted) return <div className="min-h-screen bg-[#0B0F17]" />;

  // ==========================================
  // 1. LANDING PAGE
  // ==========================================
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-[#6B8F71] selection:text-white">
        <header className="bg-[#111622]/80 backdrop-blur-md border-b border-slate-800/85 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6B8F71] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-[#6B8F71]/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">GoCuesta</span>
              <span className="ml-2 text-[10px] bg-[#6B8F71]/20 text-[#6B8F71] font-extrabold px-2 py-0.5 rounded-full uppercase border border-[#6B8F71]/30">IA 🚀</span>
            </div>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById('precios');
              if(el) el.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="px-5 py-2.5 bg-[#6B8F71] text-white font-bold rounded-xl text-xs hover:bg-[#58775d] transition-all shadow-md shadow-[#6B8F71]/20 flex items-center gap-2"
          >
            Empezar <ArrowRight className="w-4 h-4"/>
          </button>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6B8F71]/15 border border-[#6B8F71]/30 text-[#88B08E] text-xs font-bold mb-6">
            <Sparkles className="w-4 h-4 text-[#6B8F71]" /> Agentes Telefónicos y Automatización Inteligente 🤖✨
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight max-w-4xl tracking-tight">
            Automatiza las reservas de tu negocio con <span className="text-[#6B8F71]">IA Autónoma</span> 📞⚡
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Responde llamadas 24/7, agendan en tu calendario en tiempo real y llena tus espacios libres automáticamente sin esfuerzo manual.
          </p>

          <div className="mt-8">
            <button 
              onClick={() => {
                const el = document.getElementById('precios');
                if(el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="px-8 py-4 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-[#6B8F71]/20 flex items-center gap-2 mx-auto"
            >
              Empezar Ahora 🚀 <ArrowRight className="w-5 h-5"/>
            </button>
          </div>

          {/* SECCIÓN DE PRECIOS */}
          <div id="precios" className="w-full mt-32 pt-10">
            <div className="text-center mb-12">
              <span className="text-[11px] font-bold text-[#6B8F71] uppercase tracking-widest">Planes Disponibles 💰</span>
              <h2 className="text-3xl font-extrabold text-white mt-2">Elige tu paquete y comienza el despliegue</h2>
              <p className="text-xs text-slate-400 mt-2">Selecciona un plan para iniciar tu proceso de configuración guiada.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {/* Starter */}
              <div className="p-8 bg-[#131822] rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter 🌱</span>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-extrabold text-white">29€</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Para pequeños negocios locales o independientes.</p>
                  <ul className="space-y-3 text-xs text-slate-300 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> 1 Agente de Voz IA</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Hasta 100 citas/mes</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Calendario dinámico</li>
                  </ul>
                </div>
                <button 
                  onClick={() => { setStep('onboarding'); setOnboardingSubStep(1); }} 
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Seleccionar Starter
                </button>
              </div>

              {/* Business Pro */}
              <div className="p-8 bg-[#161E2E] rounded-3xl border-2 border-[#6B8F71] flex flex-col justify-between shadow-xl shadow-[#6B8F71]/10 relative scale-105">
                <div className="absolute -top-3.5 right-6 bg-[#6B8F71] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  POPULAR 🔥
                </div>
                <div>
                  <span className="text-xs font-bold text-[#88B08E] uppercase tracking-wider">Business Pro ⚡</span>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-extrabold text-white">49€</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Para clínicas y negocios con alto flujo de clientes.</p>
                  <ul className="space-y-3 text-xs text-slate-200 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Agente Telefónico 24/7</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Yield Management automático</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Múltiples Especialistas</li>
                  </ul>
                </div>
                <button 
                  onClick={() => { setStep('onboarding'); setOnboardingSubStep(1); }} 
                  className="w-full py-3.5 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Seleccionar Pro 🚀
                </button>
              </div>

              {/* Elite */}
              <div className="p-8 bg-[#131822] rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Elite / Multi-Sede 👑</span>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-extrabold text-white">59€</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Para cadenas y franquicias con múltiples líneas.</p>
                  <ul className="space-y-3 text-xs text-slate-300 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Todo incluido en Pro</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Multi-Sede & Multi-Línea</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#6B8F71]"/> Soporte Prioritario 24/7</li>
                  </ul>
                </div>
                <button 
                  onClick={() => { setStep('onboarding'); setOnboardingSubStep(1); }} 
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Seleccionar Elite
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // 2. ONBOARDING SECUENCIAL (PASOS 1 AL 4)
  // ==========================================
  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col items-center justify-center p-4">
        <button 
          onClick={() => {
            if (onboardingSubStep > 1) setOnboardingSubStep(onboardingSubStep - 1);
            else setStep('landing');
          }} 
          className="mb-6 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Volver
        </button>

        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-6">
          
          {/* PASO 1: NOMBRE Y CORREO[cite: 5] */}
          {onboardingSubStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Bot className="w-6 h-6 text-[#6B8F71]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bienvenido a tu CRM</h2>
                <p className="text-xs text-gray-500 mt-1">Configura tu cuenta en menos de 2 minutos[cite: 5].</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Nombre del negocio</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Barbería El Buen Corte[cite: 5]" 
                    value={businessInfo.name} 
                    onChange={e => setBusinessInfo({...businessInfo, name: e.target.value})}
                    className="w-full p-3 rounded-xl border text-xs bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    placeholder="tu@negocio.com[cite: 5]" 
                    value={businessInfo.email} 
                    onChange={e => setBusinessInfo({...businessInfo, email: e.target.value})}
                    className="w-full p-3 rounded-xl border text-xs bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (!businessInfo.name || !businessInfo.email) {
                      showToast("Por favor completa los campos.");
                      return;
                    }
                    setOnboardingSubStep(2);
                  }}
                  className="w-full py-3.5 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-xl text-xs transition-all shadow-md mt-2"
                >
                  Enviar código[cite: 5]
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: VERIFICAR CÓDIGO[cite: 6] */}
          {onboardingSubStep === 2 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Key className="w-6 h-6 text-[#6B8F71]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Verifica tu correo[cite: 6]</h2>
              <p className="text-xs text-gray-500">Escribe el código de 6 dígitos que enviamos a <strong className="text-gray-800">{businessInfo.email || 'tu correo'}</strong>[cite: 6].</p>

              <div className="flex justify-center gap-2 my-4">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <input 
                    key={idx}
                    type="text" 
                    maxLength={1}
                    value={verificationCode[idx]}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newCode = [...verificationCode];
                      newCode[idx] = val;
                      setVerificationCode(newCode);
                    }}
                    className="w-10 h-12 text-center text-lg font-bold border rounded-xl bg-gray-50 focus:border-[#6B8F71] focus:outline-none"
                  />
                ))}
              </div>

              <button 
                onClick={() => setOnboardingSubStep(3)}
                className="w-full py-3.5 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Verificar y continuar[cite: 6]
              </button>
              <button onClick={() => showToast("Código reenviado.")} className="text-[11px] text-gray-400 hover:text-gray-700 block mx-auto">
                Reenviar código[cite: 6]
              </button>
            </div>
          )}

          {/* PASO 3: MONEDA Y HORARIO[cite: 7] */}
          {onboardingSubStep === 3 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs text-gray-400 font-semibold">
                <span>Paso 1 de 3[cite: 7]</span>
                <span>Configuración inicial</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Moneda y horario[cite: 7]</h2>
                <p className="text-xs text-gray-500 mt-1">Define cómo se verán tus precios y en qué horario atiendes[cite: 7].</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-2">Moneda[cite: 7]</label>
                  <div className="flex gap-2">
                    {['MXN $', 'USD $', 'EUR €'].map(curr => {
                      const code = curr.split(' ')[0];
                      const isSelected = businessInfo.currency === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setBusinessInfo({...businessInfo, currency: code})}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            isSelected ? 'bg-[#6B8F71] text-white border-[#6B8F71] shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {curr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-2">Horario de atención[cite: 7]</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block mb-1">Abre[cite: 7]</span>
                      <input 
                        type="time" 
                        value={businessInfo.hoursStart}
                        onChange={e => setBusinessInfo({...businessInfo, hoursStart: e.target.value})}
                        className="w-full p-2.5 rounded-xl border text-xs bg-gray-50 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block mb-1">Cierra[cite: 7]</span>
                      <input 
                        type="time" 
                        value={businessInfo.hoursEnd}
                        onChange={e => setBusinessInfo({...businessInfo, hoursEnd: e.target.value})}
                        className="w-full p-2.5 rounded-xl border text-xs bg-gray-50 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setOnboardingSubStep(4)}
                className="w-full py-3.5 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Continuar[cite: 7]
              </button>
            </div>
          )}

          {/* PASO 4: SERVICIOS Y PRECIOS[cite: 8] */}
          {onboardingSubStep === 4 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-gray-400 font-semibold">
                <span>Paso 2 de 3[cite: 8]</span>
                <span>Catálogo</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Servicios y precios[cite: 8]</h2>
                <p className="text-xs text-gray-500 mt-1">Agrega los servicios que ofreces, con su precio y duración[cite: 8].</p>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border">
                <input 
                  type="text" 
                  placeholder="Ej. Corte de cabello[cite: 8]"
                  value={newService.name}
                  onChange={e => setNewService({...newService, name: e.target.value})}
                  className="w-full p-2.5 rounded-xl border text-xs bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    placeholder="Precio ($)[cite: 8]"
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: e.target.value})}
                    className="w-full p-2.5 rounded-xl border text-xs bg-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Duración (min)[cite: 8]"
                    value={newService.duration}
                    onChange={e => setNewService({...newService, duration: e.target.value})}
                    className="w-full p-2.5 rounded-xl border text-xs bg-white"
                  />
                </div>
                <button 
                  onClick={() => {
                    if(!newService.name || !newService.price) return;
                    setServices([...services, { id: Date.now().toString(), ...newService }]);
                    setNewService({ name: '', price: '', duration: '' });
                    showToast("Servicio agregado.");
                  }}
                  className="w-full py-2 bg-gray-900 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  + + Agregar servicio[cite: 8]
                </button>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {services.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-2">Aún no agregaste servicios[cite: 8].</p>
                ) : (
                  services.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border text-xs">
                      <span className="font-bold">{s.name}</span>
                      <span className="text-gray-500">{s.price} {businessInfo.currency} ({s.duration}m)</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setOnboardingSubStep(3)}
                  className="flex-1 py-3 border text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-50"
                >
                  Atrás[cite: 8]
                </button>
                <button 
                  onClick={() => {
                    if(services.length === 0) {
                      showToast("Agrega al menos un servicio para continuar.");
                      return;
                    }
                    setStep('dashboard'); // FINALIZA ONBOARDING Y MANDA AL DASHBOARD
                  }}
                  className="flex-1 py-3 bg-[#6B8F71] hover:bg-[#58775d] text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Continuar[cite: 8]
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // 3. DASHBOARD CRM (POST-ONBOARDING)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-lg">
            {businessInfo.name ? businessInfo.name.charAt(0) : 'G'}
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{businessInfo.name || 'Mi Negocio'}</h1>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B8F71] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#6B8F71] animate-pulse"></span> Agente IA En Línea
            </span>
          </div>
        </div>

        <nav className="flex bg-gray-100 p-1 rounded-2xl">
          {[
            { id: 'appointments', label: 'Agenda' },
            { id: 'clients', label: 'Clientes' },
            { id: 'automations', label: 'Automatizaciones' },
            { id: 'settings', label: 'Ajustes' }
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

        <button 
          onClick={() => { setStep('landing'); setOnboardingSubStep(1); }} 
          className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
        >
          Cerrar Sesión 🚪
        </button>
      </header>

      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2 border border-gray-700">
          <Sparkles className="w-4 h-4 text-[#6B8F71]" /> {toast}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeTab === 'appointments' && (
          <>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Seleccionar Fecha</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="w-full p-3 rounded-xl border text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#6B8F71]" 
                />
              </div>

              <div className="bg-gradient-to-br from-[#6B8F71] to-gray-900 p-6 rounded-3xl text-white shadow-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/70 tracking-widest">Facturación Total</span>
                <div className="text-3xl font-extrabold">
                  {appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0).toLocaleString()} {businessInfo.currency}
                </div>
                <p className="text-[11px] text-white/60">Citas completadas.</p>
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

              {appointments.filter(a => a.date === selectedDate).length === 0 ? (
                <div className="text-center p-10 bg-white rounded-3xl border border-dashed">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">No hay citas para esta fecha.</p>
                  <p className="text-xs text-gray-400 mt-1">La IA gestionará automáticamente las reservas entrantes.</p>
                </div>
              ) : (
                appointments.filter(a => a.date === selectedDate).map(appt => {
                  const svc = services.find(s => s.id === appt.serviceId);
                  return (
                    <div key={appt.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="bg-gray-50 border px-3 py-2 rounded-xl text-center">
                          <span className="text-sm font-bold text-[#6B8F71]">{appt.time}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{appt.clientName}</h4>
                          <span className="text-xs text-gray-500">{svc?.name || 'Servicio'} • {appt.clientPhone}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setAppointments(appointments.map(a => a.id === appt.id ? {...a, status: 'completed'} : a))} 
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                        >
                          <CheckCircle className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={() => setAppointments(appointments.filter(a => a.id !== appt.id))} 
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'clients' && (
          <div className="lg:col-span-12 space-y-4">
            <div className="bg-white p-4 rounded-3xl border shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm">Directorio de Clientes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clients.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
                  <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#6B8F71]"/> {c.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'automations' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-[#F8F9FA] rounded-2xl border flex gap-4">
                <div className="p-3 bg-gray-900 text-white rounded-xl h-fit"><Bot className="w-6 h-6"/></div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900">Agente Telefónico IA 📞</h4>
                  <p className="text-xs text-gray-500 mt-1">Responde llamadas y agenda de forma automática en tu calendario.</p>
                </div>
              </div>
              <div className="p-5 bg-[#F8F9FA] rounded-2xl border flex gap-4">
                <div className="p-3 bg-[#6B8F71] text-white rounded-xl h-fit"><Zap className="w-6 h-6"/></div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900">Yield Management (Relleno de Huecos) ⚡</h4>
                  <p className="text-xs text-gray-500 mt-1">Llena cancelaciones ofreciendo horarios a clientes recurrentes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="lg:col-span-12 bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 text-sm">Ajustes del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nombre del Negocio</label>
                <input 
                  type="text" 
                  value={businessInfo.name} 
                  onChange={e => setBusinessInfo({...businessInfo, name: e.target.value})}
                  className="w-full p-2.5 rounded-xl border text-xs mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL NUEVA CITA */}
      {isApptModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-base">Agendar Cita Manual</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const svc = services.find(s => s.id === apptForm.serviceId);
              const newAppt = {
                id: Date.now().toString(),
                ...apptForm,
                price: parseFloat(svc?.price || 0),
                status: 'pending'
              };
              setAppointments([...appointments, newAppt]);
              setIsApptModalOpen(false);
              setApptForm({ clientName: '', clientPhone: '', serviceId: '', staffId: '', date: selectedDate, time: '' });
              showToast("Cita agendada con éxito.");
            }} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nombre del Cliente</label>
                <input 
                  type="text" required 
                  value={apptForm.clientName} 
                  onChange={e => setApptForm({...apptForm, clientName: e.target.value})}
                  className="w-full p-2.5 rounded-xl border text-xs" 
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Teléfono</label>
                <input 
                  type="text" required 
                  value={apptForm.clientPhone} 
                  onChange={e => setApptForm({...apptForm, clientPhone: e.target.value})}
                  className="w-full p-2.5 rounded-xl border text-xs" 
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Servicio</label>
                <select 
                  value={apptForm.serviceId} 
                  onChange={e => setApptForm({...apptForm, serviceId: e.target.value})}
                  className="w-full p-2.5 rounded-xl border text-xs" required
                >
                  <option value="">Selecciona servicio...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} {businessInfo.currency})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Fecha</label>
                  <input 
                    type="date" 
                    value={apptForm.date} 
                    onChange={e => setApptForm({...apptForm, date: e.target.value})}
                    className="w-full p-2.5 rounded-xl border text-xs" required 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Hora</label>
                  <input 
                    type="time" 
                    value={apptForm.time} 
                    onChange={e => setApptForm({...apptForm, time: e.target.value})}
                    className="w-full p-2.5 rounded-xl border text-xs" required 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsApptModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#6B8F71] text-white text-xs font-bold rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}