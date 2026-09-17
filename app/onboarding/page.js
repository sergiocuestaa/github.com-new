'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState('Salud / Clínica Dental');
  const [services, setServices] = useState([
    { id: 1, name: 'Consulta General', price: '30', duration: '30' },
    { id: 2, name: 'Limpieza Dental', price: '50', duration: '45' }
  ]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [specialNotes, setSpecialNotes] = useState('No aceptamos pago con tarjeta.');

  const addService = () => {
    if (newServiceName && newServicePrice && newServiceDuration) {
      setServices([
        ...services,
        { id: Date.now(), name: newServiceName, price: newServicePrice, duration: newServiceDuration }
      ]);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('30');
    }
  };

  const removeService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col items-center justify-center px-4 py-12 font-sans">
      
      {/* Banner Crema Amigable */}
      <div className="max-w-xl w-full bg-[#fef9e7] border border-[#fde047]/40 p-4 rounded-2xl mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">✨</span>
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Prueba Gratuita Activada</h4>
            <p className="text-xs text-amber-800/80">Configura tu asistente de IA en 3 sencillos pasos</p>
          </div>
        </div>
        <span className="bg-[#5b7b66] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">100% Gratis</span>
      </div>

      <div className="max-w-xl w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* Barra de Pasos */}
        <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-100 pb-4">
          <span className={step >= 1 ? 'text-[#5b7b66] font-bold' : 'text-slate-400'}>
            1. Datos del Negocio
          </span>
          <span className={step >= 2 ? 'text-[#5b7b66] font-bold' : 'text-slate-400'}>
            2. Servicios y Tiempos
          </span>
          <span className={step >= 3 ? 'text-[#5b7b66] font-bold' : 'text-slate-400'}>
            3. Reglas de la IA
          </span>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Datos de tu Negocio</h2>
              <p className="text-xs text-slate-500">Información básica para personalizar las respuestas de la IA.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre del Negocio *</label>
                <input
                  type="text"
                  placeholder="Ej. Clínica Dental Sonrisas"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5b7b66] text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sector / Industria</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5b7b66] text-slate-800"
                >
                  <option value="Salud / Clínica Dental">Salud / Clínica Dental</option>
                  <option value="Barbería / Estética">Barbería / Salón de Belleza</option>
                  <option value="Restaurante / Cafetería">Restaurante / Cafetería</option>
                  <option value="Gimnasio / Entrenador">Gimnasio / Entrenador Personal</option>
                  <option value="Servicios Profesionales">Servicios Profesionales / Asesoría</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push('/')}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm transition"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!businessName.trim()}
                className="w-2/3 bg-[#5b7b66] hover:bg-[#4d6957] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Siguiente: Servicios y Precios →
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: INCLUYE DURACIÓN */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Servicios, Tarifas y Duración</h2>
              <p className="text-xs text-slate-500">Agrega los servicios y la duración aproximada para agendar las citas.</p>
            </div>

            {/* Listado de Servicios */}
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="flex justify-between items-center bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{s.name}</span>
                    <span className="text-[11px] text-slate-500">⏱ {s.duration} min</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#5b7b66] text-sm">{s.price} €</span>
                    <button
                      onClick={() => removeService(s.id)}
                      className="text-slate-400 hover:text-red-500 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Añadir servicio nuevo */}
            <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Añadir Nuevo Servicio</p>
              <div className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Servicio"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="col-span-5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#5b7b66]"
                />
                <input
                  type="number"
                  placeholder="Precio (€)"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="col-span-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#5b7b66]"
                />
                <input
                  type="number"
                  placeholder="Minutos"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  className="col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#5b7b66]"
                />
                <button
                  onClick={addService}
                  className="col-span-2 bg-[#5b7b66] text-white font-bold rounded-lg text-xs hover:bg-[#4d6957]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm transition"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={services.length === 0}
                className="w-2/3 bg-[#5b7b66] hover:bg-[#4d6957] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Siguiente: Reglas de la IA →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Reglas de la IA</h2>
              <p className="text-xs text-slate-500">Indicaciones especiales para el comportamiento del bot.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Notas o políticas de atención</label>
              <textarea
                rows={3}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Ej. No se acepta pago con tarjeta. Cancelación previa de 24h."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#5b7b66] text-slate-900 leading-relaxed"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm transition"
              >
                Atrás
              </button>
              <button
                onClick={() => router.push('/connect-whatsapp')}
                className="w-2/3 bg-[#5b7b66] hover:bg-[#4d6957] text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Siguiente: Vincular WhatsApp 📲
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
