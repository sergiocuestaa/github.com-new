'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('citas');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  // Datos simulados
  const [services, setServices] = useState([
    { id: 1, name: 'core', price: '9', duration: '30' }
  ]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  const [staff, setStaff] = useState(['ana', 'pail', 'mmmm']);
  const [newStaffName, setNewStaffName] = useState('');

  const addService = () => {
    if (newServiceName && newServicePrice) {
      setServices([...services, { id: Date.now(), name: newServiceName, price: newServicePrice, duration: newServiceDuration }]);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('30');
    }
  };

  const addStaff = () => {
    if (newStaffName.trim()) {
      setStaff([...staff, newStaffName.trim()]);
      setNewStaffName('');
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16">
      
      {/* 1. BARRA SUPERIOR (NAVBAR EXACTA A TU CAPTURA) */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Negocio y Estado IA */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5b7b66] text-white flex items-center justify-center font-bold text-sm">
              P
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">perro</h3>
              <span className="text-[11px] text-[#5b7b66] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#5b7b66] rounded-full animate-pulse"></span> IA Activa
              </span>
            </div>
          </div>

          {/* Selector de Pestañas (Pill Central) */}
          <nav className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('citas')}
              className={`px-4 py-1.5 rounded-xl transition ${
                activeTab === 'citas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📅 Citas
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-1.5 rounded-xl transition ${
                activeTab === 'clientes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 Clientes (0)
            </button>
            <button
              onClick={() => setActiveTab('automatizaciones')}
              className={`px-4 py-1.5 rounded-xl transition ${
                activeTab === 'automatizaciones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🤖 Automatizaciones
            </button>
            <button
              onClick={() => setActiveTab('ajustes')}
              className={`px-4 py-1.5 rounded-xl transition ${
                activeTab === 'ajustes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⚙️ Ajustes
            </button>
          </nav>

          {/* Idioma / Salir */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-[10px] font-bold">
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded-lg">ES</span>
              <span className="text-slate-400 px-2 py-0.5">EN</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium ml-2"
            >
              Salir
            </button>
          </div>

        </div>
      </header>

      {/* 2. CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-6">

        {/* PESTAÑA 1: CITAS Y CALENDARIO */}
        {activeTab === 'citas' && (
          <div className="space-y-6">
            
            {/* Tarjeta de Calendario */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Septiembre 2026</h3>
                <div className="flex items-center gap-2">
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-600">‹</button>
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-600">›</button>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <span className="bg-slate-900 text-white px-3 py-1 rounded-full font-bold">Hoy</span>
                <span className="text-slate-400 px-3 py-1">Mañana</span>
              </div>

              {/* Días del Calendario */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs py-2 text-slate-400 font-medium">
                <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                <span className="py-2 text-slate-700">7</span>
                <span className="py-2 bg-[#5b7b66] text-white font-bold rounded-xl shadow-sm">8</span>
                <span className="py-2 text-slate-700">9</span>
                <span className="py-2 text-slate-700">10</span>
                <span className="py-2 text-slate-700">11</span>
                <span className="py-2 text-slate-700">12</span>
                <span className="py-2 text-slate-700">13</span>
              </div>
            </div>

            {/* Tarjeta de Ingresos Verde Musgo */}
            <div className="bg-[#5b7b66] text-white p-6 rounded-2xl shadow-sm space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Ingresos del Día</p>
              <h2 className="text-3xl font-extrabold">€0 EUR</h2>
              <p className="text-xs text-emerald-100/80">Se calcula automáticamente con las citas marcadas como Completada.</p>
            </div>

            {/* Banner Informativo Crema */}
            <div className="bg-[#fef9e7] border border-[#fde047]/40 p-3.5 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-medium">
              <span>✨</span>
              <span>Los nuevos clientes se guardan automáticamente en tu directorio al agendar.</span>
            </div>

            {/* Sección Agenda del Día */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Agenda del 2026-09-08</h3>
                  <p className="text-xs text-slate-400">0 citas agendadas para esta fecha</p>
                </div>
                <button className="bg-[#5b7b66] hover:bg-[#4d6957] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition">
                  + + Agendar nueva cita
                </button>
              </div>

              {/* Estado Vacío */}
              <div className="py-12 text-center space-y-3 border border-dashed border-slate-200 rounded-xl">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg">
                  📅
                </div>
                <p className="text-xs font-semibold text-slate-700">¡Todo listo! No hay citas programadas para este día.</p>
                <button className="bg-[#5b7b66] hover:bg-[#4d6957] text-white font-semibold text-xs px-4 py-2 rounded-xl transition">
                  + Agendar primera cita
                </button>
              </div>
            </div>

          </div>
        )}

        {/* PESTAÑA 2: CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Directorio de clientes</h2>
                <p className="text-xs text-slate-400">Se genera automáticamente desde tus agendamientos.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none w-56"
                />
                <button className="bg-[#5b7b66] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#4d6957]">
                  + Agregar cliente
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                👥
              </div>
              <h4 className="text-sm font-bold text-slate-800">Aún no tienes clientes registrados</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Se agregarán solos en cuanto agendes una cita, o puedes sumarlos manualmente.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: AUTOMATIZACIONES */}
        {activeTab === 'automatizaciones' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Centro de automatizaciones IA</h2>
              <p className="text-xs text-slate-400">Deja que la IA se encargue del trabajo repetitivo.</p>
            </div>

            {/* Configuración de Toggles */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center p-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Recordatorios automáticos por WhatsApp</h4>
                    <p className="text-[11px] text-slate-400">Envía aviso de confirmación 24h antes de la cita.</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-[#5b7b66] rounded-full flex items-center justify-end px-0.5 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📞</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Asistente telefónico IA para agendamiento</h4>
                    <p className="text-[11px] text-slate-400">Atiende llamadas perdidas y agenda directamente en la app.</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-[#5b7b66] rounded-full flex items-center justify-end px-0.5 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Transcripción en Vivo de la IA (Caja Oscura) */}
            <div className="bg-[#111827] text-white rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>📺</span> Transcripción reciente de IA
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ejemplo simulado</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl max-w-xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">Cliente</span>
                  <p className="text-slate-200">Hola, me gustaría agendar un corte para mañana a las 4pm.</p>
                </div>

                <div className="bg-[#5b7b66]/30 border border-[#5b7b66]/50 p-3 rounded-xl max-w-xs ml-auto space-y-1 text-right">
                  <span className="text-[10px] text-emerald-300 font-semibold block">IA</span>
                  <p className="text-emerald-100">¡Claro! Tengo disponible las 4:00 PM. ¿Me das tu nombre?</p>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl max-w-xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">Cliente</span>
                  <p className="text-slate-200">Carlos Gómez.</p>
                </div>

                <div className="bg-[#5b7b66]/30 border border-[#5b7b66]/50 p-3 rounded-xl max-w-xs ml-auto space-y-1 text-right">
                  <span className="text-[10px] text-emerald-300 font-semibold block">IA</span>
                  <p className="text-emerald-100">¡Listo Carlos! Tu cita quedó agendada y guardada en el sistema.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: AJUSTES EXACTO A TUS CAPTURAS */}
        {activeTab === 'ajustes' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ajustes</h2>
              <p className="text-xs text-slate-400">Actualiza la información de tu negocio en cualquier momento.</p>
            </div>

            {/* Información del negocio */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Información del negocio</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nombre del negocio</label>
                  <input
                    type="text"
                    defaultValue="perro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    defaultValue="oeoeo@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Selección de Moneda */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Moneda</label>
                  <div className="flex gap-2">
                    {['MXN $', 'USD $', 'EUR €'].map((curr) => (
                      <button
                        key={curr}
                        onClick={() => setSelectedCurrency(curr)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                          selectedCurrency.includes(curr.split(' ')[0])
                            ? 'bg-[#5b7b66] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario de Atención */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Horario abre</label>
                    <input
                      type="text"
                      defaultValue="09:00 a.m."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Horario cierra</label>
                    <input
                      type="text"
                      defaultValue="07:00 p.m."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gestión de Servicios con Duración */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Servicios</h3>

              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-500">{s.price} €</span>
                      <span className="text-slate-500">{s.duration} min</span>
                      <button onClick={() => setServices(services.filter(x => x.id !== s.id))} className="text-slate-400 hover:text-red-500">🗑</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Nuevo servicio"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs flex-1"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs w-20"
                />
                <input
                  type="number"
                  placeholder="Min"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs w-20"
                />
                <button onClick={addService} className="text-xs font-bold text-[#5b7b66] hover:underline px-2">
                  + Agregar servicio
                </button>
              </div>
            </div>

            {/* Personal / Especialistas */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Personal / Especialistas</h3>

              <div className="space-y-2">
                {staff.map((person, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs">
                    <span className="font-semibold text-slate-800">{person}</span>
                    <button onClick={() => setStaff(staff.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">🗑</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Nombre de especialista"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs flex-1"
                />
                <button onClick={addStaff} className="text-xs font-bold text-[#5b7b66] hover:underline px-2">
                  + Agregar
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
