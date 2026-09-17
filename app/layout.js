import './globals.css';

export const metadata = {
  title: 'High-Ticket Clinical CRM',
  description: 'Gestión clínica de alto valor integrada con Agente de IA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#08090a] text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
