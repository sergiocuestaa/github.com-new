'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectWhatsApp() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const handleSimulateScan = () => {
    if (!phone) return;
    setIsLinking(true);
    setTimeout(() => {
      setIsLinking(false);
      setIsConnected(true);
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-xl w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vincular WhatsApp</h2>
          <p className="text-xs text-slate-500">Ingresa tu teléfono y escanea el código QR para activar la IA.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Número de WhatsApp del Negocio</label>
            <input
              type="tel"
              placeholder="Ej. +34 612 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5b7b66] text-slate-900"
            />
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
            {!isConnected ? (
              <>
                <div className="relative">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <svg className="w-36 h-36 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h1v2h-1v-2zm-3 0h2v1h-2v-1zm4 1h1v1h-1v-1zm1-1h2v2h-2v-2zm0 3h1v2h-1v-2zm-2 0h1v1h-1v-1zm-2 1h2v1h-2v-1zm3 1h2v2h-2v-2zm-1 1h1v1h-1v-1zm-4-3h1v1h-1v-1zm1 2h1v1h-1v-1zm-2-1h1v2h-1v-2z" />
                    </svg>
                  </div>
                  {isLinking && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
                      <div className="w-7 h-7 border-2 border-[#5b7b66] border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-xs font-semibold text-[#5b7b66]">Conectando...</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  En WhatsApp: Menu ➔ Dispositivos vinculados ➔ Escanear QR
                </p>

                <button
                  onClick={handleSimulateScan}
                  disabled={!phone || isLinking}
                  className="text-xs text-[#5b7b66] underline font-bold hover:text-[#4d6957] disabled:opacity-40"
                >
                  Simular escaneo de QR (Comprobar conexión)
                </button>
              </>
            ) : (
              <div className="py-4 space-y-2">
                <div className="w-12 h-12 bg-[#5b7b66]/10 text-[#5b7b66] rounded-full flex items-center justify-center mx-auto border border-[#5b7b66]/20 text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-900">¡WhatsApp Conectado!</h4>
                <p className="text-xs text-slate-500">Número activo: <span className="text-[#5b7b66] font-semibold">{phone}</span></p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push('/onboarding')} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm">Atrás</button>
            <button
              onClick={() => router.push('/dashboard')}
              disabled={!isConnected}
              className="w-2/3 bg-[#5b7b66] hover:bg-[#4d6957] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition"
            >
              Ir al CRM / Panel 🚀
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
