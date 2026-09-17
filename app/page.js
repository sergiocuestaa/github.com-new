'use client';
import { useState } from 'react';

export default function SoftwareDemo() {
  // PANTALLAS DEL SISTEMA: 'landing' | 'onboarding' | 'whatsapp' | 'dashboard'
  const [currentStep, setCurrentStep] = useState('landing');

  // IDIOMA GLOBAL
  const [lang, setLang] = useState('es');

  // NICHO SELECCIONADO EN LANDING
  const [selectedNiche, setSelectedNiche] = useState('dentistas');

  // DATOS DEL NEGOCIO
  const [nombreNegocio, setNombreNegocio] = useState('Clínica Dental Cuesta');
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState('+34 600 000 000');
  const [servicios, setServicios] = useState([
    { id: '1', nombre: 'Limpieza Dental & Valoración', precio: 50, duracion: '45 min' },
    { id: '2', nombre: 'Tratamiento Blanqueamiento', precio: 180, duracion: '60 min' }
  ]);

  // ESTADO DEL DASHBOARD
  const [activeTab, setActiveTab] = useState('citas');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AUTOMATIZACIONES
  const [automatizaciones, setAutomatizaciones] = useState({
    whatsappAuto: true,
    recordatorios24h: true,
    solicitarReseña: true
  });

  // BASE DE DATOS DE CITAS
  const [citas, setCitas] = useState([
    {
      id: '1',
      cliente: 'Carlos Mendoza',
      telefono: '+34 612 345 678',
      servicio: 'Limpieza Dental & Valoración',
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '10:30',
      horaFin: '11:15',
      precio: 50,
      estado: 'completada'
    },
    {
      id: '2',
      cliente: 'Dra. Andrea Gómez',
      telefono: '+34 698 765 432',
      servicio: 'Tratamiento Blanqueamiento',
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '16:00',
      horaFin: '17:00',
      precio: 180,
      estado: 'confirmada'
    }
  ]);

  // FORMULARIO NUEVA CITA
  const [nuevaCita, setNuevaCita] = useState({
    cliente: '',
    telefono: '',
    servicio: 'Limpieza Dental & Valoración',
    fecha: selectedDate,
    horaInicio: '12:00',
    horaFin: '12:45',
    precio: 50,
    estado: 'confirmada'
  });

  // CÁLCULOS
  const citasDelDia = citas.filter(c => c.fecha === selectedDate);
  const ingresosDelDia = citasDelDia
    .filter(c => c.estado === 'completada')
    .reduce((total, c) => total + Number(c.precio || 0), 0);

  // ACCIONES DE CITAS
  const handleCrearCita = (e) => {
    e.preventDefault();
    if (!nuevaCita.cliente || !nuevaCita.telefono) return;

    const citaCreada = {
      ...nuevaCita,
      id: Date.now().toString(),
      precio: Number(nuevaCita.precio)
    };

    setCitas([...citas, citaCreada]);
    setIsModalOpen(false);
    setNuevaCita({
      cliente: '',
      telefono: '',
      servicio: 'Limpieza Dental & Valoración',
      fecha: selectedDate,
      horaInicio: '12:00',
      horaFin: '12:45',
      precio: 50,
      estado: 'confirmada'
    });
  };

  const cambiarEstadoCita = (id, nuevoEstado) => {
    setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
  };

  const eliminarCita = (id) => {
    setCitas(citas.filter(c => c.id !== id));
  };

  // DESPLAZAMIENTO SUAVE A LOS PLANES
  const scrollToPlanes = () => {
    const el = document.getElementById('seccion-planes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-[#587b6a] selection:text-white ${
      currentStep === 'landing' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>

      {/* BARRA SUPERIOR DE NAVEGACIÓN (VISIBLE FUERA DE LA LANDING) */}
      {currentStep !== 'landing' && (
        <div className="bg-slate-900 border-b border-slate-800 text-white py-2.5 px-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#587b6a] animate-pulse"></span>
              <span className="font-mono text-slate-300 font-semibold uppercase tracking-wider">ENTORNO DE SOFTWARE (VISTA CLIENTE)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentStep('landing')}
                className="px-3 py-1 rounded-lg font-semibold transition text-slate-300 hover:text-white cursor-pointer"
              >
                ← Volver a Landing
              </button>
              <button
                onClick={() => setCurrentStep('onboarding')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  currentStep === 'onboarding' ? 'bg-[#587b6a] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Registro
              </button>
              <button
                onClick={() => setCurrentStep('whatsapp')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  currentStep === 'whatsapp' ? 'bg-[#587b6a] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Agente IA
              </button>
              <button
                onClick={() => setCurrentStep('dashboard')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  currentStep === 'dashboard' ? 'bg-[#587b6a] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LANDING PAGE                                                              */}
      {/* ========================================================================= */}
      {currentStep === 'landing' && (
        <div className="space-y-16 pb-20">
          
          {/* HEADER NAV */}
          <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-4 px-6 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#587b6a] text-white font-bold flex items-center justify-center text-sm shadow-md shadow-[#587b6a]/20">
                  C
                </div>
                <span className="font-bold text-slate-100 text-base tracking-tight">Cuesta Automation</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={scrollToPlanes}
                  className="bg-[#587b6a] hover:bg-[#466355] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-[#587b6a]/25 cursor-pointer active:scale-95"
                >
                  Empezar ahora
                </button>
              </div>
            </div>
          </header>

          {/* HERO SECTION */}
          <section className="max-w-4xl mx-auto px-4 text-center space-y-6 pt-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-medium bg-[#587b6a]/15 text-emerald-300 border border-[#587b6a]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Agente IA de Agendamiento 24/7 para WhatsApp
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Recupera las citas que hoy pierdes por <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-[#587b6a]">no responder a tiempo.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Atiende a cada cliente por WhatsApp al instante, responde dudas y agenda citas automáticamente sin contratar más personal.
            </p>

            {/* CARD ROI */}
            <div className="max-w-xl mx-auto bg-slate-900/90 border border-[#587b6a]/40 rounded-xl p-4 shadow-xl text-left space-y-1">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                💡 EL SOFTWARE SE PAGA SOLO:
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                Con <span className="text-white font-bold underline decoration-[#587b6a] decoration-2">un solo servicio o tratamiento dental recuperado</span> al mes, el sistema cubre su coste. Todo lo demás es margen directo para tu negocio.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={scrollToPlanes}
                className="bg-[#587b6a] hover:bg-[#466355] text-white font-bold text-xs px-8 py-3.5 rounded-xl transition shadow-xl shadow-[#587b6a]/30 cursor-pointer active:scale-95"
              >
                Empezar ahora →
              </button>
            </div>
          </section>

          {/* SECTOR SELECTOR */}
          <section className="max-w-4xl mx-auto px-4 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Especializado en tu sector
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona tu rubro para ver cómo funciona:
              </p>
            </div>

            <div className="flex justify-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setSelectedNiche('dentistas')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedNiche === 'dentistas'
                    ? 'bg-[#587b6a] text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🦷 Clínicas Dentales
              </button>
              <button
                onClick={() => setSelectedNiche('barberias')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedNiche === 'barberias'
                    ? 'bg-[#587b6a] text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                💈 Barberías
              </button>
              <button
                onClick={() => setSelectedNiche('restaurantes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedNiche === 'restaurantes'
                    ? 'bg-[#587b6a] text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ☕ Cafeterías & Restaurantes
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                {selectedNiche === 'dentistas' && (
                  <>
                    <h3 className="text-xl font-bold text-white">Captación Inmediata de Pacientes</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      El primer centro dental que responde se queda con el paciente. El agente cualifica la consulta y asegura la cita al instante.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">✓ Agendamiento automático 24/7.</li>
                      <li className="flex items-center gap-2">✓ Recordatorios anti-ausencia.</li>
                    </ul>
                  </>
                )}

                {selectedNiche === 'barberias' && (
                  <>
                    <h3 className="text-xl font-bold text-white">Agenda Llenas Sin Interrupciones</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tus clientes eligen su horario y barbero por WhatsApp mientras tú sigues cortando sin soltar las tijeras.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">✓ Selección de barbero y servicio.</li>
                      <li className="flex items-center gap-2">✓ Solicitud de reseñas 5 estrellas.</li>
                    </ul>
                  </>
                )}

                {selectedNiche === 'restaurantes' && (
                  <>
                    <h3 className="text-xl font-bold text-white">Reservas Confirmadas al Momento</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Gestiona número de comensales y horarios en horas de máximo trabajo sin saturar la recepción.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">✓ Confirmación automática de mesas.</li>
                      <li className="flex items-center gap-2">✓ Envío inmediato del menú por chat.</li>
                    </ul>
                  </>
                )}

                <div className="pt-1">
                  <button
                    onClick={scrollToPlanes}
                    className="bg-[#587b6a] hover:bg-[#466355] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Probar en mi negocio →
                  </button>
                </div>
              </div>

              {/* MUESTRA VISUAL ESTÁTICA */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-400">
                  <span className="font-bold text-slate-200">WhatsApp en tiempo real</span>
                  <span className="text-emerald-400 font-mono">ACTIVO</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 max-w-[85%]">
                  <p className="text-[9px] text-slate-500 font-bold">Cliente</p>
                  {selectedNiche === 'dentistas' && 'Hola, quiero pedir cita para una revisión esta semana.'}
                  {selectedNiche === 'barberias' && 'Buenas! Tenéis hueco para un corte hoy a las 17:00?'}
                  {selectedNiche === 'restaurantes' && 'Hola, quisiera reservar para 4 personas este sábado.'}
                </div>

                <div className="bg-[#587b6a] text-white p-2.5 rounded-xl max-w-[85%] ml-auto shadow-sm">
                  <p className="text-[9px] text-emerald-100 font-bold">Agente IA</p>
                  {selectedNiche === 'dentistas' && '¡Hola! Claro. Tengo sitio este Jueves a las 11:00 o Viernes a las 16:30. ¿Cuál prefieres?'}
                  {selectedNiche === 'barberias' && '¡Hola! Disponible a las 17:30 con Mateo. ¿Te lo reservo?'}
                  {selectedNiche === 'restaurantes' && '¡Hola! Con gusto. Mesa libre a las 21:30 para 4. ¿A qué nombre anoto la reserva?'}
                </div>
              </div>
            </div>
          </section>

          {/* TABLA DE PLANES */}
          <section id="seccion-planes" className="max-w-5xl mx-auto px-4 space-y-8 pt-4">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Planes Transparentes y Escalables
              </h2>
              <p className="text-xs text-slate-400">
                Elige la opción que mejor se adapte a tu estructura actual:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              
              {/* STARTER */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Solo / Individual
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3">Starter</h3>
                    <p className="text-xs text-slate-400 mt-1">1 Profesional autónomo</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">29€</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                    <li className="flex items-center gap-2">✓ <strong>1 Profesional</strong> (1 agenda)</li>
                    <li className="flex items-center gap-2">✓ Hasta 150 citas / mes</li>
                    <li className="flex items-center gap-2">✓ Agente IA para reservas 24/7</li>
                    <li className="flex items-center gap-2">✓ Recordatorios automáticos</li>
                    <li className="flex items-center gap-2">✓ Integración con WhatsApp</li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentStep('onboarding')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  Seleccionar Starter
                </button>
              </div>

              {/* GROWTH */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Equipo Pequeño
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3">Growth</h3>
                    <p className="text-xs text-slate-400 mt-1">Hasta 3 profesionales</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">49€</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                    <li className="flex items-center gap-2">✓ <strong>Hasta 3 Profesionales</strong></li>
                    <li className="flex items-center gap-2">✓ Hasta 500 citas / mes</li>
                    <li className="flex items-center gap-2">✓ Todo lo del plan Starter</li>
                    <li className="flex items-center gap-2">✓ Reagendación automática</li>
                    <li className="flex items-center gap-2">✓ Analítica básica de ingresos</li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentStep('onboarding')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  Seleccionar Growth
                </button>
              </div>

              {/* UNLIMITED */}
              <div className="bg-slate-900 border-2 border-[#587b6a] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#587b6a] text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  MÁXIMO VALOR
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-[#587b6a]/20 px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#587b6a]/30">
                      MÁS POPULAR
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3">Unlimited</h3>
                    <p className="text-xs text-slate-400 mt-1">Sin límites de uso</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">59€</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-200 border-t border-slate-800 pt-4">
                    <li className="flex items-center gap-2">✓ <strong>Profesionales ILIMITADOS</strong></li>
                    <li className="flex items-center gap-2">✓ <strong>Citas e interacciones ILIMITADAS</strong></li>
                    <li className="flex items-center gap-2">✓ Reactivación automática de clientes antiguos</li>
                    <li className="flex items-center gap-2">✓ Dashboard financiero completo</li>
                    <li className="flex items-center gap-2">✓ Onboarding personalizado incluido</li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentStep('onboarding')}
                  className="w-full bg-[#587b6a] hover:bg-[#466355] text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-[#587b6a]/30 cursor-pointer active:scale-95"
                >
                  Elegir Plan Unlimited →
                </button>
              </div>

            </div>

            <p className="text-center text-[11px] text-slate-500 font-medium">
              * ¿Necesitas múltiples sucursales? Añade sedes o números adicionales por solo +15€/mes cada uno.
            </p>
          </section>

          {/* CTA FINAL */}
          <section className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-slate-900 border border-[#587b6a]/40 p-8 rounded-3xl space-y-4 shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Empieza a agendar clientes en piloto automático
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configuración lista en menos de 3 minutos. Sin contratos permanentes.
              </p>
              <div>
                <button
                  onClick={scrollToPlanes}
                  className="bg-[#587b6a] hover:bg-[#466355] text-white font-bold text-xs px-8 py-3.5 rounded-xl transition shadow-xl shadow-[#587b6a]/30 cursor-pointer active:scale-95"
                >
                  Elegir mi plan →
                </button>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 1: ONBOARDING / REGISTRO DEL NEGOCIO                                 */}
      {/* ========================================================================= */}
      {currentStep === 'onboarding' && (
        <div className="max-w-2xl mx-auto p-4 md:p-6 pt-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold text-[#587b6a] bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-100">
                Paso 1 de 3
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Configuración Inicial del Negocio</h1>
              <p className="text-xs text-slate-500 mt-0.5">Ingresa los datos para alimentar la IA de agendamiento.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre Comercial</label>
                <input
                  type="text"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#587b6a] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Teléfono WhatsApp</label>
                <input
                  type="text"
                  value={telefonoWhatsApp}
                  onChange={(e) => setTelefonoWhatsApp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#587b6a] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Servicios Principales</label>
                <div className="space-y-2">
                  {servicios.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                      <span className="font-semibold">{s.nombre} ({s.duracion})</span>
                      <span className="font-bold text-[#587b6a]">€{s.precio} EUR</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCurrentStep('whatsapp')}
                  className="bg-[#587b6a] hover:bg-[#466355] text-white px-6 py-3 rounded-xl font-bold text-xs transition shadow-md shadow-[#587b6a]/20 cursor-pointer active:scale-95"
                >
                  Continuar a Conexión IA →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: VINCULACIÓN DE WHATSAPP                                           */}
      {/* ========================================================================= */}
      {currentStep === 'whatsapp' && (
        <div className="max-w-2xl mx-auto p-4 md:p-6 pt-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold text-[#587b6a] bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-100">
                Paso 2 de 3
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Conexión con WhatsApp & IA</h1>
              <p className="text-xs text-slate-500 mt-0.5">Vincula la línea para activar las respuestas automáticas.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-4">
                <div className="w-36 h-36 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between items-center">
                  <div className="flex justify-between w-full">
                    <div className="w-6 h-6 bg-slate-200 rounded"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded"></div>
                  </div>
                  <div className="text-[9px] text-[#587b6a] font-mono font-bold tracking-wider uppercase">WA_CONNECTED</div>
                  <div className="flex justify-between w-full">
                    <div className="w-6 h-6 bg-slate-200 rounded"></div>
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Línea Conectada
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Simulación en tiempo real</h3>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-bold">Cliente</p>
                    Hola, ¿tienen disponibilidad para agendar hoy?
                  </div>
                  <div className="bg-[#587b6a] text-white p-2.5 rounded-lg ml-auto max-w-[90%] shadow-sm">
                    <p className="text-[9px] text-emerald-100 font-bold">IA {nombreNegocio}</p>
                    ¡Hola! Sí, tengo sitio disponible a las 16:00 y 17:30. ¿Cuál te va mejor?
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep('dashboard')}
                    className="bg-[#587b6a] hover:bg-[#466355] text-white px-6 py-3 rounded-xl font-bold text-xs transition shadow-md shadow-[#587b6a]/20 cursor-pointer active:scale-95"
                  >
                    Ir al Dashboard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: DASHBOARD PRINCIPAL                                               */}
      {/* ========================================================================= */}
      {currentStep === 'dashboard' && (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pt-6">
          
          <header className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#587b6a] text-white font-bold flex items-center justify-center text-lg uppercase shadow-md shadow-[#587b6a]/20">
                {nombreNegocio.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base leading-tight">{nombreNegocio}</h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Agente IA Activo
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('citas')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'citas' ? 'bg-[#587b6a] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📅 Citas
                </button>
                <button
                  onClick={() => setActiveTab('clientes')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'clientes' ? 'bg-[#587b6a] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👥 Clientes ({citas.length})
                </button>
                <button
                  onClick={() => setActiveTab('automations')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'automations' ? 'bg-[#587b6a] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🤖 Automatizaciones
                </button>
              </nav>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setLang('es')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${lang === 'es' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  EN
                </button>
              </div>
            </div>
          </header>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm min-h-[380px]">

            {activeTab === 'citas' && (
              <div className="space-y-5">
                <div className="bg-[#587b6a] text-white p-5 rounded-xl shadow-md space-y-1">
                  <p className="text-[10px] font-bold tracking-wider text-emerald-100 uppercase">
                    INGRESOS DEL DÍA (COMPLETADOS)
                  </p>
                  <h1 className="text-3xl font-extrabold tracking-tight">€{ingresosDelDia} EUR</h1>
                  <p className="text-xs text-emerald-100/90">
                    Calculado automáticamente con base en el valor de las citas finalizadas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Agenda del</h3>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-900 outline-none focus:border-[#587b6a]"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setNuevaCita({ ...nuevaCita, fecha: selectedDate });
                      setIsModalOpen(true);
                    }}
                    className="bg-[#587b6a] hover:bg-[#466355] text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                  >
                    + Agendar cita
                  </button>
                </div>

                {citasDelDia.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-xl">
                    No hay citas agendadas para esta fecha.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {citasDelDia.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-[#587b6a]">{c.horaInicio} - {c.horaFin}</span>
                          <p className="font-bold text-slate-900 text-xs mt-0.5">
                            {c.cliente} <span className="text-[11px] font-normal text-slate-500">({c.telefono})</span>
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {c.servicio} • <span className="font-bold text-[#587b6a]">€{c.precio} EUR</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            c.estado === 'completada' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            c.estado === 'confirmada' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {c.estado}
                          </span>

                          {c.estado !== 'completada' && (
                            <button
                              onClick={() => cambiarEstadoCita(c.id, 'completada')}
                              className="text-xs bg-[#587b6a] hover:bg-[#466355] text-white font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer shadow-sm"
                            >
                              ✓
                            </button>
                          )}

                          {c.estado !== 'cancelada' && (
                            <button
                              onClick={() => cambiarEstadoCita(c.id, 'cancelada')}
                              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                            >
                              ✕
                            </button>
                          )}

                          <button
                            onClick={() => eliminarCita(c.id)}
                            className="text-xs text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'automations' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Automatizaciones de WhatsApp</h3>
                  <p className="text-xs text-slate-500">Ajustes activos para optimizar tu tiempo.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Respuesta Automática WhatsApp IA</h4>
                      <p className="text-[11px] text-slate-500">Atención y reserva 24/7 en segundo plano.</p>
                    </div>
                    <button
                      onClick={() => setAutomatizaciones({ ...automatizaciones, whatsappAuto: !automatizaciones.whatsappAuto })}
                      className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                        automatizaciones.whatsappAuto ? 'bg-[#587b6a]' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Recordatorios Anti-Ausencias (24h)</h4>
                      <p className="text-[11px] text-slate-500">Mensajes de reconfirmación previa.</p>
                    </div>
                    <button
                      onClick={() => setAutomatizaciones({ ...automatizaciones, recordatorios24h: !automatizaciones.recordatorios24h })}
                      className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                        automatizaciones.recordatorios24h ? 'bg-[#587b6a]' : 'bg-slate-300'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Directorio de Clientes</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {citas.map((c, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{c.cliente}</p>
                        <p className="text-[11px] text-slate-500">{c.telefono}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-[#587b6a] border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Registrado
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR CITA MANUAL                                                  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agendar Cita Manual</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCrearCita} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Dra. Andrea Gómez"
                  value={nuevaCita.cliente}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, cliente: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 outline-none focus:border-[#587b6a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  placeholder="+34 600 000 000"
                  value={nuevaCita.telefono}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, telefono: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 outline-none focus:border-[#587b6a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={nuevaCita.fecha}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    required
                    value={nuevaCita.precio}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, precio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#587b6a] hover:bg-[#466355] text-white px-5 py-2 rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}